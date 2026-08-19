import { getActiveIdentity } from "@/components/identity/IdentityModeBar";
import { supabase } from "@/integrations/supabase/client";
import type { Track } from "@/features/music/schema";

const database = supabase as any;

const AUDIO_BUCKET = "music-audio";
const COVER_BUCKET = "music-covers";
const PREVIEW_BUCKET = "music-previews";
const SIGNED_URL_TTL = 60 * 60 * 6;

async function signedUrl(bucket: string, path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL);
  if (error) return null;
  return data?.signedUrl ?? null;
}

async function hydrateSavedTrack(row: Track): Promise<Track> {
  return {
    ...row,
    audio_url:
      row.playback_mode === "preview"
        ? (await signedUrl(PREVIEW_BUCKET, row.preview_audio_path ?? null)) ?? ""
        : row.playback_mode === "none"
          ? ""
          : (await signedUrl(AUDIO_BUCKET, row.audio_url)) ?? "",
    cover_url: await signedUrl(COVER_BUCKET, row.cover_url),
  };
}

export type SupporterMusicList = {
  id: string;
  name: string;
  is_default: boolean;
  supporter_music_list_items?: Array<{
    id: string;
    track_id: string;
    tracks?: Track | null;
  }>;
};

function supporterIdentity() {
  const identity = getActiveIdentity();
  if (!identity) throw new Error("Sign in and use Supporter Mode to continue.");
  if (identity.identity_type !== "supporter")
    throw new Error("Switch to Supporter Mode to continue.");
  return identity;
}

export const savedMusicService = {
  async lists(): Promise<SupporterMusicList[]> {
    const identity = supporterIdentity();
    const { data, error } = await database
      .from("supporter_music_lists")
      .select("id,name,is_default,supporter_music_list_items(id,track_id,tracks(*))")
      .eq("owner_identity_id", identity.id)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });
    if (error) throw error;

    return Promise.all(
      (data ?? []).map(async (list: SupporterMusicList) => ({
        ...list,
        supporter_music_list_items: await Promise.all(
          (list.supporter_music_list_items ?? []).map(async (item) => ({
            ...item,
            tracks: item.tracks ? await hydrateSavedTrack(item.tracks) : null,
          })),
        ),
      })),
    );
  },

  async ensureDefault(): Promise<SupporterMusicList> {
    const identity = supporterIdentity();
    const { data: existing, error: readError } = await database
      .from("supporter_music_lists")
      .select("id,name,is_default")
      .eq("owner_identity_id", identity.id)
      .eq("is_default", true)
      .maybeSingle();
    if (readError) throw readError;
    if (existing) return existing;
    const { data, error } = await database
      .from("supporter_music_lists")
      .insert({ owner_identity_id: identity.id, name: "Saved Songs", is_default: true })
      .select("id,name,is_default")
      .single();
    if (error) throw error;
    return data;
  },

  async createList(name: string): Promise<SupporterMusicList> {
    const identity = supporterIdentity();
    const clean = name.trim();
    if (!clean) throw new Error("Enter a list name.");
    const { data, error } = await database
      .from("supporter_music_lists")
      .insert({ owner_identity_id: identity.id, name: clean })
      .select("id,name,is_default")
      .single();
    if (error) throw error;
    return data;
  },

  async saveTrack(listId: string, trackId: string) {
    supporterIdentity();
    const { error } = await database
      .from("supporter_music_list_items")
      .upsert({ list_id: listId, track_id: trackId }, { onConflict: "list_id,track_id" });
    if (error) throw error;
  },

  async toggleHeart(trackId: string, liked: boolean) {
    const identity = supporterIdentity();
    if (liked) {
      const { error } = await database
        .from("identity_reactions")
        .delete()
        .eq("identity_id", identity.id)
        .eq("reaction_type", "like")
        .eq("entity_type", "track")
        .eq("entity_id", trackId);
      if (error) throw error;
      return false;
    }
    const { error } = await database.from("identity_reactions").upsert(
      {
        identity_id: identity.id,
        reaction_type: "like",
        entity_type: "track",
        entity_id: trackId,
      },
      { onConflict: "identity_id,reaction_type,entity_type,entity_id" },
    );
    if (error) throw error;
    return true;
  },

  async hearted(trackId: string) {
    const identity = supporterIdentity();
    const { data, error } = await database
      .from("identity_reactions")
      .select("id")
      .eq("identity_id", identity.id)
      .eq("reaction_type", "like")
      .eq("entity_type", "track")
      .eq("entity_id", trackId)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  },
};
