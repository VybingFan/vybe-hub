import { z } from "zod";
import { personalLinkSchema } from "@/features/profile/schema";

const optionalUrl = z.string().trim().max(300).url({ message: "Enter a valid URL" }).optional().or(z.literal(""));
const optionalHandle = z.string().trim().max(120).optional().or(z.literal(""));

export const supporterProfileSchema = z.object({
  display_name: z.string().trim().min(1, "Display name is required").max(80),
  username: z.string().trim().min(3, "At least 3 characters").max(30).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  avatar_url: optionalUrl,
  avatar_path: z.string().nullable().optional(),
  favorite_genres: z.array(z.string().trim().min(1).max(40)).max(20),
  favorite_artists: z.array(z.string().trim().min(1).max(80)).max(20),
  website: optionalUrl,
  instagram: optionalHandle,
  x: optionalHandle,
  tiktok: optionalHandle,
  personal_links: z.array(personalLinkSchema).max(10),
});

export type SupporterProfileInput = z.infer<typeof supporterProfileSchema>;

export const emptySupporterProfile: SupporterProfileInput = {
  display_name: "", username: "", bio: "", location: "", avatar_url: "", avatar_path: null,
  favorite_genres: [], favorite_artists: [], website: "", instagram: "", x: "", tiktok: "", personal_links: [],
};

export interface SupporterProfile extends SupporterProfileInput {
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const SUPPORTER_SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram", placeholder: "@username or URL" },
  { key: "x", label: "X (Twitter)", placeholder: "@handle or URL" },
  { key: "tiktok", label: "TikTok", placeholder: "@username or URL" },
] as const;
