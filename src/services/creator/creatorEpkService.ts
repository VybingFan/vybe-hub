import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type EpkProfile = Tables<"creator_epk_profiles">;
export type EpkAsset = Tables<"creator_epk_assets">;
export type AudioMaster = Tables<"creator_audio_masters">;
export type TrackCredit = Tables<"creator_track_credits">;
export type FeaturedTrack = Tables<"creator_epk_featured_tracks">;
export type PressHighlight = Tables<"creator_epk_press_highlights">;
export type CreatorProfile = Tables<"creator_profiles">;
export type CreatorTrack = Tables<"tracks">;
export type TrackLyrics = Tables<"track_lyrics">;

export interface CreatorEpkWorkspace {
  epk: EpkProfile | null;
  creator: CreatorProfile | null;
  tracks: CreatorTrack[];
  lyrics: TrackLyrics[];
  assets: EpkAsset[];
  masters: AudioMaster[];
  credits: TrackCredit[];
  featuredTracks: FeaturedTrack[];
  highlights: PressHighlight[];
}

const EPK_BUCKET = "creator-epk-assets";
const MASTER_BUCKET = "creator-audio-masters";
const SIGNED_URL_SECONDS = 60 * 60;

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

async function signedUrl(bucket: string, path: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

export const creatorEpkService = {
  async load(creatorId: string): Promise<CreatorEpkWorkspace> {
    const [epk, creator, tracks, lyrics, assets, masters, credits, featured, highlights] =
      await Promise.all([
        supabase.from("creator_epk_profiles").select("*").eq("creator_id", creatorId).maybeSingle(),
        supabase.from("creator_profiles").select("*").eq("user_id", creatorId).maybeSingle(),
        supabase.from("tracks").select("*").eq("creator_id", creatorId).order("created_at", { ascending: false }),
        supabase.from("track_lyrics").select("*").eq("creator_id", creatorId),
        supabase.from("creator_epk_assets").select("*").eq("creator_id", creatorId).order("display_order"),
        supabase.from("creator_audio_masters").select("*").eq("creator_id", creatorId),
        supabase.from("creator_track_credits").select("*").eq("creator_id", creatorId).order("display_order"),
        supabase.from("creator_epk_featured_tracks").select("*").eq("creator_id", creatorId).order("display_order"),
        supabase.from("creator_epk_press_highlights").select("*").eq("creator_id", creatorId).order("display_order"),
      ]);

    const firstError = [epk, creator, tracks, lyrics, assets, masters, credits, featured, highlights]
      .map((result) => result.error)
      .find(Boolean);
    if (firstError) throw firstError;

    return {
      epk: epk.data,
      creator: creator.data,
      tracks: tracks.data ?? [],
      lyrics: lyrics.data ?? [],
      assets: assets.data ?? [],
      masters: masters.data ?? [],
      credits: credits.data ?? [],
      featuredTracks: featured.data ?? [],
      highlights: highlights.data ?? [],
    };
  },

  async saveProfile(creatorId: string, input: Omit<TablesInsert<"creator_epk_profiles">, "creator_id">) {
    const { data, error } = await supabase
      .from("creator_epk_profiles")
      .upsert({ creator_id: creatorId, ...input }, { onConflict: "creator_id" })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async uploadAsset(
    creatorId: string,
    file: File,
    metadata: Pick<TablesInsert<"creator_epk_assets">, "asset_type" | "orientation" | "title" | "caption" | "alt_text">,
  ) {
    if (file.size > 25 * 1024 * 1024) throw new Error("EPK assets must be 25MB or smaller.");
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "application/pdf"];
    if (!allowed.includes(file.type)) throw new Error("Use JPG, PNG, WebP, SVG, or PDF.");
    const path = `${creatorId}/${metadata.asset_type}/${Date.now()}-${safeName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(EPK_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("creator_epk_assets")
      .insert({
        creator_id: creatorId,
        storage_path: path,
        original_filename: file.name,
        content_type: file.type,
        size_bytes: file.size,
        is_public: false,
        ...metadata,
      })
      .select("*")
      .single();
    if (error) {
      await supabase.storage.from(EPK_BUCKET).remove([path]);
      throw error;
    }
    return data;
  },

  async assetUrl(asset: EpkAsset) {
    return signedUrl(asset.storage_bucket, asset.storage_path);
  },

  async updateAsset(id: string, patch: TablesUpdate<"creator_epk_assets">) {
    const { error } = await supabase.from("creator_epk_assets").update(patch).eq("id", id);
    if (error) throw error;
  },

  async deleteAsset(asset: EpkAsset) {
    const { error } = await supabase.from("creator_epk_assets").delete().eq("id", asset.id);
    if (error) throw error;
    await supabase.storage.from(asset.storage_bucket).remove([asset.storage_path]);
  },

  async uploadMaster(creatorId: string, trackId: string, file: File) {
    if (file.size > 200 * 1024 * 1024) throw new Error("WAV masters must be 200MB or smaller.");
    if (!["audio/wav", "audio/x-wav"].includes(file.type) && !file.name.toLowerCase().endsWith(".wav")) {
      throw new Error("Choose an uncompressed WAV file.");
    }
    const path = `${creatorId}/${trackId}/${Date.now()}-${safeName(file.name)}`;
    const contentType = file.type === "audio/x-wav" ? "audio/x-wav" : "audio/wav";
    const { error: uploadError } = await supabase.storage
      .from(MASTER_BUCKET)
      .upload(path, file, { contentType, upsert: false });
    if (uploadError) throw uploadError;

    const { data: previous } = await supabase
      .from("creator_audio_masters")
      .select("storage_path")
      .eq("creator_id", creatorId)
      .eq("track_id", trackId)
      .maybeSingle();
    const { data, error } = await supabase
      .from("creator_audio_masters")
      .upsert(
        {
          creator_id: creatorId,
          track_id: trackId,
          storage_path: path,
          original_filename: file.name,
          content_type: contentType,
          size_bytes: file.size,
        },
        { onConflict: "creator_id,track_id" },
      )
      .select("*")
      .single();
    if (error) {
      await supabase.storage.from(MASTER_BUCKET).remove([path]);
      throw error;
    }
    if (previous?.storage_path && previous.storage_path !== path) {
      await supabase.storage.from(MASTER_BUCKET).remove([previous.storage_path]);
    }
    return data;
  },

  async setFeaturedTrack(
    creatorId: string,
    trackId: string,
    selected: boolean,
    defaults?: { spotify_url?: string; apple_music_url?: string; bandcamp_url?: string },
  ) {
    if (!selected) {
      const { error } = await supabase
        .from("creator_epk_featured_tracks")
        .delete()
        .eq("creator_id", creatorId)
        .eq("track_id", trackId);
      if (error) throw error;
      return;
    }
    const { error } = await supabase.from("creator_epk_featured_tracks").upsert(
      { creator_id: creatorId, track_id: trackId, ...defaults },
      { onConflict: "creator_id,track_id" },
    );
    if (error) throw error;
  },

  async updateFeaturedTrack(creatorId: string, trackId: string, patch: TablesUpdate<"creator_epk_featured_tracks">) {
    const { error } = await supabase
      .from("creator_epk_featured_tracks")
      .update(patch)
      .eq("creator_id", creatorId)
      .eq("track_id", trackId);
    if (error) throw error;
  },

  async addCredit(input: TablesInsert<"creator_track_credits">) {
    const { error } = await supabase.from("creator_track_credits").insert(input);
    if (error) throw error;
  },

  async deleteCredit(id: string) {
    const { error } = await supabase.from("creator_track_credits").delete().eq("id", id);
    if (error) throw error;
  },

  async addHighlight(input: TablesInsert<"creator_epk_press_highlights">) {
    const { error } = await supabase.from("creator_epk_press_highlights").insert(input);
    if (error) throw error;
  },

  async deleteHighlight(id: string) {
    const { error } = await supabase.from("creator_epk_press_highlights").delete().eq("id", id);
    if (error) throw error;
  },
};
