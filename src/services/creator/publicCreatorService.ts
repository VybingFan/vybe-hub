import { supabase } from "@/integrations/supabase/client";
import type { CreatorProfile, PersonalLink } from "@/features/profile/schema";
import type { Track } from "@/features/music/schema";

export interface PublicCreatorPage {
  profile: CreatorProfile;
  tracks: Track[];
}

async function signedUrl(bucket: string, path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 6);
  return data?.signedUrl ?? null;
}

export const publicCreatorService = {
  async fetch(username: string): Promise<PublicCreatorPage | null> {
    const { data: profile, error } = await supabase
      .from("creator_profiles")
      .select("*")
      .ilike("username", username)
      .maybeSingle();
    if (error) throw error;
    if (!profile || !profile.username) return null;

    const { data: rows, error: tracksError } = await supabase
      .from("tracks")
      .select("*")
      .eq("creator_id", profile.user_id)
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (tracksError) throw tracksError;

    const tracks = await Promise.all(
      (rows ?? []).map(async (track) => ({
        ...track,
        audio_url: (await signedUrl("music-audio", track.audio_url)) ?? "",
        cover_url: await signedUrl("music-covers", track.cover_url),
      })),
    );

    return {
      profile: {
        ...profile,
        username: profile.username,
        merch_url: profile.merch_url ?? "",
        avatar_url: profile.avatar_url ?? "",
        cover_url: profile.cover_url ?? "",
        website: profile.website ?? "",
        instagram: profile.instagram ?? "",
        facebook: profile.facebook ?? "",
        tiktok: profile.tiktok ?? "",
        youtube: profile.youtube ?? "",
        spotify: profile.spotify ?? "",
        apple_music: profile.apple_music ?? "",
        x: profile.x ?? "",
        personal_links: Array.isArray(profile.personal_links)
          ? (profile.personal_links as PersonalLink[])
          : [],
      },
      tracks,
    };
  },
};
