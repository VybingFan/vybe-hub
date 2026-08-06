import { supabase } from "@/integrations/supabase/client";

export interface DeletionRequest {
  id: string;
  user_id: string;
  request_type: "self_service" | "administrator";
  status: "pending" | "cancelled" | "processing" | "completed" | "failed";
  scheduled_for: string;
  reason: string | null;
}

export interface DeletionPreview {
  userId: string;
  email: string | null;
  displayName: string | null;
  roles: string[];
  protected: boolean;
  blockedReason: string | null;
  tableCounts: Record<string, number>;
  storageCounts: Record<string, number>;
  totalObjects: number;
}

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in again.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export const accountDeletionService = {
  async getMine(): Promise<DeletionRequest | null> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await supabase
      .from("account_deletion_requests")
      .select("*")
      .eq("user_id", auth.user.id)
      .in("status", ["pending", "processing"])
      .maybeSingle();
    if (error) throw error;
    return data as DeletionRequest | null;
  },

  async requestMine(reason?: string): Promise<DeletionRequest> {
    const graceDays = Number(import.meta.env.VITE_ACCOUNT_DELETION_GRACE_DAYS || 7);
    const { data, error } = await supabase.rpc("request_my_account_deletion_v24_34", {
      _reason: reason || null,
      _grace_days: graceDays,
    });
    if (error) throw error;
    return data as DeletionRequest;
  },

  async cancelMine(): Promise<void> {
    const { data, error } = await supabase.rpc("cancel_my_account_deletion_v24_34");
    if (error) throw error;
    if (data !== true) throw new Error("No pending deletion request was found.");
  },

  async preview(userId: string): Promise<DeletionPreview> {
    const response = await fetch("/api/account-deletion", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ action: "preview", userId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not preview account deletion.");
    return result.preview as DeletionPreview;
  },

  async execute(userId: string, emailConfirmation: string) {
    const response = await fetch("/api/account-deletion", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ action: "execute", userId, emailConfirmation }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not delete account.");
    return result;
  },
};
