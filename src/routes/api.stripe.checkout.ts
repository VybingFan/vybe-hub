import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const checkoutInput = z.object({
  planCode: z.enum(["creator_plus", "creator_pro", "creator_studio"]),
  interval: z.enum(["monthly", "annual"]),
});

export const Route = createFileRoute("/api/stripe/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (process.env.STRIPE_CHECKOUT_ENABLED !== "true") {
            return Response.json(
              { error: "Membership checkout is not open yet." },
              { status: 503 },
            );
          }
          const authorization = request.headers.get("authorization");
          if (!authorization?.startsWith("Bearer ")) {
            return Response.json(
              { error: "Sign in as a creator to choose a plan." },
              { status: 401 },
            );
          }

          const parsed = checkoutInput.safeParse(await request.json().catch(() => null));
          if (!parsed.success) {
            return Response.json({ error: "Choose a valid VYBE membership." }, { status: 400 });
          }

          const [{ supabaseAdmin }, stripeServer] = await Promise.all([
            import("@/integrations/supabase/client.server"),
            import("@/integrations/stripe/server"),
          ]);
          const token = authorization.slice("Bearer ".length);
          const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
          if (authError || !authData.user) {
            return Response.json(
              { error: "Your session has expired. Sign in again." },
              { status: 401 },
            );
          }

          const userId = authData.user.id;
          const [{ data: role }, { data: entitlement }] = await Promise.all([
            supabaseAdmin
              .from("user_roles")
              .select("role")
              .eq("user_id", userId)
              .eq("role", "creator")
              .limit(1)
              .maybeSingle(),
            supabaseAdmin
              .from("account_entitlements")
              .select(
                "plan_code, billing_customer_ref, billing_subscription_ref, stripe_subscription_status",
              )
              .eq("user_id", userId)
              .maybeSingle(),
          ]);

          if (!role) {
            return Response.json({ error: "Creator access is required." }, { status: 403 });
          }
          if (entitlement?.plan_code === "founding_beta") {
            return Response.json(
              {
                error:
                  "Founding Creator access is invitation-only. Contact VYBE before changing this membership.",
              },
              { status: 409 },
            );
          }
          if (
            entitlement?.billing_subscription_ref &&
            ["active", "trialing", "past_due"].includes(
              entitlement.stripe_subscription_status || "",
            )
          ) {
            return Response.json(
              { error: "Manage your current paid membership from Creator Settings." },
              { status: 409 },
            );
          }

          const selection = stripeServer.priceFor(parsed.data.planCode, parsed.data.interval);
          const stripe = stripeServer.getStripe();
          const appUrl = stripeServer.appUrlFor(request);
          const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: selection.priceId, quantity: 1 }],
            ...(entitlement?.billing_customer_ref
              ? {
                  customer: entitlement.billing_customer_ref,
                  customer_update: { address: "auto", name: "auto" },
                }
              : { customer_email: authData.user.email }),
            client_reference_id: userId,
            billing_address_collection: "auto",
            automatic_tax: { enabled: true },
            allow_promotion_codes: false,
            metadata: {
              vybe_user_id: userId,
              vybe_plan_code: selection.planCode,
              vybe_billing_interval: selection.interval,
            },
            subscription_data: {
              metadata: {
                vybe_user_id: userId,
                vybe_plan_code: selection.planCode,
                vybe_billing_interval: selection.interval,
              },
            },
            success_url: `${appUrl}/settings?checkout=success`,
            cancel_url: `${appUrl}/creator-memberships?checkout=cancelled`,
          });

          if (!session.url) {
            return Response.json(
              { error: "Stripe did not return a checkout link." },
              { status: 502 },
            );
          }
          return Response.json({ url: session.url });
        } catch (error) {
          console.error("[Stripe checkout]", error);
          return Response.json(
            {
              error: error instanceof Error ? error.message : "Checkout could not be started.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
