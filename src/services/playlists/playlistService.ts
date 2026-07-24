import { supabase } from "@/integrations/supabase/client";
import { MAX_COVER_BYTES, type Track } from "@/features/music/schema";
import type {
  CreatePlaylistInput,
  Playlist,
  SharedPlaylist,
  UpdatePlaylistInput,
} from "@/features/playlists/schema";

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

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

async function hydratePlaylist<T extends Omit<Playlist, "cover_url">>(
  playlist: T,
): Promise<T & { cover_url: string | null }> {
  return {
    ...playlist,
    cover_url: await signedUrl(COVER_BUCKET, playlist.cover_path),
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
    return hydratePlaylist({
      ...data,
      cover_path: data.cover_path ?? null,
      trackIds: input.trackIds,
    });
  },

  async listMine(userId: string): Promise<Playlist[]> {
    const { data, error } = await supabase
      .from("playlists")
      .select("*, playlist_tracks(track_id, position)")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Promise.all(
      (data ?? []).map(({ playlist_tracks: items, ...playlist }) =>
        hydratePlaylist({
          ...playlist,
          cover_path: playlist.cover_path ?? null,
          trackIds: [...items].sort((a, b) => a.position - b.position).map((item) => item.track_id),
        }),
      ),
    );
  },

  async getMine(userId: string, playlistId: string): Promise<Playlist | null> {
    const { data, error } = await supabase
      .from("playlists")
      .select("*, playlist_tracks(track_id, position)")
      .eq("id", playlistId)
      .eq("creator_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const { playlist_tracks: items, ...playlist } = data;
    return hydratePlaylist({
      ...playlist,
      cover_path: playlist.cover_path ?? null,
      trackIds: [...items].sort((a, b) => a.position - b.position).map((item) => item.track_id),
    });
  },

  async update(playlistId: string, input: UpdatePlaylistInput): Promise<void> {
    const { error } = await supabase.from("playlists").update(input).eq("id", playlistId);
    if (error) throw error;
  },

  async replaceCover(userId: string, playlistId: string, file: File): Promise<void> {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      throw new Error("Choose a JPG, PNG, or WebP cover image.");
    }
    if (file.size > MAX_COVER_BYTES) throw new Error("Cover exceeds 2MB");
    const { data: existing, error: lookupError } = await supabase
      .from("playlists")
      .select("cover_path")
      .eq("id", playlistId)
      .eq("creator_id", userId)
      .single();
    if (lookupError) throw lookupError;
    const previousPath = existing.cover_path;
    const newPath = `${userId}/playlist-covers/${playlistId}-${Date.now()}-${sanitize(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(newPath, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (uploadError) throw uploadError;
    const { error } = await supabase
      .from("playlists")
      .update({ cover_path: newPath })
      .eq("id", playlistId)
      .eq("creator_id", userId);
    if (error) {
      await supabase.storage.from(COVER_BUCKET).remove([newPath]);
      throw error;
    }
    if (previousPath && previousPath !== newPath) {
      await supabase.storage.from(COVER_BUCKET).remove([previousPath]);
    }
  },

  async replaceTracks(playlistId: string, trackIds: string[]): Promise<void> {
    const { error } = await supabase.rpc("replace_playlist_tracks", {
      _playlist_id: playlistId,
      _track_ids: trackIds,
    });
    if (error) throw error;
  },

  async delete(playlistId: string): Promise<void> {
    const { data: existing } = await supabase
      .from("playlists")
      .select("cover_path")
      .eq("id", playlistId)
      .maybeSingle();
    const { error } = await supabase.from("playlists").delete().eq("id", playlistId);
    if (error) throw error;
    if (existing?.cover_path) {
      await supabase.storage.from(COVER_BUCKET).remove([existing.cover_path]);
    }
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
        .select("artist_name, display_name, username")
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
    return hydratePlaylist({
      ...playlist,
      cover_path: playlist.cover_path ?? null,
      artistName: creator?.artist_name || creator?.display_name || "VYBE Artist",
      artistUsername: creator?.username || null,
      tracks: await Promise.all(tracks.map(hydrateTrack)),
    });
  },
};
