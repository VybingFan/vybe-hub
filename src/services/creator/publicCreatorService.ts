import { supabase } from "@/integrations/supabase/client";
import type { CreatorProfile, PersonalLink } from "@/features/profile/schema";
import type { Track } from "@/features/music/schema";
import type { MerchProduct } from "@/features/merch/schema";
import type { CreatorVideo } from "@/features/video/schema";
import type { CreatorPlanCode } from "@/features/membership/catalog";

export interface PublicCreatorPage {
  profile: CreatorProfile;
  tracks: Track[];
  playlists: PublicCreatorPlaylist[];
  merch: MerchProduct[];
  videos: CreatorVideo[];
  writtenWorks: PublicCreatorWrittenWork[];
  planCode: CreatorPlanCode;
}

export interface PublicCreatorWrittenWork {
  id: string;
  creator_id: string;
  project_id: string | null;
  slug: string;
  title: string;
  work_type: string;
  excerpt: string;
  cover_path: string | null;
  cover_url: string | null;
  profile_display_order: number;
  published_at: string | null;
  project_title: string | null;
}

export interface PublicCreatorPlaylist {
  id: string;
  title: string;
  description: string;
  occasion: string;
  slug: string;
  cover_path: string | null;
  cover_url: string | null;
  profile_display_order: number;
}

async function signedUrl(bucket: string, path: string | null, ttl = 60 * 5) {
  if (!path) return null;
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 6);
  return data?.signedUrl ?? null;
}

export const publicCreatorService = {
  async playbackUrl(track: Track): Promise<string> {
    if (!(track.playback_available ?? Boolean(track.audio_url))) return "";
    if (track.audio_url) return track.audio_url;
    const bucket = track.playback_mode === "preview" ? "music-previews" : "music-audio";
    const path = track.playback_mode === "preview" ? track.preview_storage_path : track.audio_storage_path;
    return (await signedUrl(bucket, path ?? null, 60 * 3)) ?? "";
  },

  async fetch(username: string): Promise<PublicCreatorPage | null> {
    const { data: profile, error } = await supabase
      .from("creator_profiles")
      .select("*")
      .ilike("username", username)
      .maybeSingle();
    if (error) throw error;
    if (!profile || !profile.username) return null;
    const { data: publicPlan } = await (supabase.rpc as any)("get_public_creator_plan", { p_user_id: profile.user_id });
    const planCode = (["creator_free", "creator_plus", "creator_pro", "creator_studio", "founding_beta"] as const).includes(publicPlan)
      ? (publicPlan as CreatorPlanCode)
      : "creator_free";
    const publicLinkLimit = planCode === "creator_studio" ? 100 : planCode === "creator_pro" || planCode === "founding_beta" ? 25 : planCode === "creator_plus" ? 5 : 1;
    const videoAllowed = planCode !== "creator_free";
    const profileBackgroundAllowed = planCode === "creator_pro" || planCode === "creator_studio" || planCode === "founding_beta";

    const [
      { data: rows, error: tracksError },
      { data: merch, error: merchError },
      { data: videos, error: videosError },
      { data: playlistRows, error: playlistsError },
      { data: writtenRows, error: writtenWorksError },
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
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("playlists")
        .select("*")
        .eq("creator_id", profile.user_id)
        .eq("is_published", true)
        .order("updated_at", { ascending: false }),
      (supabase as any)
        .from("creator_written_works")
        .select("id,creator_id,project_id,slug,title,work_type,excerpt,cover_path,profile_display_order,published_at")
        .eq("creator_id", profile.user_id)
        .eq("status", "published")
        .eq("visibility", "public")
        .eq("show_on_public_profile", true)
        .order("profile_display_order", { ascending: true })
        .order("published_at", { ascending: false }),
    ]);
    if (tracksError) throw tracksError;
    if (merchError) throw merchError;
    if (videosError) console.warn("Public creator videos are unavailable", videosError);
    if (playlistsError) throw playlistsError;
    if (writtenWorksError) throw writtenWorksError;

    const projectIds = Array.from(
      new Set(
        ((writtenRows ?? []) as Array<{ project_id?: string | null }>)
          .map((work) => work.project_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const projectTitles = new Map<string, string>();
    if (projectIds.length) {
      const { data: projectRows, error: projectsError } = await (supabase as any)
        .from("creator_written_projects")
        .select("id,title")
        .eq("creator_id", profile.user_id)
        .in("id", projectIds);
      if (projectsError) {
        console.warn("Public creator writing projects are unavailable", projectsError);
      } else {
        for (const project of projectRows ?? []) {
          projectTitles.set(project.id, project.title);
        }
      }
    }

    const writtenWorks = await Promise.all(
      ((writtenRows ?? []) as Array<{
        id: string;
        creator_id: string;
        project_id: string | null;
        slug: string;
        title: string;
        work_type: string;
        excerpt: string;
        cover_path: string | null;
        profile_display_order: number;
        published_at: string | null;
      }>).map(async (work) => ({
        ...work,
        cover_url: await signedUrl("writing-covers", work.cover_path),
        project_title: work.project_id ? projectTitles.get(work.project_id) ?? null : null,
      })),
    );

    const tracks = (await Promise.all(
      ((rows ?? []) as unknown as Track[])
        .filter((track) => track.show_on_public_profile !== false)
        .sort(
          (a, b) =>
            (a.profile_feature_rank ?? 99) - (b.profile_feature_rank ?? 99) ||
            b.created_at.localeCompare(a.created_at),
        )
        .map(async (track) => ({
          ...track,
          audio_url: "",
          audio_storage_path: track.audio_url,
          preview_storage_path: track.preview_audio_path ?? null,
          playback_available:
            track.playback_mode === "preview"
              ? Boolean(track.preview_audio_path)
              : track.playback_mode === "none" || track.playback_mode === "approved_listeners"
                ? false
                : Boolean(track.audio_url),
          cover_url: await signedUrl("music-covers", track.cover_url),
        })),
    )) as unknown as Track[];
    const hydratedMerch = await Promise.all(
      ((merch ?? []) as MerchProduct[]).map(async (product) => ({
        ...product,
        image_url:
          (await signedUrl("music-covers", product.image_path)) ||
          product.image_url ||
          null,
      })),
    );
    const hydratedVideos = await Promise.all(
      ((videosError ? [] : videos ?? []) as unknown as CreatorVideo[]).map(async (video) => ({
        ...video,
        thumbnail_url:
          (await signedUrl("music-covers", video.thumbnail_path)) ||
          video.thumbnail_url ||
          null,
      })),
    );
    const playlists = await Promise.all(
      (
        (playlistRows ?? []) as unknown as (PublicCreatorPlaylist & {
          access_mode?: string;
          access_expires_at?: string | null;
          show_on_public_profile?: boolean;
        })[]
      )
        .filter(
          (playlist) =>
            playlist.access_mode === "public" &&
            playlist.show_on_public_profile === true &&
            (!playlist.access_expires_at ||
              new Date(playlist.access_expires_at).getTime() > Date.now()),
        )
        .sort(
          (a, b) =>
            a.profile_display_order - b.profile_display_order ||
            a.title.localeCompare(b.title),
        )
        .map(async (playlist) => ({
          ...playlist,
          cover_url: await signedUrl("music-covers", playlist.cover_path),
        })),
    );

    const profileLinks: Array<["website" | "instagram" | "facebook" | "tiktok" | "youtube" | "spotify" | "apple_music" | "x", string]> = [
      ["website", profile.website ?? ""], ["instagram", profile.instagram ?? ""], ["facebook", profile.facebook ?? ""], ["tiktok", profile.tiktok ?? ""],
      ["youtube", profile.youtube ?? ""], ["spotify", profile.spotify ?? ""], ["apple_music", profile.apple_music ?? ""], ["x", profile.x ?? ""],
    ];
    let remainingLinks = publicLinkLimit;
    const visibleLinks = Object.fromEntries(profileLinks.map(([key, value]) => {
      const visible = value && remainingLinks > 0 ? value : "";
      if (visible) remainingLinks -= 1;
      return [key, visible];
    }));
    const visiblePersonalLinks = (Array.isArray(profile.personal_links) ? profile.personal_links as PersonalLink[] : []).slice(0, remainingLinks);
    return {
      profile: {
        ...profile,
        username: profile.username,
        merch_url: profile.merch_url ?? "",
        avatar_url:
          (await signedUrl("avatars", profile.avatar_path)) ||
          profile.avatar_url ||
          "",
        cover_url:
          (await signedUrl("avatars", profile.cover_path)) ||
          profile.cover_url ||
          "",
        profile_theme: profileBackgroundAllowed && profile.profile_theme === "custom" ? "custom" : "vybe",
        profile_background_url: profileBackgroundAllowed ?
          (await signedUrl("avatars", profile.profile_background_path)) ||
          profile.profile_background_url ||
          "" : "",
        genres: (profile.genres ?? []).slice(0, planCode === "creator_free" ? 1 : 5),
        ...visibleLinks,
        personal_links: visiblePersonalLinks,
      },
      tracks,
      playlists,
      merch: hydratedMerch,
      videos: videoAllowed ? hydratedVideos : [],
      writtenWorks,
      planCode,
    };
  },
};
