import { z } from "zod";
import { MUSIC_RIGHTS_VALUES } from "@/constants/legal";
import {
  TRACK_PRODUCTION_STAGES,
  TRACK_WORKSPACE_CATEGORIES,
} from "@/features/music/workflow";

export const CONTENT_STATUSES = ["draft", "published"] as const;
export const TRACK_VISIBILITIES = [
  "public",
  "unlisted",
  "private",
  "scheduled",
  "archived",
] as const;
export type TrackVisibility = (typeof TRACK_VISIBILITIES)[number];
export const TRACK_PLAYBACK_MODES = [
  "full",
  "preview",
  "none",
  "membership_only",
  "approved_listeners",
] as const;
export type TrackPlaybackMode = (typeof TRACK_PLAYBACK_MODES)[number];
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const trackDiscoveryMetadataSchema = z.object({
  mood_tags: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  location: z.string().trim().max(160).default(""),
  placement_platform: z.string().trim().max(120).default(""),
  placement_title: z.string().trim().max(200).default(""),
  placement_details: z.string().trim().max(1000).default(""),
});

export type TrackDiscoveryMetadata = z.infer<
  typeof trackDiscoveryMetadataSchema
>;

export const EMPTY_TRACK_DISCOVERY_METADATA: TrackDiscoveryMetadata = {
  mood_tags: [],
  location: "",
  placement_platform: "",
  placement_title: "",
  placement_details: "",
};

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional()
  .or(z.literal(""));

export const trackSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(120),
  primary_artist_name: z
    .string()
    .trim()
    .min(1, "Primary artist required")
    .max(160),
  featured_artist_names: z
    .array(z.string().trim().min(1).max(160))
    .max(20)
    .default([]),
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
  upload_rights_declaration_version: z.string().min(1),
  upload_rights_declaration_confirmed: z.boolean(),
  upload_rights_declared_at: z.string().datetime(),
  upload_rights_declaration_note: z.string().trim().max(1000).default(""),
  discovery_metadata: trackDiscoveryMetadataSchema.default(
    EMPTY_TRACK_DISCOVERY_METADATA,
  ),
  visibility: z.enum(TRACK_VISIBILITIES).default("public"),
  playback_mode: z.enum(TRACK_PLAYBACK_MODES).default("full"),
  preview_duration_sec: z
    .union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)])
    .default(30),
  preview_start_sec: z.number().int().min(0).default(0),
  preview_audio_path: z.string().nullable().optional(),
  available_from: z.string().datetime().nullable().optional(),
  available_until: z.string().datetime().nullable().optional(),
  required_plan_code: z.string().nullable().optional(),
  allow_download: z.boolean().default(false),
  workspace_category: z
    .enum(TRACK_WORKSPACE_CATEGORIES)
    .default("work_in_progress"),
  production_stage: z.enum(TRACK_PRODUCTION_STAGES).default("idea"),
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
  show_on_public_profile?: boolean;
  profile_feature_rank?: number | null;
  subgenres?: string[];
  activity_tags?: string[];
  playback_available?: boolean;
  audio_storage_path?: string | null;
  preview_storage_path?: string | null;
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
