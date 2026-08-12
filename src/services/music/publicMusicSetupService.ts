import { supabase } from "@/integrations/supabase/client";

type LooseResult = { error: { message: string } | null };

type LooseClient = {
  from: (table: string) => {
    update: (values: Record<string, unknown>) => {
      eq: (
        column: string,
        value: string,
      ) => {
        eq: (column: string, value: string) => Promise<LooseResult>;
      };
    };
  };
  rpc: (name: string, args: Record<string, unknown>) => Promise<LooseResult>;
};

const database = supabase as unknown as LooseClient;

export const publicMusicSetupService = {
  async setTrackShown(trackId: string, creatorId: string, shown: boolean) {
    const result = await database
      .from("tracks")
      .update({
        show_on_public_profile: shown,
        ...(shown ? {} : { profile_feature_rank: null }),
      })
      .eq("id", trackId)
      .eq("creator_id", creatorId);

    if (result.error) throw new Error(result.error.message);
  },

  async setTopFivePosition(trackId: string, rank: number | null) {
    const result = await database.rpc("set_track_profile_feature_v24_39", {
      _track_id: trackId,
      _rank: rank,
    });

    if (result.error) throw new Error(result.error.message);
  },

  async setPlaylistShown(
    playlistId: string,
    creatorId: string,
    shown: boolean,
  ) {
    const result = await database
      .from("playlists")
      .update({ show_on_public_profile: shown })
      .eq("id", playlistId)
      .eq("creator_id", creatorId);

    if (result.error) throw new Error(result.error.message);
  },

  async setPlaylistDisplayOrder(creatorId: string, playlistIds: string[]) {
    for (const [index, playlistId] of playlistIds.entries()) {
      const result = await database
        .from("playlists")
        .update({ profile_display_order: index + 1 })
        .eq("id", playlistId)
        .eq("creator_id", creatorId);

      if (result.error) throw new Error(result.error.message);
    }
  },
};
