import type { CSSProperties } from "react";
import type { CreatorPlanCode } from "@/features/membership/catalog";
import { effectivePublicPlan } from "@/features/membership/access";
import type { CreatorProfile } from "@/features/profile/schema";

export function creatorCanUploadProfileBackground(plan?: CreatorPlanCode | null) {
  if (plan === "founding_beta") return true;
  const effective = effectivePublicPlan(plan);
  return effective === "creator_pro" || effective === "creator_studio";
}

export function getPublicCreatorThemeStyle(
  profile: Pick<CreatorProfile, "profile_theme" | "profile_background_url">,
  plan?: CreatorPlanCode | null,
): CSSProperties | undefined {
  if (
    profile.profile_theme !== "custom" ||
    !creatorCanUploadProfileBackground(plan) ||
    !profile.profile_background_url
  ) {
    return undefined;
  }

  const safeUrl = profile.profile_background_url.replace(/"/g, "%22");
  return {
    backgroundColor: "#070811",
    backgroundImage: `linear-gradient(rgba(5, 6, 14, .58), rgba(5, 6, 14, .76)), url("${safeUrl}")`,
    backgroundPosition: "center top",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundAttachment: "fixed",
  };
}
