import { supabase } from "@/integrations/supabase/client";
import type { CreatorProfile, CreatorProfileInput, PersonalLink } from "@/features/profile/schema";

type Row = Omit<CreatorProfile, "personal_links"> & { personal_links: unknown };

function normalize(row: Row): CreatorProfile {
  const links = Array.isArray(row.personal_links) ? (row.personal_links as PersonalLink[]) : [];
  return { ...row, personal_links: links };
}

export const creatorProfileService = {
  async fetch(userId: string): Promise<CreatorProfile | null> {
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ? normalize(data as unknown as Row) : null;
  },

  async upsert(userId: string, input: CreatorProfileInput): Promise<CreatorProfile> {
    const payload = {
      user_id: userId,
      ...input,
      personal_links: input.personal_links ?? [],
    };
    const { data, error } = await supabase
      .from("creator_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) throw error;
    return normalize(data as unknown as Row);
  },
};
