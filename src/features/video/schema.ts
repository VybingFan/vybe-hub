export const VIDEO_TYPES = [
  { value: "music_video", label: "Music video" },
  { value: "performance", label: "Performance" },
  { value: "interview", label: "Interview" },
  { value: "behind_the_scenes", label: "Behind the scenes" },
  { value: "trailer", label: "Trailer or scene" },
  { value: "short_film", label: "Short film" },
  { value: "episode", label: "Episode" },
  { value: "other", label: "Other video" },
] as const;

export type VideoType = (typeof VIDEO_TYPES)[number]["value"];
export type VideoProvider = "youtube" | "vimeo" | "cloudflare_stream";
export type VideoStatus = "draft" | "processing" | "published" | "failed";
export type VideoVisibility = "public" | "unlisted" | "private";

export interface CreatorVideo {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  video_type: VideoType;
  provider: VideoProvider;
  provider_video_id: string;
  source_url: string | null;
  thumbnail_url: string | null;
  duration_sec: number | null;
  status: VideoStatus;
  visibility: VideoVisibility;
  rights_confirmed: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVideoInput {
  title: string;
  description: string;
  videoType: VideoType;
  sourceUrl: string;
  thumbnailUrl?: string;
  publishNow: boolean;
  rightsConfirmed: boolean;
}
