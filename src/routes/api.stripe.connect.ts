import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const input = z.object({ action: z.enum(["status", "onboard"]), accepted: z.boolean().optional() });
const stripeVersion = "2026-07-29.dahlia";

async function stripeV2(path: string, method: "GET" | "POST", body?: unknown) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured.");
  const response = await fetch(`https://api.stripe.com${path}`, { method, headers: { Authorization: `Bearer ${key}`, "Stripe-Version": stripeVersion, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || payload?.error?.code || "Stripe rejected the request.");
  return payload;
}

function readiness(account: any) {
  const transfer = account?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers;
  const entries = [...(account?.requirements?.entries || [])];
  const due = entries.filter((entry: any) => ["currently_due", "past_due"].includes(entry?.minimum_deadline?.status)).length;
  const code = transfer?.status_details?.[0]?.code || "";
  const ready = transfer?.status === "active";
  const status = ready ? "ready" : code.includes("past_due") ? "restricted" : due ? "incomplete" : account?.requirements ? "under_review" : "incomplete";
  return { onboarding_status: status, payouts_ready: ready, charges_ready: false, requirements_due: due, provider_details: { transfer_status: transfer?.status || null, status_code: code || null }, last_synced_at: new Date().toISOString() };
}

export const Route = createFileRoute("/api/stripe/connect")({ server: { handlers: { POST: async ({ request }) => {
  try {
    if (process.env.STRIPE_CONNECT_ENABLED !== "true") return Response.json({ error: "Stripe seller onboarding is not enabled yet. Complete the Stripe Connect platform setup first." }, { status: 503 });
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return Response.json({ error: "Sign in as a creator." }, { status: 401 });
    const parsed = input.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "Invalid seller setup request." }, { status: 400 });
    const [{ supabaseAdmin }, { appUrlFor }] = await Promise.all([import("@/integrations/supabase/client.server"), import("@/integrations/stripe/server")]);
    const { data, error } = await supabaseAdmin.auth.getUser(auth.slice(7));
    if (error || !data.user) return Response.json({ error: "Your session expired." }, { status: 401 });
    const userId = data.user.id;
    const { data: role } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).in("role", ["creator", "admin"]).limit(1).maybeSingle();
    if (!role) return Response.json({ error: "Creator access is required." }, { status: 403 });
    if (role.role !== "admin") {
      const { data: canPrepare, error: membershipError } = await supabaseAdmin.rpc(
        "creator_has_commerce_feature_v24_41h1",
        { p_user_id: userId, p_feature: "commerce.prepare" },
      );
      if (membershipError) throw new Error(membershipError.message);
      if (!canPrepare) {
        return Response.json(
          { error: "Stripe seller setup requires Creator Plus or higher." },
          { status: 403 },
        );
      }
    }
    let { data: seller } = await supabaseAdmin.from("commerce_seller_accounts").select("*").eq("creator_id", userId).maybeSingle();
    if (seller?.provider_account_id) {
      const account = await stripeV2(`/v2/core/accounts/${seller.provider_account_id}?include[]=configuration.recipient&include[]=requirements`, "GET");
      const state = readiness(account);
      const updated = await supabaseAdmin.from("commerce_seller_accounts").upsert({ ...seller, ...state }).select("*").single();
      seller = updated.data;
    }
    if (parsed.data.action === "status") return Response.json({ seller: seller || { onboarding_status: "not_started", payouts_ready: false, charges_ready: false, requirements_due: 0, last_synced_at: null } });
    if (!seller?.provider_account_id) {
      if (!parsed.data.accepted) return Response.json({ error: "Accept the seller terms before continuing." }, { status: 400 });
      const account = await stripeV2("/v2/core/accounts", "POST", { contact_email: data.user.email, display_name: data.user.user_metadata?.display_name || data.user.email?.split("@")[0] || "VYBE creator", defaults: { responsibilities: { fees_collector: "application", losses_collector: "application" } }, dashboard: "express", identity: { country: "us" }, configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } } }, include: ["configuration.recipient", "identity", "requirements"], metadata: { vybe_creator_id: userId } });
      const state = readiness(account);
      const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
      const saved = await supabaseAdmin.from("commerce_seller_accounts").upsert({ creator_id: userId, provider_account_id: account.id, terms_version: "VYBE-SELLER-2026-08-13", terms_accepted_at: new Date().toISOString(), terms_acceptance_ip: ip, ...state }).select("*").single();
      if (saved.error) throw new Error(saved.error.message);
      seller = saved.data;
    }
    const base = appUrlFor(request);
    const link = await stripeV2("/v2/core/account_links", "POST", { account: seller.provider_account_id, use_case: { type: "account_onboarding", account_onboarding: { configurations: ["recipient"], collection_options: { fields: "eventually_due", future_requirements: "include" }, return_url: `${base}/commerce?stripe=return`, refresh_url: `${base}/commerce?stripe=refresh` } } });
    return Response.json({ url: link.url });
  } catch (error) { console.error("[Stripe Connect]", error); return Response.json({ error: error instanceof Error ? error.message : "Stripe seller setup failed." }, { status: 500 }); }
} } } });
