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

export const membershipService = {
  async getMine(): Promise<CreatorMembership> {
    const { data, error } = await supabase.rpc("get_my_creator_membership");
    if (error) throw error;
    if (!data) throw new Error("Membership details are unavailable");
    return data as unknown as CreatorMembership;
  },
};
