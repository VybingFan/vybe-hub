import { supabase } from "@/integrations/supabase/client";
import type { PlayContentItem } from "@/services/play/playContentAdminService";
import type { PlayGamePack } from "@/services/play/playGamePackService";

export interface ReleasedPlayGamePack extends PlayGamePack {
  items: PlayContentItem[];
}

type Result<T> = { data: T[] | null; error: { message: string } | null };
type Builder<T> = {
  eq: (column: string, value: string) => Builder<T>;
  order: (column: string, options: { ascending: boolean }) => Promise<Result<T>>;
};
type Client = {
  from: <T>(table: string) => { select: (columns: string) => Builder<T> };
};

const client = supabase as unknown as Client;

function isReleased(entry: {
  status: string;
  visibility: string;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
}) {
  const now = Date.now();
  return (
    ["active", "scheduled"].includes(entry.status) &&
    entry.visibility === "public" &&
    (!entry.scheduled_start_at || new Date(entry.scheduled_start_at).getTime() <= now) &&
    (!entry.scheduled_end_at || new Date(entry.scheduled_end_at).getTime() > now)
  );
}

export const publicPlayGamePackService = {
  async listReleased(): Promise<ReleasedPlayGamePack[]> {
    const { data: packs, error } = await client
      .from<PlayGamePack>("play_game_packs")
      .select("*")
      .order("published_at", { ascending: false });
    if (error) throw new Error(error.message);

    const released = (packs ?? []).filter(isReleased);
    return Promise.all(
      released.map(async (pack) => {
        const { data: items, error: itemError } = await client
          .from<PlayContentItem>("play_content_items")
          .select("*")
          .eq("game_pack_id", pack.id)
          .order("position", { ascending: true });
        if (itemError) throw new Error(itemError.message);
        return { ...pack, items: (items ?? []).filter(isReleased) };
      }),
    );
  },
};
