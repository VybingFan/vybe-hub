import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stripe/portal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authorization = request.headers.get("authorization");
          if (!authorization?.startsWith("Bearer ")) {
            return Response.json({ error: "Sign in to manage billing." }, { status: 401 });
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

          const { data: entitlement, error } = await supabaseAdmin
            .from("account_entitlements")
            .select("billing_customer_ref")
            .eq("user_id", authData.user.id)
            .maybeSingle();
          if (error) throw error;
          if (!entitlement?.billing_customer_ref) {
            return Response.json(
              { error: "No Stripe billing account is connected to this membership yet." },
              { status: 404 },
            );
          }

          const session = await stripeServer.getStripe().billingPortal.sessions.create({
            customer: entitlement.billing_customer_ref,
            return_url: `${stripeServer.appUrlFor(request)}/settings`,
          });
          return Response.json({ url: session.url });
        } catch (error) {
          console.error("[Stripe portal]", error);
          return Response.json(
            {
              error:
                error instanceof Error ? error.message : "Billing management could not be opened.",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
