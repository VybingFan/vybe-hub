export type CreatorDiscipline = "music" | "film" | "theater" | "multidisciplinary";

export type PlaylistPresentationType = "music" | "film" | "theater" | "mixed";

export type PlaylistItemKind = "track" | "video" | "external_watch" | "project" | "note";

export interface PlaylistItemInput {
  item_kind: PlaylistItemKind;
  track_id?: string | null;
  video_id?: string | null;
  external_url?: string | null;
  external_label?: string | null;
  project_ref?: string | null;
  title_override?: string | null;
  creator_note?: string;
  start_time_sec?: number | null;
  end_time_sec?: number | null;
  allow_download?: boolean;
}

export interface PlaylistItem extends PlaylistItemInput {
  id: string;
  playlist_id: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export const FILM_PLAYLIST_PURPOSES = [
  "Trailer playlist",
  "Film collection",
  "Festival selections",
  "Behind the VYBE",
  "Scene review",
  "Music match list",
  "Rough cut review",
  "Producer or editor review",
  "Screening list",
  "Where to watch",
] as const;

export const FILM_PLAYLIST_PURPOSE_DESCRIPTIONS: Record<
  (typeof FILM_PLAYLIST_PURPOSES)[number],
  string
> = {
  "Trailer playlist": "Public trailers and teasers arranged by the creator.",
  "Film collection": "Projects grouped by genre, series, director, or theme.",
  "Festival selections": "Selected work and authorized screening destinations.",
  "Behind the VYBE": "Production stories, interviews, and behind-the-scenes clips.",
  "Scene review": "Protected finished or unfinished scenes shared for review.",
  "Music match list": "Scenes shared with approved music creators for song or score matching.",
  "Rough cut review": "Protected work-in-progress material for invited reviewers.",
  "Producer or editor review": "Selected clips and notes for production collaborators.",
  "Screening list": "Controlled professional presentation for approved viewers.",
  "Where to watch": "Authorized external destinations for complete projects.",
};

