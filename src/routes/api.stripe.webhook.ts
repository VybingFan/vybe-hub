import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
        }

        try {
          const [stripeServer, { supabaseAdmin }] = await Promise.all([
            import("@/integrations/stripe/server"),
            import("@/integrations/supabase/client.server"),
          ]);
          const stripe = stripeServer.getStripe();
          const payload = await request.text();
          const event = await stripe.webhooks.constructEventAsync(
            payload,
            signature,
            stripeServer.getStripeWebhookSecret(),
            undefined,
            Stripe.createSubtleCryptoProvider(),
          );

          const { data: seen } = await supabaseAdmin
            .from("stripe_webhook_events")
            .select("event_id")
            .eq("event_id", event.id)
            .eq("outcome", "processed")
            .maybeSingle();
          if (seen) return Response.json({ received: true, duplicate: true });

          let outcome: "processed" | "ignored" = "ignored";
          if (
            event.type === "customer.subscription.created" ||
            event.type === "customer.subscription.updated" ||
            event.type === "customer.subscription.deleted"
          ) {
            outcome = (await syncSubscription(event.data.object, event.created))
              ? "processed"
              : "ignored";
          } else if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const subscriptionId = stripeServer.stripeId(session.subscription);
            if (subscriptionId) {
              outcome = (await syncSubscription(
                await stripe.subscriptions.retrieve(subscriptionId),
                event.created,
              ))
                ? "processed"
                : "ignored";
            }
          }

          await supabaseAdmin.from("stripe_webhook_events").upsert({
            event_id: event.id,
            event_type: event.type,
            event_created: event.created,
            outcome,
            processed_at: new Date().toISOString(),
          });
          return Response.json({ received: true });
        } catch (error) {
          console.error("[Stripe webhook]", error);
          return Response.json(
            { error: error instanceof Error ? error.message : "Webhook processing failed." },
            { status: 400 },
          );
        }
      },
    },
  },
});

async function syncSubscription(subscription: Stripe.Subscription, eventCreated: number) {
  const [{ supabaseAdmin }, stripeServer] = await Promise.all([
    import("@/integrations/supabase/client.server"),
    import("@/integrations/stripe/server"),
  ]);
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) return false;
  const socialSelection = stripeServer.socialDiscoverySelectionForPrice(priceId);
  if (socialSelection) {
    return syncSocialDiscoverySubscription(subscription, socialSelection, eventCreated);
  }
  const focusSelection = stripeServer.focusSelectionForPrice(priceId);
  if (focusSelection) {
    return syncFocusSubscription(subscription, focusSelection, eventCreated);
  }
  const selection = stripeServer.selectionForPrice(priceId);
  if (!selection) {
    if (subscription.metadata.vybe_user_id) {
      throw new Error(`VYBE subscription ${subscription.id} uses an unconfigured Stripe price.`);
    }
    return false;
  }

  const customerRef = stripeServer.stripeId(subscription.customer);
  let userId = subscription.metadata.vybe_user_id;
  if (!userId) {
    const { data } = await supabaseAdmin
      .from("account_entitlements")
      .select("user_id")
      .or(
        `billing_subscription_ref.eq.${subscription.id}${
          customerRef ? `,billing_customer_ref.eq.${customerRef}` : ""
        }`,
      )
      .limit(1)
      .maybeSingle();
    userId = data?.user_id || "";
  }
  if (!userId) return false;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("account_entitlements")
    .select("plan_code, last_billing_event_created")
    .eq("user_id", userId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.plan_code === "founding_beta") {
    return false;
  }
  if ((existing?.last_billing_event_created || 0) > eventCreated) return false;

  const paidAccessStatuses = ["active", "trialing", "past_due"];
  if (paidAccessStatuses.includes(subscription.status)) {
    const { error } = await supabaseAdmin.from("account_entitlements").upsert({
      user_id: userId,
      ...stripeServer.activeSubscriptionUpdate(subscription, selection, eventCreated),
    });
    if (error) throw error;
    return true;
  }

  if (["canceled", "unpaid", "incomplete_expired"].includes(subscription.status)) {
    const { error } = await supabaseAdmin.from("account_entitlements").upsert({
      user_id: userId,
      plan_code: "creator_free",
      status: "active",
      recognition_code: null,
      billing_interval: null,
      billing_provider: "stripe",
      billing_customer_ref: customerRef,
      billing_subscription_ref: null,
      stripe_subscription_status: subscription.status,
      current_period_end: stripeServer.periodEnd(subscription),
      cancel_at_period_end: false,
      scheduled_plan_code: null,
      adjustment_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_billing_event_created: eventCreated,
      expires_at: null,
    });
    if (error) throw error;
    return true;
  }

  if (["incomplete", "paused"].includes(subscription.status)) {
    const { error } = await supabaseAdmin.from("account_entitlements").upsert({
      user_id: userId,
      plan_code: "creator_free",
      status: "active",
      recognition_code: null,
      billing_interval: null,
      billing_provider: "stripe",
      billing_customer_ref: customerRef,
      billing_subscription_ref: subscription.id,
      stripe_subscription_status: subscription.status,
      current_period_end: stripeServer.periodEnd(subscription),
      cancel_at_period_end: subscription.cancel_at_period_end,
      scheduled_plan_code: null,
      adjustment_ends_at: null,
      last_billing_event_created: eventCreated,
      expires_at: null,
    });
    if (error) throw error;
    return true;
  }

  throw new Error(`Unhandled Stripe subscription status: ${subscription.status}`);
}

async function syncFocusSubscription(
  subscription: Stripe.Subscription,
  selection: import("@/integrations/stripe/server").StripeFocusPriceSelection,
  eventCreated: number,
) {
  const [{ supabaseAdmin }, stripeServer] = await Promise.all([
    import("@/integrations/supabase/client.server"),
    import("@/integrations/stripe/server"),
  ]);
  const admin = supabaseAdmin as any;
  const customerRef = stripeServer.stripeId(subscription.customer);
  let userId = subscription.metadata.vybe_user_id;
  if (!userId) {
    const { data } = await admin.from("creator_focus_subscriptions").select("creator_id")
      .or(`billing_subscription_ref.eq.${subscription.id}${customerRef ? `,billing_customer_ref.eq.${customerRef}` : ""}`)
      .limit(1).maybeSingle();
    userId = data?.creator_id || "";
  }
  if (!userId) return false;

  const { data: existing, error: existingError } = await admin
    .from("creator_focus_subscriptions")
    .select("id,last_billing_event_created,founding_price_enrolled_at,founding_price_locked")
    .eq("creator_id", userId).maybeSingle();
  if (existingError) throw existingError;
  if ((existing?.last_billing_event_created || 0) > eventCreated) return false;

  const activeStatuses = ["active", "trialing", "past_due"];
  const periodEnd = stripeServer.periodEnd(subscription);
  const pilotDeadline = new Date("2027-02-14T23:59:59Z").getTime();
  const enrolledAt = existing?.founding_price_enrolled_at || new Date(eventCreated * 1000).toISOString();
  const foundingLocked = existing?.founding_price_locked || eventCreated * 1000 <= pilotDeadline;
  const { data: saved, error } = await admin.from("creator_focus_subscriptions").upsert({
    creator_id: userId,
    add_on_code: selection.addOnCode,
    status: subscription.status,
    billing_interval: selection.interval,
    billing_provider: "stripe",
    billing_customer_ref: customerRef,
    billing_subscription_ref: subscription.id,
    current_period_end: periodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
    founding_price_enrolled_at: enrolledAt,
    founding_price_locked: foundingLocked,
    last_billing_event_created: eventCreated,
    updated_at: new Date().toISOString(),
  }, { onConflict: "creator_id" }).select("id").single();
  if (error) throw error;

  if (activeStatuses.includes(subscription.status)) {
    const { error: accessError } = await admin.from("creator_focus_access").update({
      status: "active", ends_at: null, focus_subscription_id: saved.id, updated_at: new Date().toISOString(),
    }).eq("creator_id", userId).eq("focus_subscription_id", saved.id);
    if (accessError) throw accessError;
  } else if (["canceled", "unpaid", "incomplete_expired"].includes(subscription.status)) {
    const graceEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: accessError } = await admin.from("creator_focus_access").update({
      status: "grace", ends_at: graceEnd, updated_at: new Date().toISOString(),
    }).eq("creator_id", userId).eq("focus_subscription_id", saved.id).eq("access_kind", "additional");
    if (accessError) throw accessError;
  }
  return true;
}

async function syncSocialDiscoverySubscription(
  subscription: Stripe.Subscription,
  selection: import("@/integrations/stripe/server").StripeSocialDiscoveryPriceSelection,
  eventCreated: number,
) {
  const [{ supabaseAdmin }, stripeServer] = await Promise.all([
    import("@/integrations/supabase/client.server"),
    import("@/integrations/stripe/server"),
  ]);
  const admin = supabaseAdmin as any;
  const customerRef = stripeServer.stripeId(subscription.customer);
  let userId = subscription.metadata.vybe_user_id;
  if (!userId) {
    const { data } = await admin.from("creator_social_discovery_subscriptions").select("creator_id")
      .or(`billing_subscription_ref.eq.${subscription.id}${customerRef ? `,billing_customer_ref.eq.${customerRef}` : ""}`)
      .limit(1).maybeSingle();
    userId = data?.creator_id || "";
  }
  if (!userId) return false;

  const { data: existing, error: existingError } = await admin
    .from("creator_social_discovery_subscriptions")
    .select("last_billing_event_created")
    .eq("creator_id", userId).maybeSingle();
  if (existingError) throw existingError;
  if ((existing?.last_billing_event_created || 0) > eventCreated) return false;

  const activeStatuses = ["active", "trialing", "past_due"];
  const { error } = await admin.from("creator_social_discovery_subscriptions").upsert({
    creator_id: userId,
    add_on_code: selection.addOnCode,
    status: subscription.status,
    billing_interval: selection.interval,
    billing_provider: "stripe",
    billing_customer_ref: customerRef,
    billing_subscription_ref: subscription.id,
    current_period_end: stripeServer.periodEnd(subscription),
    cancel_at_period_end: subscription.cancel_at_period_end,
    last_billing_event_created: eventCreated,
    updated_at: new Date().toISOString(),
  }, { onConflict: "creator_id" });
  if (error) throw error;

  if (!activeStatuses.includes(subscription.status)) {
    const { error: deactivateError } = await admin.from("creator_social_posts")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("creator_id", userId).eq("is_active", true);
    if (deactivateError) throw deactivateError;
  }
  return true;
}