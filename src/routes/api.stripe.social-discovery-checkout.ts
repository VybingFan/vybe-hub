import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const input = z.object({ interval: z.enum(["monthly", "annual"]) });

export const Route = createFileRoute("/api/stripe/social-discovery-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (process.env.STRIPE_SOCIAL_DISCOVERY_CHECKOUT_ENABLED !== "true") {
            return Response.json({ error: "Social Discovery subscriptions are not open yet." }, { status: 503 });
          }

          const authorization = request.headers.get("authorization");
          if (!authorization?.startsWith("Bearer ")) {
            return Response.json({ error: "Sign in as a creator to subscribe to Social Discovery." }, { status: 401 });
          }

          const parsed = input.safeParse(await request.json().catch(() => null));
          if (!parsed.success) return Response.json({ error: "Choose monthly or annual billing." }, { status: 400 });

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
            admin.from("account_entitlements").select("billing_customer_ref").eq("user_id", userId).maybeSingle(),
            admin.from("creator_social_discovery_subscriptions").select("status,billing_subscription_ref,billing_customer_ref").eq("creator_id", userId).maybeSingle(),
          ]);

          if (!role) return Response.json({ error: "Creator access is required." }, { status: 403 });
          if (existing?.billing_subscription_ref && ["active", "trialing", "past_due"].includes(existing.status || "")) {
            return Response.json({ error: "Manage your current Social Discovery subscription from Creator Settings." }, { status: 409 });
          }

          const selection = stripeServer.socialDiscoveryPriceFor(parsed.data.interval);
          const stripe = stripeServer.getStripe();
          const appUrl = stripeServer.appUrlFor(request);
          const customerRef = existing?.billing_customer_ref || entitlement?.billing_customer_ref || null;
          const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: selection.priceId, quantity: 1 }],
            ...(customerRef
              ? { customer: customerRef, customer_update: { address: "auto", name: "auto" } }
              : { customer_email: authData.user.email }),
            client_reference_id: userId,
            billing_address_collection: "auto",
            allow_promotion_codes: false,
            metadata: {
              vybe_user_id: userId,
              vybe_subscription_type: "social_discovery",
              vybe_social_discovery_add_on_code: "social_discovery",
              vybe_billing_interval: selection.interval,
            },
            subscription_data: { metadata: {
              vybe_user_id: userId,
              vybe_subscription_type: "social_discovery",
              vybe_social_discovery_add_on_code: "social_discovery",
              vybe_billing_interval: selection.interval,
            } },
            success_url: `${appUrl}/social-discovery?checkout=success`,
            cancel_url: `${appUrl}/social-discovery?checkout=cancelled`,
          });

          if (!session.url) return Response.json({ error: "Stripe did not return a checkout link." }, { status: 502 });
          return Response.json({ url: session.url });
        } catch (error) {
          console.error("[Stripe Social Discovery checkout]", error);
          return Response.json({ error: error instanceof Error ? error.message : "Social Discovery checkout could not be started." }, { status: 500 });
        }
      },
    },
  },
});
