import { supabase } from "@/integrations/supabase/client";

export type PlayExperienceType =
  "beat_blitz" | "vybe_match" | "hidden_gems" | "daily_vybe" | "creator_spotlight" | "poll";
export type PlayContentStatus =
  | "draft"
  | "review_needed"
  | "rights_review"
  | "approved"
  | "scheduled"
  | "active"
  | "paused"
  | "retired"
  | "rejected";
export type PlayDifficulty = "intro" | "easy" | "medium" | "hard" | "expert";
export type PlayRightsStatus =
  "not_required" | "review_needed" | "creator_approved" | "licensed" | "restricted" | "rejected";

export interface PlayContentItem {
  id: string;
  content_key: string;
  experience_type: PlayExperienceType;
  title: string;
  prompt: string;
  payload: {
    choices?: string[];
    answer?: string;
    matches?: Array<{ left: string; right: string }>;
  };
  explanation: string;
  genre: string;
  difficulty: PlayDifficulty;
  status: PlayContentStatus;
  visibility: "public" | "account_required";
  rights_status: PlayRightsStatus;
  source_title: string | null;
  source_url: string | null;
  verification_notes: string;
  discovery_url: string | null;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  version: number;
  updated_at: string;
  game_pack_id: string | null;
  position: number | null;
}

export type PlayContentDraft = Omit<PlayContentItem, "id" | "status" | "version" | "updated_at"> & {
  id?: string | null;
};

type QueryResult<T> = { data: T | null; error: { message: string } | null };
type PlayContentClient = {
  from: (table: string) => {
    select: (columns: string) => {
      order: (
        column: string,
        options: { ascending: boolean },
      ) => Promise<QueryResult<PlayContentItem[]>>;
    };
  };
  rpc: (name: string, args: Record<string, unknown>) => Promise<QueryResult<PlayContentItem>>;
};

const client = supabase as unknown as PlayContentClient;

export const playContentAdminService = {
  async list(): Promise<PlayContentItem[]> {
    const { data, error } = await client
      .from("play_content_items")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async save(input: PlayContentDraft): Promise<PlayContentItem> {
    const { data, error } = await client.rpc("save_play_content_item_v24_32", {
      _id: input.id ?? null,
      _content_key: input.content_key,
      _experience_type: input.experience_type,
      _title: input.title,
      _prompt: input.prompt,
      _payload: input.payload,
      _explanation: input.explanation,
      _genre: input.genre,
      _difficulty: input.difficulty,
      _visibility: input.visibility,
      _rights_status: input.rights_status,
      _source_title: input.source_title,
      _source_url: input.source_url,
      _verification_notes: input.verification_notes,
      _discovery_url: input.discovery_url,
      _scheduled_start_at: input.scheduled_start_at,
      _scheduled_end_at: input.scheduled_end_at,
    });
    if (error) throw new Error(error.message);
    if (!data) throw new Error("The Play content item was not returned after saving.");
    return data;
  },

  async setStatus(id: string, status: PlayContentStatus): Promise<PlayContentItem> {
    const { data, error } = await client.rpc("set_play_content_status_v24_32", {
      _id: id,
      _status: status,
    });
    if (error) throw new Error(error.message);
    if (!data) throw new Error("The Play content status was not returned after saving.");
    return data;
  },

  async setRightsStatus(
    id: string,
    rightsStatus: PlayRightsStatus,
    verificationNotes: string,
  ): Promise<PlayContentItem> {
    const { data, error } = await client.rpc("set_play_content_rights_status_v24_32", {
      _id: id,
      _rights_status: rightsStatus,
      _verification_notes: verificationNotes,
    });
    if (error) throw new Error(error.message);
    if (!data) throw new Error("The Play rights status was not returned after saving.");
    return data;
  },
};
