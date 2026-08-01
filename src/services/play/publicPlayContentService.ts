import { supabase } from "@/integrations/supabase/client";
import type { PlayContentItem, PlayExperienceType } from "@/services/play/playContentAdminService";

type QueryResult = { data: PlayContentItem[] | null; error: { message: string } | null };
type PublicClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        order: (column: string, options: { ascending: boolean }) => Promise<QueryResult>;
      };
    };
  };
};

const client = supabase as unknown as PublicClient;

export const publicPlayContentService = {
  async listReleased(experienceType: PlayExperienceType): Promise<PlayContentItem[]> {
    const { data, error } = await client
      .from("play_content_items")
      .select("*")
      .eq("experience_type", experienceType)
      .order("published_at", { ascending: false });
    if (error) throw new Error(error.message);
    const now = Date.now();
    return (data ?? []).filter((item) => {
      const releaseStatus = item.status === "active" || item.status === "scheduled";
      const started =
        !item.scheduled_start_at || new Date(item.scheduled_start_at).getTime() <= now;
      const notEnded = !item.scheduled_end_at || new Date(item.scheduled_end_at).getTime() > now;
      return releaseStatus && item.visibility === "public" && started && notEnded;
    });
  },
};
