export const CREATOR_UPDATE_KINDS = [
  { value: "show", label: "Show / Performance" },
  { value: "appearance", label: "Appearance" },
  { value: "festival", label: "Festival" },
  { value: "screening", label: "Screening / Premiere" },
  { value: "podcast", label: "Podcast / Interview" },
  { value: "workshop", label: "Workshop / Class" },
  { value: "meet_greet", label: "Meet & Greet" },
  { value: "livestream", label: "Livestream" },
  { value: "release", label: "Release / Launch" },
  { value: "promotion", label: "Promotion / Special" },
  { value: "announcement", label: "Announcement / Update" },
  { value: "other", label: "Other" },
] as const;

export type CreatorUpdateKind = (typeof CREATOR_UPDATE_KINDS)[number]["value"];
export type CreatorUpdateStatus = "draft" | "published";

export interface CreatorUpdate {
  id: string;
  creator_id: string;
  kind: CreatorUpdateKind;
  title: string;
  description: string;
  starts_at: string | null;
  ends_at: string | null;
  location_name: string;
  location_address: string;
  image_path: string | null;
  image_url: string | null;
  destination_url: string | null;
  cta_label: string;
  status: CreatorUpdateStatus;
  created_at: string;
  updated_at: string;
}

export interface CreatorUpdateInput {
  kind: CreatorUpdateKind;
  title: string;
  description: string;
  startsAt?: string;
  endsAt?: string;
  locationName?: string;
  locationAddress?: string;
  destinationUrl?: string;
  ctaLabel?: string;
  publishNow: boolean;
}
