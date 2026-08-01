import { supabase } from "@/integrations/supabase/client";
import type {
  PlayContentItem,
  PlayContentStatus,
  PlayDifficulty,
  PlayExperienceType,
  PlayRightsStatus,
} from "@/services/play/playContentAdminService";

export type PlayGameType = Extract<
  PlayExperienceType,
  "beat_blitz" | "vybe_match" | "hidden_gems" | "daily_vybe"
>;
export type PlayGamePackStatus = Exclude<PlayContentStatus, "rights_review">;

export interface PlayGamePack {
  id: string;
  pack_key: string;
  game_type: PlayGameType;
  title: string;
  description: string;
  genre: string;
  status: PlayGamePackStatus;
  visibility: "public" | "account_required";
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  version: number;
  published_at: string | null;
  updated_at: string;
}

export type PlayGamePackDraft = Omit<
  PlayGamePack,
  "id" | "status" | "version" | "published_at" | "updated_at"
> & { id?: string | null };

export interface PlayPackItemDraft {
  id?: string | null;
  game_pack_id: string;
  position: number;
  content_key: string;
  title: string;
  prompt: string;
  payload: PlayContentItem["payload"];
  explanation: string;
  difficulty: PlayDifficulty;
  rights_status: PlayRightsStatus;
  source_title: string | null;
  source_url: string | null;
  verification_notes: string;
  discovery_url: string | null;
}

type QueryError = { message: string };
type QueryResult<T> = { data: T | null; error: QueryError | null };
type SelectBuilder<T> = {
  order: (column: string, options: { ascending: boolean }) => Promise<QueryResult<T[]>>;
  eq: (column: string, value: string) => SelectBuilder<T>;
};
type PlayPackClient = {
  from: <T = unknown>(
    table: string,
  ) => {
    select: (columns: string) => SelectBuilder<T>;
  };
  rpc: <T = unknown>(name: string, args: Record<string, unknown>) => Promise<QueryResult<T>>;
};

const client = supabase as unknown as PlayPackClient;

export const playGamePackService = {
  async list(): Promise<PlayGamePack[]> {
    const { data, error } = await client
      .from<PlayGamePack>("play_game_packs")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async listItems(gamePackId: string): Promise<PlayContentItem[]> {
    const { data, error } = await client
      .from<PlayContentItem>("play_content_items")
      .select("*")
      .eq("game_pack_id", gamePackId)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async save(input: PlayGamePackDraft): Promise<PlayGamePack> {
    const { data, error } = await client.rpc<PlayGamePack>("save_play_game_pack_v24_33", {
      _id: input.id ?? null,
      _pack_key: input.pack_key,
      _game_type: input.game_type,
      _title: input.title,
      _description: input.description,
      _genre: input.genre,
      _visibility: input.visibility,
      _scheduled_start_at: input.scheduled_start_at,
      _scheduled_end_at: input.scheduled_end_at,
    });
    if (error) throw new Error(error.message);
    if (!data) throw new Error("The game pack was not returned after saving.");
    return data;
  },

  async setStatus(id: string, status: PlayGamePackStatus): Promise<PlayGamePack> {
    const { data, error } = await client.rpc<PlayGamePack>("set_play_game_pack_status_v24_33", {
      _id: id,
      _status: status,
    });
    if (error) throw new Error(error.message);
    if (!data) throw new Error("The game pack status was not returned after saving.");
    return data;
  },

  async saveItem(input: PlayPackItemDraft): Promise<PlayContentItem> {
    const { data, error } = await client.rpc<PlayContentItem>("save_play_pack_item_v24_33", {
      _id: input.id ?? null,
      _game_pack_id: input.game_pack_id,
      _position: input.position,
      _content_key: input.content_key,
      _title: input.title,
      _prompt: input.prompt,
      _payload: input.payload,
      _explanation: input.explanation,
      _difficulty: input.difficulty,
      _rights_status: input.rights_status,
      _source_title: input.source_title,
      _source_url: input.source_url,
      _verification_notes: input.verification_notes,
      _discovery_url: input.discovery_url,
    });
    if (error) throw new Error(error.message);
    if (!data) throw new Error("The pack item was not returned after saving.");
    return data;
  },
};
