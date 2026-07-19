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
  tracks: Track[];
}

export interface CreatePlaylistInput {
  title: string;
  description: string;
  occasion: string;
  trackIds: string[];
}
