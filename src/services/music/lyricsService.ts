import { supabase } from "@/integrations/supabase/client";

export type LyricsVisibility = "public" | "search_only" | "private";
export type TranscriptionStatus = "not_requested" | "queued" | "processing" | "ready" | "failed";

export interface TrackLyrics {
  id: string;
  track_id: string;
  creator_id: string;
  transcript_draft: string;
  refined_lyrics: string;
  visibility: LyricsVisibility;
  transcription_status: TranscriptionStatus;
  transcription_error: string;
  transcription_requested_at: string | null;
  transcription_completed_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const lyricsService = {
  async get(trackId: string): Promise<TrackLyrics | null> {
    // Generated database types are refreshed after the V24.19 migration is applied remotely.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("track_lyrics")
      .select("*")
      .eq("track_id", trackId)
      .maybeSingle();
    if (error) throw error;
    return data as TrackLyrics | null;
  },

  async save(input: {
    trackId: string;
    creatorId: string;
    refinedLyrics: string;
    visibility: LyricsVisibility;
  }): Promise<TrackLyrics> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("track_lyrics")
      .upsert(
        {
          track_id: input.trackId,
          creator_id: input.creatorId,
          refined_lyrics: input.refinedLyrics,
          visibility: input.visibility,
          reviewed_at: new Date().toISOString(),
        },
        { onConflict: "track_id" },
      )
      .select("*")
      .single();
    if (error) throw error;
    return data as TrackLyrics;
  },

  async requestTranscription(trackId: string): Promise<TrackLyrics> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("queue_track_lyrics_transcription", {
      target_track_id: trackId,
    });
    if (error) throw error;
    return data as TrackLyrics;
  },
};
