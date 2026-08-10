import { supabase } from "@/integrations/supabase/client";
import type { CreatorPlanCode } from "@/features/membership/catalog";

export type RecognitionCode = "vybe_pioneer" | null;

export interface CreatorMembership {
  plan_code: CreatorPlanCode;
  public_name: string;
  description: string;
  recognition_code: RecognitionCode;
  billing_state: "free" | "planned" | "active" | "invitation_only";
  pricing: {
    monthly_cents: number;
    annual_cents: number;
    pioneer_monthly_cents: number | null;
    pioneer_annual_cents: number | null;
  };
  billing: {
    provider: "stripe" | null;
    interval: "monthly" | "annual" | null;
    customer_ref: string | null;
    subscription_ref: string | null;
    subscription_status:
      | "active"
      | "canceled"
      | "incomplete"
      | "incomplete_expired"
      | "past_due"
      | "paused"
      | "trialing"
      | "unpaid"
      | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    adjustment_ends_at: string | null;
  };
  future_allowances: {
    written_posts: number;
    video_storage_minutes: number;
    ai_actions: number;
    analytics_history_days: number | null;
    team_members: number;
  };
  downgrade: {
    adjustment_period_days: number;
    automatic_deletion: false;
  };
  limits: {
    uploaded_tracks: number;
    published_tracks: number;
    track_duration_sec: number;
    audio_bytes: number;
    published_playlists: number;
    playlist_tracks: number;
    merch_items: number;
    active_connections: number;
  };
  usage: {
    uploaded_tracks: number;
    published_tracks: number;
    published_playlists: number;
    merch_items: number;
    active_connections: number;
  };
}

export interface MembershipAdjustment {
  id: string;
  previous_plan_code: CreatorPlanCode;
  target_plan_code: CreatorPlanCode;
  reason: "membership_downgrade" | "membership_ended";
  status: "active" | "restored" | "expired";
  started_at: string;
  ends_at: string;
  restored_at: string | null;
  days_remaining: number;
  automatic_deletion: false;
}

export const membershipService = {
  async getAdjustment(): Promise<MembershipAdjustment | null> {
    const { data, error } = await (supabase.rpc as any)("get_my_membership_adjustment");
    if (error) throw error;
    return data && data !== null ? (data as MembershipAdjustment) : null;
  },
  async getMine(): Promise<CreatorMembership> {
    const { data, error } = await supabase.rpc("get_my_creator_membership");
    if (error) throw error;
    if (!data) throw new Error("Membership details are unavailable");
    return data as unknown as CreatorMembership;
  },
};
