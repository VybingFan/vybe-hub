import { supabase } from "@/integrations/supabase/client";
import type { BillingInterval, FocusAddOnCode } from "@/integrations/stripe/server";

export interface FocusSubscriptionSummary {
  subscription: null | {
    id: string;
    add_on_code: FocusAddOnCode;
    status: string;
    billing_interval: BillingInterval | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    founding_price_enrolled_at: string | null;
    founding_price_locked: boolean;
  };
  focus_capacity: number;
  eligibility_limit: number;
}

export const focusSubscriptionService = {
  async getMine(): Promise<FocusSubscriptionSummary> {
    const { data, error } = await (supabase.rpc as any)("get_my_creator_focus_subscription");
    if (error) throw error;
    return data as FocusSubscriptionSummary;
  },

  async startCheckout(addOnCode: FocusAddOnCode, interval: BillingInterval) {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) throw new Error("Sign in as a creator to add a focus.");
    const response = await fetch("/api/stripe/focus-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ addOnCode, interval }),
    });
    const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!response.ok || !body.url) throw new Error(body.error || "Focus checkout could not be started.");
    return body.url;
  },
};
