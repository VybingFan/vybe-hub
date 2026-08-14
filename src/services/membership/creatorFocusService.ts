import { supabase } from "@/integrations/supabase/client";
import type { CreatorFocusAccessSummary, CreatorFocusCode } from "@/features/membership/creatorFocusAccess";

export const creatorFocusService = {
  async getMine(): Promise<CreatorFocusAccessSummary> {
    const { data, error } = await (supabase.rpc as any)("get_my_creator_focus_access");
    if (error) throw error;
    if (!data) throw new Error("Creator focus access is unavailable");
    return data as CreatorFocusAccessSummary;
  },

  async setPrimary(focusCode: CreatorFocusCode, confirmed: boolean) {
    const { error } = await (supabase.rpc as any)("set_my_primary_creator_focus", {
      _focus_code: focusCode,
      _confirmed: confirmed,
    });
    if (error) throw error;
  },

  async adminSetAccess(creatorId: string, focusCode: CreatorFocusCode, enabled: boolean) {
    const { error } = await (supabase.rpc as any)("admin_set_creator_focus_access", {
      _creator_id: creatorId,
      _focus_code: focusCode,
      _enabled: enabled,
    });
    if (error) throw error;
  },
};
