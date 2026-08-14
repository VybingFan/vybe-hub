export type CreatorFocusCode =
  | "music"
  | "film"
  | "theater"
  | "writing"
  | "visual_art"
  | "podcasting"
  | "dance";

export type CreatorFocusLaunchState = "available" | "foundation" | "planned";
export type CreatorFocusAccessKind = "primary" | "additional";
export type CreatorFocusAccessStatus = "active" | "grace" | "inactive";

export interface CreatorFocusAccessItem {
  focus_code: CreatorFocusCode;
  access_kind: CreatorFocusAccessKind;
  status: CreatorFocusAccessStatus;
  source: "migration" | "subscription" | "admin" | "founding";
  starts_at: string;
  ends_at: string | null;
  public_name: string;
  description: string;
  launch_state: CreatorFocusLaunchState;
  sort_order: number;
}

export interface CreatorFocusAccessSummary {
  primary_focus: CreatorFocusCode;
  focus_limit: number;
  active_focus_count: number;
  can_add_second_focus: boolean;
  can_use_multi_focus: boolean;
  access: CreatorFocusAccessItem[];
}

export const CREATOR_FOCUS_ADD_ON_PRICING = {
  secondFocus: { monthly: 8, annual: 80 },
  proMultiFocus: { monthly: 15, annual: 150, maximumFocuses: 5 },
  studioMultiFocus: { monthly: 20, annual: 200, maximumFocuses: 5 },
} as const;
