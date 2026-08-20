import { supabase } from "@/integrations/supabase/client";
import type { SupporterProfile, SupporterProfileInput } from "@/features/supporter/schema";
import type { PersonalLink } from "@/features/profile/schema";

const database = supabase as any;
const SIGNED_URL_TTL = 60 * 60 * 6;

type Row = Omit<SupporterProfile, "personal_links" | "favorite_genres" | "favorite_artists"> & {
  personal_links: unknown;
  favorite_genres: unknown;
  favorite_artists: unknown;
};

function normalize(row: Row): SupporterProfile {
  return {
    ...row,
    personal_links: Array.isArray(row.personal_links) ? row.personal_links as PersonalLink[] : [],
    favorite_genres: Array.isArray(row.favorite_genres) ? row.favorite_genres as string[] : [],
    favorite_artists: Array.isArray(row.favorite_artists) ? row.favorite_artists as string[] : [],
  };
}

async function hydrate(row: Row): Promise<SupporterProfile> {
  const profile = normalize(row);
  if (!profile.avatar_path) return profile;
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, SIGNED_URL_TTL);
  return { ...profile, avatar_url: error ? profile.avatar_url : data?.signedUrl || profile.avatar_url };
}

export const supporterProfileService = {
  async uploadAvatar(userId: string, file: File) {
    if (file.size > 8 * 1024 * 1024) throw new Error("Profile photo must be 8MB or smaller.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPG, PNG, or WebP image.");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/supporter/avatar-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data, error: signedError } = await supabase.storage.from("avatars").createSignedUrl(path, SIGNED_URL_TTL);
    if (signedError) throw signedError;
    return { path, url: data.signedUrl };
  },

  async fetch(userId: string): Promise<SupporterProfile | null> {
    const { data, error } = await database.from("supporter_profiles").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    return data ? hydrate(data as Row) : null;
  },

  async upsert(userId: string, input: SupporterProfileInput): Promise<SupporterProfile> {
    const payload = { user_id: userId, ...input, avatar_url: input.avatar_path ? null : input.avatar_url, personal_links: input.personal_links ?? [] };
    const { data, error } = await database.from("supporter_profiles").upsert(payload, { onConflict: "user_id" }).select("*").single();
    if (error) throw error;
    return hydrate(data as Row);
  },
};
