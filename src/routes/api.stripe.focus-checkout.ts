import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const input = z.object({
  addOnCode: z.enum(["second_focus", "pro_multi_focus", "studio_multi_focus"]),
  interval: z.enum(["monthly", "annual"]),
});

export const Route = createFileRoute("/api/stripe/focus-checkout")({
  server: { handlers: { POST: async ({ request }) => {
    try {
      if (process.env.STRIPE_FOCUS_CHECKOUT_ENABLED !== "true") {
        return Response.json({ error: "Creator focus subscriptions are not open yet." }, { status: 503 });
      }
      const authorization = request.headers.get("authorization");
      if (!authorization?.startsWith("Bearer ")) {
        return Response.json({ error: "Sign in as a creator to add a focus." }, { status: 401 });
      }
      const parsed = input.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return Response.json({ error: "Choose a valid focus subscription." }, { status: 400 });

      const [{ supabaseAdmin }, stripeServer] = await Promise.all([
        import("@/integrations/supabase/client.server"),
        import("@/integrations/stripe/server"),
      ]);
      const token = authorization.slice("Bearer ".length);
      const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !authData.user) return Response.json({ error: "Your session has expired." }, { status: 401 });
      const userId = authData.user.id;
      const admin = supabaseAdmin as any;
      const [{ data: role }, { data: entitlement }, { data: existing }] = await Promise.all([
        admin.from("user_roles").select("role").eq("user_id", userId).eq("role", "creator").limit(1).maybeSingle(),
        admin.from("account_entitlements").select("plan_code,status,billing_customer_ref").eq("user_id", userId).maybeSingle(),
        admin.from("creator_focus_subscriptions").select("status,billing_subscription_ref").eq("creator_id", userId).maybeSingle(),
      ]);
      if (!role) return Response.json({ error: "Creator access is required." }, { status: 403 });
      if (entitlement?.plan_code === "founding_beta") {
        return Response.json({ error: "Founding Creator focus access is managed directly by VYBE during testing." }, { status: 409 });
      }
      const planCode = entitlement?.status === "active" ? String(entitlement.plan_code) : "creator_free";
      const allowed = parsed.data.addOnCode === "second_focus"
        ? ["creator_plus", "creator_pro", "creator_studio"].includes(planCode)
        : parsed.data.addOnCode === "pro_multi_focus"
          ? planCode === "creator_pro"
          : planCode === "creator_studio";
      if (!allowed) return Response.json({ error: "This focus subscription is not available for your current membership." }, { status: 403 });
      if (existing?.billing_subscription_ref && ["active","trialing","past_due"].includes(existing.status || "")) {
        return Response.json({ error: "Manage or change your current focus subscription from Creator Settings." }, { status: 409 });
      }

      const selection = stripeServer.focusPriceFor(parsed.data.addOnCode, parsed.data.interval);
      const stripe = stripeServer.getStripe();
      const appUrl = stripeServer.appUrlFor(request);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: selection.priceId, quantity: 1 }],
        ...(entitlement?.billing_customer_ref
          ? { customer: entitlement.billing_customer_ref, customer_update: { address: "auto", name: "auto" } }
          : { customer_email: authData.user.email }),
        client_reference_id: userId,
        billing_address_collection: "auto",
        allow_promotion_codes: false,
        metadata: {
          vybe_user_id: userId,
          vybe_subscription_type: "creator_focus",
          vybe_focus_add_on_code: selection.addOnCode,
          vybe_billing_interval: selection.interval,
        },
        subscription_data: { metadata: {
          vybe_user_id: userId,
          vybe_subscription_type: "creator_focus",
          vybe_focus_add_on_code: selection.addOnCode,
          vybe_billing_interval: selection.interval,
        } },
        success_url: `${appUrl}/settings?focus-checkout=success`,
        cancel_url: `${appUrl}/creator-memberships?focus-checkout=cancelled`,
      });
      if (!session.url) return Response.json({ error: "Stripe did not return a checkout link." }, { status: 502 });
      return Response.json({ url: session.url });
    } catch (error) {
      console.error("[Stripe focus checkout]", error);
      return Response.json({ error: error instanceof Error ? error.message : "Focus checkout could not be started." }, { status: 500 });
    }
  } } },
});
