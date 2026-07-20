import { supabase } from "@/integrations/supabase/client";

export type CreatorPlanCode = "creator_free" | "creator_plus" | "founding_beta";
export type RecognitionCode = "first_wave" | null;

export interface CreatorMembership {
  plan_code: CreatorPlanCode;
  public_name: string;
  description: string;
  recognition_code: RecognitionCode;
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
