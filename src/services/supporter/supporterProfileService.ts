import { supabase } from "@/integrations/supabase/client";
import type {
  SupporterProfile,
  SupporterProfileInput,
} from "@/features/supporter/schema";
import type { PersonalLink } from "@/features/profile/schema";

type Row = Omit<SupporterProfile, "personal_links" | "favorite_genres" | "favorite_artists"> & {
  personal_links: unknown;
  favorite_genres: unknown;
  favorite_artists: unknown;
};

function normalize(row: Row): SupporterProfile {
  return {
    ...row,
    personal_links: Array.isArray(row.personal_links)
      ? (row.personal_links as PersonalLink[])
      : [],
    favorite_genres: Array.isArray(row.favorite_genres)
      ? (row.favorite_genres as string[])
      : [],
    favorite_artists: Array.isArray(row.favorite_artists)
      ? (row.favorite_artists as string[])
      : [],
  };
}

export const supporterProfileService = {
  async fetch(userId: string): Promise<SupporterProfile | null> {
    const { data, error } = await supabase
      .from("supporter_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ? normalize(data as unknown as Row) : null;
  },

  async upsert(userId: string, input: SupporterProfileInput): Promise<SupporterProfile> {
    const payload = { user_id: userId, ...input };
    const { data, error } = await supabase
      .from("supporter_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) throw error;
    return normalize(data as unknown as Row);
  },
};
