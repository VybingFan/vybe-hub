import { supabase } from "@/integrations/supabase/client";

const database = supabase as any;

export type SupporterPreferences = {
  genres: string[];
  content_types: string[];
  discovery_radius: string;
};

export type CommunityConversation = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  topic: string;
  created_at: string;
};

export const supporterExperienceService = {
  async preferences(userId: string): Promise<SupporterPreferences> {
    const { data, error } = await database
      .from("supporter_preferences")
      .select("genres,content_types,discovery_radius")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? { genres: [], content_types: [], discovery_radius: "anywhere" };
  },

  async savePreferences(userId: string, value: SupporterPreferences) {
    const { error } = await database.from("supporter_preferences").upsert(
      { user_id: userId, ...value, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
  },

  async conversations(): Promise<CommunityConversation[]> {
    const { data, error } = await database
      .from("community_conversations")
      .select("id,author_id,title,body,topic,created_at")
      .eq("status", "visible")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async createConversation(userId: string, title: string, body: string, topic: string) {
    const { error } = await database.from("community_conversations").insert({
      author_id: userId,
      title: title.trim(),
      body: body.trim(),
      topic,
    });
    if (error) throw new Error(error.message);
  },
};
