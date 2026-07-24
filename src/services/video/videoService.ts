import { supabase } from "@/integrations/supabase/client";
import type { CreateVideoInput, CreatorVideo, VideoProvider } from "@/features/video/schema";

function parseHostedVideo(source: string): {
  provider: VideoProvider;
  providerVideoId: string;
} {
  const url = new URL(source.trim());
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    if (id) return { provider: "youtube", providerVideoId: id };
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id =
      url.searchParams.get("v") || url.pathname.match(/^\/(?:shorts|embed)\/([^/?]+)/)?.[1];
    if (id) return { provider: "youtube", providerVideoId: id };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname
      .split("/")
      .filter(Boolean)
      .find((part) => /^\d+$/.test(part));
    if (id) return { provider: "vimeo", providerVideoId: id };
  }

  throw new Error("Use a valid YouTube or Vimeo video link.");
}

export function videoEmbedUrl(video: CreatorVideo) {
  if (video.provider === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.provider_video_id)}`;
  }
  if (video.provider === "vimeo") {
    return `https://player.vimeo.com/video/${encodeURIComponent(video.provider_video_id)}`;
  }
  return `https://customer-${import.meta.env.VITE_CLOUDFLARE_STREAM_CUSTOMER_CODE || "not-configured"}.cloudflarestream.com/${encodeURIComponent(video.provider_video_id)}/iframe`;
}

export const videoService = {
  async listMine(creatorId: string): Promise<CreatorVideo[]> {
    const { data, error } = await supabase
      .from("creator_videos")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CreatorVideo[];
  },

  async listPublished(creatorId?: string): Promise<CreatorVideo[]> {
    let query = supabase
      .from("creator_videos")
      .select("*")
      .eq("status", "published")
      .eq("visibility", "public")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (creatorId) query = query.eq("creator_id", creatorId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as CreatorVideo[];
  },

  async getPublic(id: string): Promise<CreatorVideo | null> {
    const { data, error } = await supabase
      .from("creator_videos")
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .in("visibility", ["public", "unlisted"])
      .maybeSingle();
    if (error) throw error;
    return data as CreatorVideo | null;
  },

  async create(creatorId: string, input: CreateVideoInput): Promise<CreatorVideo> {
    if (!input.rightsConfirmed)
      throw new Error("Confirm that you have rights to share this video.");
    const { provider, providerVideoId } = parseHostedVideo(input.sourceUrl);
    const { data, error } = await supabase
      .from("creator_videos")
      .insert({
        creator_id: creatorId,
        title: input.title.trim(),
        description: input.description.trim(),
        video_type: input.videoType,
        provider,
        provider_video_id: providerVideoId,
        source_url: input.sourceUrl.trim(),
        thumbnail_url: input.thumbnailUrl?.trim() || null,
        status: input.publishNow ? "published" : "draft",
        visibility: "public",
        rights_confirmed: true,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as CreatorVideo;
  },

  async setPublished(id: string, published: boolean) {
    const { error } = await supabase
      .from("creator_videos")
      .update({ status: published ? "published" : "draft" })
      .eq("id", id);
    if (error) throw error;
  },

  async remove(id: string) {
    const { error } = await supabase.from("creator_videos").delete().eq("id", id);
    if (error) throw error;
  },
};
