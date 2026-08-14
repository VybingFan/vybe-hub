import { supabase } from "@/integrations/supabase/client";

export type PlaylistActivityType = "link_opened" | "playback_started";

export interface PlaylistActivity {
  id: string;
  playlist_id: string;
  event_type: PlaylistActivityType;
  created_at: string;
  playlists: { title: string } | null;
  tracks: { title: string } | null;
}

export interface PlaybackProgress {
  slug: string;
  trackId: string;
  playbackId: string;
  positionSec: number;
  durationSec: number;
  listenedDeltaSec: number;
  completed?: boolean;
}

function sessionId() {
  const key = "vybe:listener-session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(key, created);
  return created;
}

export const activityService = {
  async record(slug: string, eventType: PlaylistActivityType, trackId?: string) {
    if (typeof window === "undefined") return;
    const { error } = await (supabase.rpc as any)("record_shared_playlist_event", {
      p_slug: slug,
      p_event_type: eventType,
      p_session_id: sessionId(),
      p_track_id: trackId || null,
    });
    if (error) console.warn("Could not record playlist activity", error);
  },

  async recordProgress(progress: PlaybackProgress) {
    if (typeof window === "undefined") return;
    const { error } = await (supabase.rpc as any)("record_shared_playback_progress", {
      p_slug: progress.slug,
      p_track_id: progress.trackId,
      p_listener_session_id: sessionId(),
      p_playback_id: progress.playbackId,
      p_position_sec: progress.positionSec,
      p_duration_sec: progress.durationSec,
      p_listened_delta_sec: progress.listenedDeltaSec,
      p_completed: progress.completed ?? false,
    });
    if (error) console.warn("Could not record playback progress", error);
  },

  async listMine(creatorId: string): Promise<PlaylistActivity[]> {
    const { data, error } = await (supabase as any)
      .from("playlist_activity")
      .select("id,playlist_id,event_type,created_at,playlists(title),tracks(title)")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(250);
    if (error) throw error;
    return data ?? [];
  },
};
