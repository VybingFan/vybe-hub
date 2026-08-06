import { supabase } from "@/integrations/supabase/client";
import type {
  Album,
  AlbumInput,
  AlbumWithTracks,
  Track,
  TrackInput,
} from "@/features/music/schema";
import {
  EMPTY_TRACK_DISCOVERY_METADATA,
  MAX_AUDIO_BYTES,
  MAX_COVER_BYTES,
  trackDiscoveryMetadataSchema,
} from "@/features/music/schema";
import { membershipService } from "@/services/membership/membershipService";
import { generateWavPreview } from "@/services/music/previewGenerator";

const AUDIO_BUCKET = "music-audio";
const COVER_BUCKET = "music-covers";
const PREVIEW_BUCKET = "music-previews";
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

async function hydrateTrack(row: Track): Promise<Track> {
  const parsedDiscovery = trackDiscoveryMetadataSchema.safeParse(row.discovery_metadata ?? {});

  return {
    ...row,
    discovery_metadata: parsedDiscovery.success
      ? parsedDiscovery.data
      : { ...EMPTY_TRACK_DISCOVERY_METADATA },
    audio_url:
      row.playback_mode === "preview"
        ? (await signedUrl(PREVIEW_BUCKET, row.preview_audio_path ?? null)) ?? ""
        : row.playback_mode === "none"
          ? ""
          : (await signedUrl(AUDIO_BUCKET, row.audio_url)) ?? "",
    cover_url: await signedUrl(COVER_BUCKET, row.cover_url),
  };
}

async function hydrateAlbum(row: Album): Promise<Album> {
  return {
    ...row,
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
    const membership = await membershipService.getMine().catch(() => null);
    const maxBytes = membership?.limits.audio_bytes ?? MAX_AUDIO_BYTES;
    if (file.size > maxBytes) {
      throw new Error(
        `Audio files on your plan must be ${Math.round(maxBytes / 1024 / 1024)}MB or smaller`,
      );
    }
    if (!file.type.match(/^audio\/(mpeg|mp3)$/) && !file.name.toLowerCase().endsWith(".mp3")) {
      throw new Error("Choose an MP3 audio file");
    }
    const path = `${userId}/${Date.now()}-${sanitize(file.name)}`;
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) throw error;
    return path;
  },


  async uploadPreview(userId: string, trackId: string, file: File): Promise<string> {
    const path = `${userId}/${trackId}/${Date.now()}-${sanitize(file.name)}`;
    const { error } = await supabase.storage
      .from(PREVIEW_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    if (error) throw error;
    return path;
  },

  async uploadCover(userId: string, file: File): Promise<string> {
    if (file.size > MAX_COVER_BYTES) throw new Error("Cover exceeds 2MB");
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
    if (
      !params.input.rights_confirmed ||
      !params.input.rights_policy_version ||
      !params.input.rights_confirmed_at
    ) {
      throw new Error("Confirm that you have the rights needed to share this music.");
    }
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
      is_featured: false,
      status: params.input.status,
      track_number: params.input.track_number ?? null,
      album_id: params.albumId ?? params.input.album_id ?? null,
      audio_url: audioPath,
      cover_url: coverPath,
      rights_basis: params.input.rights_basis,
      rights_confirmed: params.input.rights_confirmed,
      rights_policy_version: params.input.rights_policy_version,
      rights_confirmed_at: params.input.rights_confirmed_at,
      discovery_metadata: params.input.discovery_metadata,
      visibility: params.input.visibility,
      playback_mode: params.input.playback_mode,
      preview_duration_sec: params.input.preview_duration_sec,
      preview_start_sec: params.input.preview_start_sec,
      allow_download: params.input.allow_download,
      workspace_category: params.input.workspace_category,
      production_stage: params.input.production_stage,
    };

    const { data, error } = await supabase
      .from("tracks")
      .insert(insert as never)
      .select("*")
      .single();
    if (error) {
      await this.removeStorage(AUDIO_BUCKET, audioPath);
      if (coverPath) await this.removeStorage(COVER_BUCKET, coverPath);
      throw error;
    }
    if (params.input.playback_mode === "preview") {
      try {
        const previewFile = await generateWavPreview(
          params.audio,
          params.input.preview_start_sec,
          params.input.preview_duration_sec,
        );
        const previewPath = await this.uploadPreview(params.userId, data.id, previewFile);
        const { error: previewUpdateError } = await supabase
          .from("tracks")
          .update({ preview_audio_path: previewPath })
          .eq("id", data.id)
          .eq("creator_id", params.userId);
        if (previewUpdateError) throw previewUpdateError;
        data.preview_audio_path = previewPath;
      } catch (previewError) {
        await supabase.from("tracks").delete().eq("id", data.id);
        await this.removeStorage(AUDIO_BUCKET, audioPath);
        if (coverPath) await this.removeStorage(COVER_BUCKET, coverPath);
        throw previewError;
      }
    }
    if (params.input.is_featured) {
      const { error: leadError } = await supabase.rpc("set_profile_lead_track", {
        _track_id: data.id,
      });
      if (leadError) throw leadError;
      data.is_featured = true;
    }
    return hydrateTrack(data as unknown as Track);
  },

  async setProfileLead(trackId: string | null): Promise<void> {
    const { error } = await supabase.rpc("set_profile_lead_track", { _track_id: trackId });
    if (error) throw error;
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
    return hydrateTrack(data as unknown as Track);
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
    return hydrateTrack(data as unknown as Track);
  },

  async replaceTrackAudio(
    userId: string,
    id: string,
    file: File,
    durationSec: number,
  ): Promise<Track> {
    const { data: existing, error: lookupError } = await supabase
      .from("tracks")
      .select("audio_url")
      .eq("id", id)
      .eq("creator_id", userId)
      .single();
    if (lookupError) throw lookupError;

    const previousPath = existing.audio_url;
    const newPath = await this.uploadAudio(userId, file);
    const { data, error } = await supabase
      .from("tracks")
      .update({ audio_url: newPath, duration_sec: durationSec })
      .eq("id", id)
      .eq("creator_id", userId)
      .select("*")
      .single();
    if (error) {
      await this.removeStorage(AUDIO_BUCKET, newPath);
      throw error;
    }
    if (previousPath && previousPath !== newPath) {
      await this.removeStorage(AUDIO_BUCKET, previousPath);
    }
    return hydrateTrack(data as unknown as Track);
  },

  async deleteTrack(id: string): Promise<void> {
    const { data: existing } = await supabase
      .from("tracks")
      .select("audio_url, cover_url, preview_audio_path")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabase.from("tracks").delete().eq("id", id);
    if (error) throw error;
    if (existing) {
      await this.removeStorage(AUDIO_BUCKET, existing.audio_url as string);
      await this.removeStorage(COVER_BUCKET, (existing.cover_url as string | null) ?? null);
      await this.removeStorage(PREVIEW_BUCKET, (existing.preview_audio_path as string | null) ?? null);
    }
  },

  async listCreatorTracks(userId: string): Promise<Track[]> {
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Promise.all((data ?? []).map((row) => hydrateTrack(row as unknown as Track)));
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
      tracks: await Promise.all((tracks ?? []).map((row) => hydrateTrack(row as unknown as Track))),
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

