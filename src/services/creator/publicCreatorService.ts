import { supabase } from "@/integrations/supabase/client";
import type { CreatorProfile, PersonalLink } from "@/features/profile/schema";
import type { Track } from "@/features/music/schema";
import type { MerchProduct } from "@/features/merch/schema";
import type { CreatorVideo } from "@/features/video/schema";

export interface PublicCreatorPage {
  profile: CreatorProfile;
  tracks: Track[];
  merch: MerchProduct[];
  videos: CreatorVideo[];
}

async function signedUrl(bucket: string, path: string | null, ttl = 60 * 5) {
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

    const [
      { data: rows, error: tracksError },
      { data: merch, error: merchError },
      { data: videos, error: videosError },
    ] = await Promise.all([
      supabase
        .from("tracks")
        .select("*")
        .eq("creator_id", profile.user_id)
        .eq("status", "published")
        .eq("visibility", "public")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("merch_products")
        .select("*")
        .eq("creator_id", profile.user_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("creator_videos")
        .select("*")
        .eq("creator_id", profile.user_id)
        .eq("status", "published")
        .eq("visibility", "public")
        .eq("visibility", "public")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);
    if (tracksError) throw tracksError;
    if (merchError) throw merchError;
    if (videosError) throw videosError;

    const tracks = await Promise.all(
      (rows ?? []).map(async (track) => ({
        ...track,
        audio_url:
          track.playback_mode === "preview"
            ? (await signedUrl("music-previews", track.preview_audio_path, 60 * 3)) ?? ""
            : track.playback_mode === "none" || track.playback_mode === "approved_listeners"
              ? ""
              : (await signedUrl("music-audio", track.audio_url, 60 * 3)) ?? "",
        cover_url: await signedUrl("music-covers", track.cover_url),
      })),
    );
    const hydratedMerch = await Promise.all(
      ((merch ?? []) as MerchProduct[]).map(async (product) => ({
        ...product,
        image_url:
          (await signedUrl("music-covers", product.image_path)) || product.image_url || null,
      })),
    );

    return {
      profile: {
        ...profile,
        username: profile.username,
        merch_url: profile.merch_url ?? "",
        avatar_url: (await signedUrl("avatars", profile.avatar_path)) || profile.avatar_url || "",
        cover_url: (await signedUrl("avatars", profile.cover_path)) || profile.cover_url || "",
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
      merch: hydratedMerch,
      videos: (videos ?? []) as CreatorVideo[],
    };
  },
};
