import { supabase } from "@/integrations/supabase/client";
import type { CreatorPlanCode } from "@/features/membership/catalog";

export type CreatorPlan = CreatorPlanCode;

export interface CreatorInvite {
  id: string;
  email_normalized: string;
  recipient_name: string | null;
  assigned_plan: CreatorPlan;
  expires_at: string;
  redeemed_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface InvitePreview {
  recipient_hint: string;
  assigned_plan: CreatorPlan;
  expires_at: string;
  invitation_status: "valid" | "expired" | "redeemed" | "revoked";
}

export const invitationService = {
  async list(): Promise<CreatorInvite[]> {
    const { data, error } = await supabase
      .from("creator_invites")
      .select(
        "id, email_normalized, recipient_name, assigned_plan, expires_at, redeemed_at, revoked_at, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CreatorInvite[];
  },

  async create(input: {
    email: string;
    recipientName?: string;
    plan: CreatorPlan;
    expiresInDays: number;
    note?: string;
  }) {
    const { data, error } = await supabase.rpc("create_creator_invite", {
      _email: input.email,
      _recipient_name: input.recipientName || undefined,
      _assigned_plan: input.plan,
      _expires_in_days: input.expiresInDays,
      _internal_note: input.note || undefined,
    });
    if (error) throw error;
    const created = data?.[0];
    if (!created) throw new Error("The invitation could not be created");
    return created;
  },

  async inspect(token: string): Promise<InvitePreview | null> {
    const { data, error } = await supabase.rpc("inspect_creator_invite", { _token: token });
    if (error) throw error;
    return (data?.[0] as InvitePreview | undefined) ?? null;
  },

  async redeem(token: string): Promise<CreatorPlan> {
    const { data, error } = await supabase.rpc("redeem_creator_invite", { _token: token });
    if (error) throw error;
    return data as CreatorPlan;
  },

  async revoke(inviteId: string) {
    const { error } = await supabase
      .from("creator_invites")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", inviteId)
      .is("redeemed_at", null);
    if (error) throw error;
  },
};
