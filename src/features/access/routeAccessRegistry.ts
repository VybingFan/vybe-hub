import type { AppRole } from "@/features/auth/roles";
import type { CreatorCapability } from "@/features/membership/access";
import type { CreatorFocusCode } from "@/features/membership/creatorFocusAccess";

export type VybeExperience = "public" | "supporter" | "creator_studio" | "business_portal" | "back_office" | "account" | "server_api";
export type RouteProtection = "public" | "session" | "operations_session" | "role" | "permission" | "membership" | "focus" | "signature";

export interface RouteAccessRule {
  id: string;
  experience: VybeExperience;
  paths: readonly string[];
  roles?: readonly AppRole[];
  protection: readonly RouteProtection[];
  capability?: CreatorCapability;
  focus?: CreatorFocusCode;
  followUp?: "V24.44B" | "V24.44C" | "V24.44D" | "V24.44E";
}

const sharedRoles = ["supporter", "creator", "business", "admin"] as const;
const creatorRoles = ["creator", "admin"] as const;

/**
 * Authoritative route-family registry established by V24.44A. Paths use the
 * browser URL, with :parameters for dynamic segments. More-specific rules
 * must remain above broader families.
 */
export const ROUTE_ACCESS_REGISTRY: readonly RouteAccessRule[] = [
  { id: "back-office", experience: "back_office", paths: ["/admin", "/admin/*"], roles: ["admin"], protection: ["session", "operations_session", "role", "permission"], followUp: "V24.44C" },
  { id: "business-portal", experience: "business_portal", paths: ["/business"], roles: ["business", "admin"], protection: ["session", "role"], followUp: "V24.44D" },
  { id: "creator-video", experience: "creator_studio", paths: ["/videos"], roles: creatorRoles, protection: ["session", "role", "membership"], capability: "video.library" },
  { id: "creator-film-review", experience: "creator_studio", paths: ["/film-project-media"], roles: creatorRoles, protection: ["session", "role", "membership", "focus"], capability: "film.project_media_review", focus: "film" },
  { id: "creator-film", experience: "creator_studio", paths: ["/film-studio", "/film-playlists"], roles: creatorRoles, protection: ["session", "role", "focus"], focus: "film" },
  { id: "creator-writing", experience: "creator_studio", paths: ["/writing-studio", "/writing-work/:workId", "/writing-collections"], roles: creatorRoles, protection: ["session", "role", "focus"], focus: "writing" },
  { id: "creator-social-discovery", experience: "creator_studio", paths: ["/social-discovery"], roles: creatorRoles, protection: ["session", "role"] },
  { id: "creator-team", experience: "creator_studio", paths: ["/organization"], roles: creatorRoles, protection: ["session", "role", "membership"], capability: "team.workspace" },
  { id: "creator-priority-support", experience: "creator_studio", paths: ["/creator-support"], roles: creatorRoles, protection: ["session", "role", "membership"], capability: "support.priority" },
  { id: "creator-studio", experience: "creator_studio", paths: ["/activity", "/commerce", "/connections", "/content", "/content-continuity", "/creator-analytics", "/creator-compliance", "/creator-focuses", "/dashboard", "/epk", "/merch", "/music", "/music/:trackId", "/music/:trackId/lyrics", "/music/upload", "/playlists", "/playlists/:playlistId", "/public-music", "/stories"], roles: creatorRoles, protection: ["session", "role"] },
  { id: "account-profile", experience: "account", paths: ["/profile", "/settings", "/supporter-profile", "/supporter-interests"], roles: sharedRoles, protection: ["session", "role"] },
  { id: "member-experience", experience: "supporter", paths: ["/home", "/discover", "/listen", "/watch", "/read", "/play", "/my-vybe", "/communities", "/events"], roles: sharedRoles, protection: ["session", "role"] },
  { id: "auth-and-invites", experience: "account", paths: ["/auth/*", "/admin-invite/:token", "/creator-invite/:token"], protection: ["public"] },
  { id: "public-creators", experience: "public", paths: ["/creator/:username", "/artist/:username", "/artist/:username/playlist/:slug", "/playlist/:slug", "/video/:videoId", "/work/:slug", "/reading/:slug"], protection: ["public"], followUp: "V24.44E" },
  { id: "public-experiences", experience: "public", paths: ["/experience/*", "/explore", "/demo/*"], protection: ["public"] },
  { id: "public-marketing", experience: "public", paths: ["/", "/about", "/community-guidelines", "/copyright", "/copyright/report", "/creator-memberships", "/faq", "/for-artists", "/for-businesses", "/for-film-video", "/for-writers-poets", "/help", "/privacy", "/terms", "/trust"], protection: ["public"] },
  { id: "stripe-webhook", experience: "server_api", paths: ["/api/stripe/webhook"], protection: ["signature"] },
  { id: "stripe-connect", experience: "server_api", paths: ["/api/stripe/connect"], roles: creatorRoles, protection: ["session", "role", "membership"] },
  { id: "authenticated-apis", experience: "server_api", paths: ["/api/account-deletion", "/api/admin-team-invite", "/api/secure-playlist", "/api/stripe/checkout", "/api/stripe/focus-checkout", "/api/stripe/social-discovery-checkout", "/api/stripe/portal", "/api/video-status", "/api/video-upload-url"], protection: ["session", "role"] },
] as const;

function matches(pathname: string, pattern: string) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/:[^/]+/g, "[^/]+");
  return new RegExp(`^${escaped}/?$`).test(pathname);
}

export function getRouteAccessRule(pathname: string) {
  return ROUTE_ACCESS_REGISTRY.find((rule) => rule.paths.some((pattern) => matches(pathname, pattern)));
}

export const ACCESS_AUDIT_FOLLOW_UPS = [
  { bundle: "V24.44B", finding: "Back Office now requires a short-lived Operations session; set VITE_OPERATIONS_HOST when the production staff origin is provisioned." },
  { bundle: "V24.44C", finding: "Operations routes and modules still exist in the ordinary application bundle." },
  { bundle: "V24.44D", finding: "The current business route is a foundation, not a fully separated advertiser portal." },
  { bundle: "V24.44E", finding: "Public discovery eligibility needs one consolidated database-enforced publishing decision." },
] as const;
