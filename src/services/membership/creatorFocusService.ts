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

export interface CreatorFocusRoleItem { focus_code: CreatorFocusCode; role_code: string; public_name: string; description: string; sort_order: number; }
export interface CreatorFocusCategoryItem { focus_code: CreatorFocusCode; category_code: string; creator_discovery_categories: { public_name: string } | null; }
export interface CreatorFocusReadinessItem { focus_code: CreatorFocusCode; readiness_status: CreatorFocusLaunchState | "blocked"; public_message: string; }

export const creatorFocusService = {
  async listCatalog(): Promise<CreatorFocusCatalogItem[]> {
    const { data, error } = await supabase.from("creator_focus_catalog" as any).select("focus_code,public_name,description,launch_state,sort_order").order("sort_order");
    if (error) raise(error);
    return (data || []) as unknown as CreatorFocusCatalogItem[];
  },
  async listTaxonomy() {
    const [roles, categories, readiness] = await Promise.all([
      supabase.from("creator_focus_roles" as any).select("focus_code,role_code,public_name,description,sort_order").eq("active", true).order("sort_order"),
      supabase.from("creator_focus_discovery_categories" as any).select("focus_code,category_code,creator_discovery_categories(public_name)"),
      supabase.from("creator_focus_readiness" as any).select("focus_code,readiness_status,public_message"),
    ]);
    if (roles.error) raise(roles.error); if (categories.error) raise(categories.error); if (readiness.error) raise(readiness.error);
    return { roles: (roles.data || []) as unknown as CreatorFocusRoleItem[], categories: (categories.data || []) as unknown as CreatorFocusCategoryItem[], readiness: (readiness.data || []) as unknown as CreatorFocusReadinessItem[] };
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
  async adminSetReadiness(focusCode: CreatorFocusCode, readinessStatus: CreatorFocusReadinessItem["readiness_status"]) {
    const message = readinessStatus === "available" ? "Workspace available now." : readinessStatus === "foundation" ? "Foundation tools are available while the workspace grows." : readinessStatus === "blocked" ? "Workspace is temporarily unavailable." : "Workspace planned; no paid access is being sold yet.";
    const { error } = await (supabase.from("creator_focus_readiness" as any) as any).update({ readiness_status: readinessStatus, public_message: message, updated_at: new Date().toISOString() }).eq("focus_code", focusCode);
    if (error) raise(error);
  },
};
