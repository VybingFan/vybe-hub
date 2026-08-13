import { supabase } from "@/integrations/supabase/client";

export type SellerStatus = "not_started" | "incomplete" | "under_review" | "restricted" | "ready";
export type SellerReadiness = { onboarding_status: SellerStatus; payouts_ready: boolean; charges_ready: boolean; requirements_due: number; last_synced_at: string | null };

async function call(action: "status" | "onboard", accepted = false) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in again to manage seller payouts.");
  const response = await fetch("/api/stripe/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, accepted }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Stripe seller setup could not be opened.");
  return payload;
}

export const stripeConnectService = {
  async status(): Promise<SellerReadiness> { return (await call("status")).seller; },
  async onboard(accepted: boolean): Promise<string> { return (await call("onboard", accepted)).url; },
};
