import { supabase } from "@/integrations/supabase/client";
import type { MusicRightsBasis } from "@/constants/legal";

export interface CreatorMusicRightsStatus {
  active: boolean;
  policy_version: string;
  default_rights_basis: MusicRightsBasis;
  certified_at: string;
  uploads_since_certification: number;
  uploads_until_renewal: number;
}

export const creatorRightsService = {
  async getMusicStatus(): Promise<CreatorMusicRightsStatus | null> {
    // Generated database types are refreshed after the V24.19 migration is applied remotely.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("creator_music_rights_status");
    if (error) throw error;
    return (data?.[0] as CreatorMusicRightsStatus | undefined) ?? null;
  },

  async certifyMusic(defaultBasis: MusicRightsBasis): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("certify_creator_music_rights", {
      requested_policy_version: "2026-07-29-music-v2",
      requested_default_basis: defaultBasis,
      statement_confirmed: true,
    });
    if (error) throw error;
  },
};
