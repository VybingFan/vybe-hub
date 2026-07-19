import { supabase } from "@/integrations/supabase/client";
import type { Track } from "@/features/music/schema";
import type { CreatePlaylistInput, Playlist, SharedPlaylist } from "@/features/playlists/schema";

const AUDIO_BUCKET = "music-audio";
const COVER_BUCKET = "music-covers";

async function signedUrl(bucket: string, path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 6);
  return data?.signedUrl ?? null;
}

async function hydrateTrack(row: Track): Promise<Track> {
  return {
    ...row,
    audio_url: (await signedUrl(AUDIO_BUCKET, row.audio_url)) ?? "",
    cover_url: await signedUrl(COVER_BUCKET, row.cover_url),
  };
}

export const playlistService = {
  async create(userId: string, input: CreatePlaylistInput): Promise<Playlist> {
    const slug = `${
      input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 48) || "playlist"
    }-${crypto.randomUUID().slice(0, 8)}`;
    const { data, error } = await supabase
      .from("playlists")
      .insert({
        creator_id: userId,
        title: input.title,
        description: input.description,
        occasion: input.occasion,
        slug,
        is_published: true,
      })
      .select("*")
      .single();
    if (error) throw error;

    const items = input.trackIds.map((trackId, position) => ({
      playlist_id: data.id,
      track_id: trackId,
      position,
    }));
    const { error: trackError } = await supabase.from("playlist_tracks").insert(items);
    if (trackError) {
      await supabase.from("playlists").delete().eq("id", data.id);
      throw trackError;
    }
    return data;
  },

  async listMine(userId: string): Promise<Playlist[]> {
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getShared(slug: string): Promise<SharedPlaylist | null> {
    const { data: playlist, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    if (!playlist) return null;

    const [{ data: creator }, { data: items, error: itemsError }] = await Promise.all([
      supabase
        .from("creator_profiles")
        .select("artist_name, display_name")
        .eq("user_id", playlist.creator_id)
        .maybeSingle(),
      supabase
        .from("playlist_tracks")
        .select("position, tracks(*)")
        .eq("playlist_id", playlist.id)
        .order("position"),
    ]);
    if (itemsError) throw itemsError;
    const tracks = (items ?? []).flatMap((item) => (item.tracks ? [item.tracks as Track] : []));
    return {
      ...playlist,
      artistName: creator?.artist_name || creator?.display_name || "VYBE Artist",
      tracks: await Promise.all(tracks.map(hydrateTrack)),
    };
  },
};
