import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .url({ message: "Enter a valid URL" })
  .optional()
  .or(z.literal(""));

const optionalHandle = z.string().trim().max(120).optional().or(z.literal(""));

export const personalLinkSchema = z.object({
  label: z.string().trim().min(1, "Label required").max(60),
  url: z.string().trim().url({ message: "Enter a valid URL" }).max(300),
});

export const creatorProfileSchema = z.object({
  artist_name: z.string().trim().min(1, "Artist name is required").max(80),
  display_name: z.string().trim().min(1, "Display name is required").max(80),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
  genre: z.string().trim().max(60).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  avatar_url: optionalUrl,
  cover_url: optionalUrl,
  website: optionalUrl,
  instagram: optionalHandle,
  facebook: optionalHandle,
  tiktok: optionalHandle,
  youtube: optionalHandle,
  spotify: optionalHandle,
  apple_music: optionalHandle,
  x: optionalHandle,
  personal_links: z.array(personalLinkSchema).max(10),
});

export type CreatorProfileInput = z.infer<typeof creatorProfileSchema>;
export type PersonalLink = z.infer<typeof personalLinkSchema>;

export const emptyCreatorProfile: CreatorProfileInput = {
  artist_name: "",
  display_name: "",
  bio: "",
  genre: "",
  location: "",
  avatar_url: "",
  cover_url: "",
  website: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  youtube: "",
  spotify: "",
  apple_music: "",
  x: "",
  personal_links: [],
};

export interface CreatorProfile extends CreatorProfileInput {
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram", placeholder: "@username or URL" },
  { key: "facebook", label: "Facebook", placeholder: "Page name or URL" },
  { key: "tiktok", label: "TikTok", placeholder: "@username or URL" },
  { key: "youtube", label: "YouTube", placeholder: "Channel URL" },
  { key: "spotify", label: "Spotify", placeholder: "Artist URL" },
  { key: "apple_music", label: "Apple Music", placeholder: "Artist URL" },
  { key: "x", label: "X (Twitter)", placeholder: "@handle or URL" },
] as const;

export type SocialFieldKey = (typeof SOCIAL_FIELDS)[number]["key"];
