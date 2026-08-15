import { supabase } from "@/integrations/supabase/client";
import type { CreatorFocusAccessSummary, CreatorFocusCode, CreatorFocusLaunchState } from "@/features/membership/creatorFocusAccess";

function raise(error: unknown): never {
  const message = error && typeof error === "object" && "message" in error
    ? String((error as { message: unknown }).message)
    : "Creator focus access could not be updated.";
  throw new Error(message);
}

export interface CreatorFocusCatalogItem {
  focus_code: CreatorFocusCode;
  public_name: string;
  description: string;
  launch_state: CreatorFocusLaunchState;
  sort_order: number;
}

export const creatorFocusService = {
  async listCatalog(): Promise<CreatorFocusCatalogItem[]> {
    const { data, error } = await supabase.from("creator_focus_catalog" as any).select("focus_code,public_name,description,launch_state,sort_order").order("sort_order");
    if (error) raise(error);
    return (data || []) as unknown as CreatorFocusCatalogItem[];
  },
  async getMine(): Promise<CreatorFocusAccessSummary> {
    const { data, error } = await (supabase.rpc as any)("get_my_creator_focus_access");
    if (error) raise(error);
    if (!data) throw new Error("Creator focus access is unavailable");
    return data as CreatorFocusAccessSummary;
  },
  async addFocus(focusCode: CreatorFocusCode) {
    const { error } = await (supabase.rpc as any)("add_my_creator_focus", { _focus_code: focusCode });
    if (error) raise(error);
  },
  async removeFocus(focusCode: CreatorFocusCode, confirmed: boolean) {
    const { error } = await (supabase.rpc as any)("remove_my_additional_focus", { _focus_code: focusCode, _confirmed: confirmed });
    if (error) raise(error);
  },
  async setPrimary(focusCode: CreatorFocusCode, confirmed: boolean) {
    const { error } = await (supabase.rpc as any)("set_my_primary_creator_focus", { _focus_code: focusCode, _confirmed: confirmed });
    if (error) raise(error);
  },
  async adminSetAccess(creatorId: string, focusCode: CreatorFocusCode, enabled: boolean) {
    const { error } = await (supabase.rpc as any)("admin_set_creator_focus_access", { _creator_id: creatorId, _focus_code: focusCode, _enabled: enabled });
    if (error) raise(error);
  },
};
