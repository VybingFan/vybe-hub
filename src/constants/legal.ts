export const LEGAL_POLICY_VERSION = "2026-07-28-v1";
export const MUSIC_RIGHTS_POLICY_VERSION = "2026-07-28-music-v1";

export const MUSIC_RIGHTS_VALUES = [
  "entirely_original",
  "licensed_beat",
  "collaboration_permission",
  "cover_song",
  "contains_samples",
  "public_domain",
  "other_licensed",
] as const;

export const MUSIC_RIGHTS_BASES = [
  { value: "entirely_original", label: "Entirely original" },
  { value: "licensed_beat", label: "Licensed beat or instrumental" },
  { value: "collaboration_permission", label: "Collaboration with permission" },
  { value: "cover_song", label: "Cover song" },
  { value: "contains_samples", label: "Contains samples" },
  { value: "public_domain", label: "Public-domain material" },
  { value: "other_licensed", label: "Other licensed material" },
] as const;

export type MusicRightsBasis = (typeof MUSIC_RIGHTS_VALUES)[number];
