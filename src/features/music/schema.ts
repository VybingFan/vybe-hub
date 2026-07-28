import { z } from "zod";
import { MUSIC_RIGHTS_VALUES } from "@/constants/legal";

export const CONTENT_STATUSES = ["draft", "published"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional()
  .or(z.literal(""));

export const trackSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(120),
  primary_artist_name: z.string().trim().min(1, "Primary artist required").max(160),
  featured_artist_names: z.array(z.string().trim().min(1).max(160)).max(20).default([]),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  genre: z.string().trim().max(60).optional().or(z.literal("")),
  release_date: optionalDate,
  duration_sec: z
    .number()
    .int()
    .min(0)
    .max(60 * 60 * 3),
  is_featured: z.boolean(),
  status: z.enum(CONTENT_STATUSES),
  track_number: z.number().int().min(1).max(999).optional().nullable(),
  album_id: z.string().uuid().optional().nullable(),
  rights_basis: z.enum(MUSIC_RIGHTS_VALUES),
  rights_confirmed: z.boolean(),
  rights_policy_version: z.string().min(1).nullable(),
  rights_confirmed_at: z.string().datetime().nullable(),
});

export type TrackInput = z.infer<typeof trackSchema>;

export const albumSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  genre: z.string().trim().max(60).optional().or(z.literal("")),
  release_date: optionalDate,
  status: z.enum(CONTENT_STATUSES),
});

export type AlbumInput = z.infer<typeof albumSchema>;

export interface Track extends TrackInput {
  id: string;
  creator_id: string;
  audio_url: string;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Album extends AlbumInput {
  id: string;
  creator_id: string;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlbumWithTracks extends Album {
  tracks: Track[];
}

export const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // Creator Free client guard; DB owns plan limits.
export const MAX_COVER_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_AUDIO = "audio/mpeg,audio/mp3";
export const ACCEPTED_IMAGE = "image/jpeg,image/png,image/webp";

export function formatDuration(totalSec: number): string {
  if (!totalSec || totalSec < 0) return "0:00";
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
