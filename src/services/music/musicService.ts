import { supabase } from "@/integrations/supabase/client";
import type {
  Album,
  AlbumInput,
  AlbumWithTracks,
  Track,
  TrackInput,
} from "@/features/music/schema";
import { MAX_AUDIO_BYTES, MAX_COVER_BYTES } from "@/features/music/schema";

const AUDIO_BUCKET = "music-audio";
const COVER_BUCKET = "music-covers";
const SIGNED_URL_TTL = 60 * 60 * 6; // 6 h

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

async function signedUrl(bucket: string, path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL);
  if (error) return null;
  return data?.signedUrl ?? null;
}

async function hydrateTrack(row: any): Promise<Track> {
  return {
    ...(row as Track),
    audio_url: (await signedUrl(AUDIO_BUCKET, row.audio_url)) ?? "",
    cover_url: await signedUrl(COVER_BUCKET, row.cover_url),
  };
}

async function hydrateAlbum(row: any): Promise<Album> {
  return {
    ...(row as Album),
    cover_url: await signedUrl(COVER_BUCKET, row.cover_url),
  };
}

export interface UploadTrackParams {
  userId: string;
  input: TrackInput;
  audio: File;
  cover?: File | null;
  albumId?: string | null;
}

export const musicService = {
  async uploadAudio(userId: string, file: File): Promise<string> {
    if (file.size > MAX_AUDIO_BYTES) throw new Error("Audio file exceeds 50MB");
    const path = `${userId}/${Date.now()}-${sanitize(file.name)}`;
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) throw error;
    return path;
  },

  async uploadCover(userId: string, file: File): Promise<string> {
    if (file.size > MAX_COVER_BYTES) throw new Error("Cover exceeds 8MB");
    const path = `${userId}/covers/${Date.now()}-${sanitize(file.name)}`;
    const { error } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) throw error;
    return path;
  },

  async removeStorage(bucket: string, path: string | null) {
    if (!path) return;
    await supabase.storage.from(bucket).remove([path]);
  },

  async createTrack(params: UploadTrackParams): Promise<Track> {
    const audioPath = await this.uploadAudio(params.userId, params.audio);
    const coverPath = params.cover ? await this.uploadCover(params.userId, params.cover) : null;

    const insert = {
      creator_id: params.userId,
      title: params.input.title,
      primary_artist_name: params.input.primary_artist_name,
      featured_artist_names: params.input.featured_artist_names,
      description: params.input.description || "",
      genre: params.input.genre || "",
      release_date: params.input.release_date || null,
      duration_sec: params.input.duration_sec,
      is_featured: params.input.is_featured,
      status: params.input.status,
      track_number: params.input.track_number ?? null,
      album_id: params.albumId ?? params.input.album_id ?? null,
      audio_url: audioPath,
      cover_url: coverPath,
    };

    const { data, error } = await supabase.from("tracks").insert(insert).select("*").single();
    if (error) {
      await this.removeStorage(AUDIO_BUCKET, audioPath);
      if (coverPath) await this.removeStorage(COVER_BUCKET, coverPath);
      throw error;
    }
    return hydrateTrack(data);
  },

  async updateTrack(id: string, patch: Partial<TrackInput>): Promise<Track> {
    const update: Record<string, unknown> = { ...patch } as Record<string, unknown>;
    if (patch.release_date === "") update.release_date = null;
    const { data, error } = await supabase
      .from("tracks")
      .update(update as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return hydrateTrack(data);
  },

  async replaceTrackCover(userId: string, id: string, file: File): Promise<Track> {
    const { data: existing, error: lookupError } = await supabase
      .from("tracks")
      .select("cover_url")
      .eq("id", id)
      .eq("creator_id", userId)
      .single();
    if (lookupError) throw lookupError;

    const previousPath = (existing.cover_url as string | null) ?? null;
    const coverPath = await this.uploadCover(userId, file);
    const { data, error } = await supabase
      .from("tracks")
      .update({ cover_url: coverPath })
      .eq("id", id)
      .eq("creator_id", userId)
      .select("*")
      .single();
    if (error) {
      await this.removeStorage(COVER_BUCKET, coverPath);
      throw error;
    }
    if (previousPath && previousPath !== coverPath) {
      await this.removeStorage(COVER_BUCKET, previousPath);
    }
    return hydrateTrack(data);
  },

  async deleteTrack(id: string): Promise<void> {
    const { data: existing } = await supabase
      .from("tracks")
      .select("audio_url, cover_url")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabase.from("tracks").delete().eq("id", id);
    if (error) throw error;
    if (existing) {
      await this.removeStorage(AUDIO_BUCKET, existing.audio_url as string);
      await this.removeStorage(COVER_BUCKET, (existing.cover_url as string | null) ?? null);
    }
  },

  async listCreatorTracks(userId: string): Promise<Track[]> {
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Promise.all((data ?? []).map(hydrateTrack));
  },

  async listCreatorAlbums(userId: string): Promise<Album[]> {
    const { data, error } = await supabase
      .from("albums")
      .select("*")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Promise.all((data ?? []).map(hydrateAlbum));
  },

  async createAlbum(userId: string, input: AlbumInput, cover?: File | null): Promise<Album> {
    const coverPath = cover ? await this.uploadCover(userId, cover) : null;
    const { data, error } = await supabase
      .from("albums")
      .insert({
        creator_id: userId,
        title: input.title,
        description: input.description || "",
        genre: input.genre || "",
        release_date: input.release_date || null,
        status: input.status,
        cover_url: coverPath,
      })
      .select("*")
      .single();
    if (error) {
      if (coverPath) await this.removeStorage(COVER_BUCKET, coverPath);
      throw error;
    }
    return hydrateAlbum(data);
  },

  async updateAlbum(id: string, patch: Partial<AlbumInput>): Promise<Album> {
    const update: Record<string, unknown> = { ...patch } as Record<string, unknown>;
    if (patch.release_date === "") update.release_date = null;
    const { data, error } = await supabase
      .from("albums")
      .update(update as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return hydrateAlbum(data);
  },

  async deleteAlbum(id: string): Promise<void> {
    const { data: existing } = await supabase
      .from("albums")
      .select("cover_url")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabase.from("albums").delete().eq("id", id);
    if (error) throw error;
    if (existing?.cover_url) await this.removeStorage(COVER_BUCKET, existing.cover_url as string);
  },

  async fetchAlbumWithTracks(id: string): Promise<AlbumWithTracks | null> {
    const { data: album, error } = await supabase
      .from("albums")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!album) return null;
    const { data: tracks, error: tErr } = await supabase
      .from("tracks")
      .select("*")
      .eq("album_id", id)
      .order("track_number", { ascending: true });
    if (tErr) throw tErr;
    const hydrated = await hydrateAlbum(album);
    return {
      ...hydrated,
      tracks: await Promise.all((tracks ?? []).map(hydrateTrack)),
    };
  },
};

/** Read audio metadata (duration) from a File before upload. */
export function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = url;
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(audio.duration || 0));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
  });
}
