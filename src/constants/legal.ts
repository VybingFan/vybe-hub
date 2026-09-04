export const LEGAL_POLICY_VERSION = "2026-07-28-v1";
export const MUSIC_RIGHTS_POLICY_VERSION = "2026-07-29-music-v2";
export const MUSIC_UPLOAD_RIGHTS_DECLARATION_VERSION = "VYBE-URD-2026-09-04-v1";

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
  { value: "entirely_original", label: "Original work" },
  { value: "licensed_beat", label: "Licensed beat or instrumental" },
  { value: "collaboration_permission", label: "Collaboration" },
  { value: "cover_song", label: "Cover song" },
  { value: "contains_samples", label: "Contains samples or licensed material" },
  { value: "public_domain", label: "Public-domain material" },
  { value: "other_licensed", label: "Other / other licensed use" },
] as const;

export type MusicRightsBasis = (typeof MUSIC_RIGHTS_VALUES)[number];

export const MUSIC_RIGHTS_DECLARATION_COPY: Record<MusicRightsBasis, string> = {
  entirely_original: "I confirm that I created this work or otherwise have the rights and permissions necessary to upload it to VYBE.",
  licensed_beat: "I confirm that my license or permission for this beat or instrumental allows the use I am uploading to VYBE.",
  collaboration_permission: "I confirm that the collaborators involved have given the permission or agreement needed for me to upload and use this work on VYBE.",
  cover_song: "I understand this cover may involve rights owned by others, and I confirm I am responsible for any permissions or licenses required for this upload.",
  contains_samples: "I confirm that I have the rights, permissions, or licenses needed for the samples or other protected material used in this upload.",
  public_domain: "I believe the underlying material is in the public domain and understand that a particular recording or arrangement may still have separate rights.",
  other_licensed: "I confirm that I have the rights, license, or permission needed for this upload and have provided any useful context above.",
};
