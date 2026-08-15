import type { CreatorPlanCode, PublicCreatorPlanCode } from "@/features/membership/catalog";
import type { CreatorFocusCode } from "@/features/membership/creatorFocusAccess";

export type CreatorCapability =
  | "profile.custom_cover"
  | "profile.multiple_genres"
  | "music.workflow"
  | "video.library"
  | "video.native_upload"
  | "film.project_media_review"
  | "support.priority"
  | "team.workspace"
  | "commerce.prepare"
  | "creator_mode.browse";

const CAPABILITY_PLANS: Record<CreatorCapability, readonly PublicCreatorPlanCode[]> = {
  "profile.custom_cover": ["creator_plus", "creator_pro", "creator_studio"],
  "profile.multiple_genres": ["creator_plus", "creator_pro", "creator_studio"],
  "music.workflow": ["creator_plus", "creator_pro", "creator_studio"],
  "video.library": ["creator_plus", "creator_pro", "creator_studio"],
  "video.native_upload": ["creator_plus", "creator_pro", "creator_studio"],
  "film.project_media_review": ["creator_plus", "creator_pro", "creator_studio"],
  "support.priority": ["creator_plus", "creator_pro", "creator_studio"],
  "team.workspace": ["creator_studio"],
  "commerce.prepare": ["creator_plus", "creator_pro", "creator_studio"],
  "creator_mode.browse": ["creator_pro", "creator_studio"],
};

export function effectivePublicPlan(plan?: CreatorPlanCode | null): PublicCreatorPlanCode {
  return plan === "founding_beta" ? "creator_pro" : plan ?? "creator_free";
}

export function hasCreatorCapability(
  plan: CreatorPlanCode | null | undefined,
  capability: CreatorCapability,
) {
  return CAPABILITY_PLANS[capability].includes(effectivePublicPlan(plan));
}

export function hasActiveCreatorFocus(
  focusCode: CreatorFocusCode,
  access?: Array<{ focus_code: CreatorFocusCode; status: string; ends_at?: string | null }>,
) {
  const now = Date.now();
  return Boolean(
    access?.some(
      (item) =>
        item.focus_code === focusCode &&
        (item.status === "active" || item.status === "grace") &&
        (!item.ends_at || new Date(item.ends_at).getTime() > now),
    ),
  );
}
