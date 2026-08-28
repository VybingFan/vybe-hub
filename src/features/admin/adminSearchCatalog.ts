export type AdminSearchDestination = {
  title: string;
  detail: string;
  href: string;
  keywords: string;
};

export const ADMIN_SEARCH_DESTINATIONS: AdminSearchDestination[] = [
  { title: "Back Office Overview", detail: "Administrative overview and operational totals", href: "/admin", keywords: "home dashboard overview operations" },
  { title: "Work Queue", detail: "Pending reviews and operational work", href: "/admin/work-queue", keywords: "queue pending review task notification" },
  { title: "Accounts", detail: "Members, roles, access, and deletion review", href: "/admin/accounts", keywords: "account member supporter role deletion" },
  { title: "Creators", detail: "Creator records, plans, profiles, and diagnostics", href: "/admin/creators", keywords: "creator artist profile membership plan" },
  { title: "Rights & Content", detail: "Platform content and rights operations", href: "/admin/rights", keywords: "rights content moderation media" },
  { title: "Music Rights Review", detail: "Music-sale declarations and approvals", href: "/admin/commerce-rights", keywords: "music rights sale declaration license sample beat commerce" },
  { title: "Copyright & DMCA", detail: "Notices, takedowns, counters, and audits", href: "/admin/copyright", keywords: "copyright dmca takedown counter notice infringement" },
  { title: "Seller Payout Readiness", detail: "Stripe onboarding and payout readiness", href: "/admin/seller-readiness", keywords: "stripe connect seller payout charge commerce" },
  { title: "Business Operations", detail: "Businesses, advertising, campaigns, and packages", href: "/admin/businesses", keywords: "business advertising campaign package" },
  { title: "Business Pilot", detail: "Pilot participants and controlled rollout", href: "/admin/business-pilot", keywords: "business pilot test rollout" },
  { title: "Partner Center", detail: "Partners and program administration", href: "/admin/partner-center", keywords: "partner sponsorship program document" },
  { title: "Offers", detail: "Business and promotional offers", href: "/admin/offers", keywords: "offer promotion discount business" },
  { title: "Memberships", detail: "Creator tiers, packages, entitlements, and renewals", href: "/admin/memberships", keywords: "membership tier plan entitlement renewal cancellation price" },
  { title: "Membership & Privacy Audit", detail: "Membership, privacy, continuity, commerce, and RLS diagnostics", href: "/admin/membership-audit", keywords: "audit privacy access lock continuity rls protected playback" },
  { title: "VYBE Blog", detail: "Create, edit, feature, and publish official VYBE editorial articles", href: "/admin/blog", keywords: "blog article editorial publishing post newsroom content" },
  { title: "Reports", detail: "Administrative analytics and reporting", href: "/admin/reports", keywords: "report analytics metric export" },
  { title: "Play Operations", detail: "Games, questions, packs, and publishing", href: "/admin/play", keywords: "play game trivia pack question publish" },
  { title: "System Health", detail: "Platform status and operational health", href: "/admin/system-health", keywords: "system health error status performance" },
  { title: "Admin Team", detail: "Administrative roles and permissions", href: "/admin/team", keywords: "admin team staff role permission access" },
  { title: "System Settings", detail: "Platform and administrator settings", href: "/settings", keywords: "system settings configuration" },
];

