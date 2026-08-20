import { CREATOR_PLAN_CATALOG, type CreatorPlanCode, type PublicCreatorPlanCode, type PublicPresence } from "@/features/membership/catalog";
export type CreatorFeature = "creator.website.full"|"creator.website.advanced"|"creator_mode.browse"|"playlist.password"|"playlist.approved_listeners"|"playlist.access_reporting"|"epk.preview"|"epk.lite"|"epk.full"|"epk.export"|"stories.scheduling"|"analytics.export"|"team.workspace"|"creator_live.apply"|"creator_rewards.apply"|"commerce.prepare"|"commerce.publish"|"commerce.advanced";
const features:Record<PublicCreatorPlanCode,readonly CreatorFeature[]>={creator_free:["epk.preview"],creator_plus:["commerce.prepare","playlist.password","epk.preview","epk.lite","stories.scheduling"],creator_pro:["commerce.prepare","commerce.publish","creator.website.full","creator_mode.browse","playlist.password","playlist.approved_listeners","playlist.access_reporting","epk.preview","epk.lite","epk.full","epk.export","stories.scheduling","analytics.export","creator_live.apply","creator_rewards.apply"],creator_studio:["commerce.prepare","commerce.publish","commerce.advanced","creator.website.full","creator.website.advanced","creator_mode.browse","playlist.password","playlist.approved_listeners","playlist.access_reporting","epk.preview","epk.lite","epk.full","epk.export","stories.scheduling","analytics.export","team.workspace","creator_live.apply","creator_rewards.apply"]};
export function normalizeCreatorPlan(plan?:CreatorPlanCode|null):PublicCreatorPlanCode{return plan==="founding_beta"?"creator_pro":plan??"creator_free"}
export function getCreatorEntitlements(plan?:CreatorPlanCode|null){const effectivePlan=normalizeCreatorPlan(plan);const catalog=CREATOR_PLAN_CATALOG.find(x=>x.code===effectivePlan);if(!catalog)throw new Error("Unknown creator plan");return{effectivePlan,publicPresence:catalog.publicPresence as PublicPresence,features:new Set(features[effectivePlan]),limits:catalog.limits}}
export function hasCreatorFeature(plan:CreatorPlanCode|null|undefined,feature:CreatorFeature){return getCreatorEntitlements(plan).features.has(feature)}
export function minimumPlanForFeature(feature:CreatorFeature):PublicCreatorPlanCode{return CREATOR_PLAN_CATALOG.find(p=>features[p.code].includes(feature))?.code??"creator_studio"}

export type NowPlayingExperienceLevel = "standard" | "immersive" | "motion" | "motion_plus";

export function getNowPlayingExperienceLevel(
  plan?: CreatorPlanCode | null,
): NowPlayingExperienceLevel {
  switch (normalizeCreatorPlan(plan)) {
    case "creator_plus":
      return "immersive";
    case "creator_pro":
      return "motion";
    case "creator_studio":
      return "motion_plus";
    default:
      return "standard";
  }
}
