import type { Track } from "@/features/music/schema";

export type PlaylistAccessMode =
  | "public"
  | "unlisted"
  | "password"
  | "approved_listeners"
  | "membership_only";

export const PLAYLIST_WORKSPACE_CATEGORIES = [
  "released",
  "upcoming",
  "work_in_progress",
  "collaboration",
  "rights_pending",
  "commercial_preview",
  "archived",
] as const;

export type PlaylistWorkspaceCategory =
  (typeof PLAYLIST_WORKSPACE_CATEGORIES)[number];

export const PLAYLIST_WORKSPACE_CATEGORY_LABELS: Record<
  PlaylistWorkspaceCategory,
  string
> = {
  released: "Released",
  upcoming: "Upcoming",
  work_in_progress: "Work in progress / private review",
  collaboration: "Collaboration",
  rights_pending: "Rights pending / restricted",
  commercial_preview: "Commercial preview / pitch",
  archived: "Archived",
};

export interface Playlist {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  occasion: string;
  slug: string;
  is_published: boolean;
  cover_path: string | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
  workspace_category: PlaylistWorkspaceCategory;
  access_mode?: PlaylistAccessMode;
  access_expires_at?: string | null;
  required_plan_code?: string | null;
  require_sign_in?: boolean;
  /** Ordered track IDs included on creator-owned playlist queries. */
  trackIds?: string[];
}

export interface SharedPlaylist extends Playlist {
  artistName: string;
  artistUsername: string | null;
  artistAvatarUrl: string | null;
  artistBannerUrl: string | null;
  tracks: Track[];
}

export const PLAYLIST_PURPOSES = [
  "New release",
  "EP or album",
  "Artist picks",
  "Music that inspired me",
  "Mood or moment",
  "Fan favorites",
  "Set list",
  "Behind the music",
  "Exclusive preview",
  "Family or friends review",
  "Producer review",
  "Collaboration session",
  "Radio submission",
  "Label or business pitch",
] as const;

export interface CreatePlaylistInput {
  title: string;
  description: string;
  occasion: string;
  trackIds: string[];
  access_mode: PlaylistAccessMode;
  workspace_category: PlaylistWorkspaceCategory;
  access_expires_at?: string | null;
  require_sign_in?: boolean;
}

export interface UpdatePlaylistInput {
  title: string;
  description: string;
  occasion: string;
  is_published: boolean;
  access_mode?: PlaylistAccessMode;
  workspace_category: PlaylistWorkspaceCategory;
  access_expires_at?: string | null;
  required_plan_code?: string | null;
  require_sign_in?: boolean;
}
