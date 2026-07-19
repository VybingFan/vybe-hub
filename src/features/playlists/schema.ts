import type { Track } from "@/features/music/schema";

export interface Playlist {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  occasion: string;
  slug: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharedPlaylist extends Playlist {
  artistName: string;
  artistUsername: string | null;
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
] as const;

export interface CreatePlaylistInput {
  title: string;
  description: string;
  occasion: string;
  trackIds: string[];
}
