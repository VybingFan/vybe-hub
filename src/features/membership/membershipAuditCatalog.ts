export type AuditControlStatus = "enforced" | "partial" | "planned";

export type MembershipAuditControl = {
  domain: string;
  control: string;
  status: AuditControlStatus;
  evidence: string;
  nextAction: string;
};

export const MEMBERSHIP_AUDIT_CONTROLS: MembershipAuditControl[] = [
  {
    domain: "Memberships",
    control: "Shared creator tier catalog",
    status: "partial",
    evidence: "Core plans and quotas exist, but commerce is not yet a first-class entitlement.",
    nextAction: "Add commerce, sales limits, Lives, interviews, and rewards to the shared registry.",
  },
  {
    domain: "Feature locks",
    control: "Creator lock + server enforcement + clean public page",
    status: "partial",
    evidence: "EPK and protected playlists have enforcement; newer features need the same three-layer pattern.",
    nextAction: "Inventory every premium action and require all three protections.",
  },
  {
    domain: "Privacy",
    control: "Public, unlisted, private, protected, commerce, archived",
    status: "partial",
    evidence: "Music and playlists use several states, but one platform-wide vocabulary is not yet enforced.",
    nextAction: "Normalize labels and eligibility helpers across every content type.",
  },
  {
    domain: "Continuity",
    control: "30-day downgrade selection and private retention",
    status: "partial",
    evidence: "Tracks, playlists, merch, videos, and stories participate; commerce editions do not.",
    nextAction: "Add commerce listings and all future public modules to continuity.",
  },
  {
    domain: "Public presentation",
    control: "No public membership shaming or empty locked sections",
    status: "enforced",
    evidence: "Continuity is designed to hide unavailable content instead of showing public locks.",
    nextAction: "Regression-test every creator tier and public module.",
  },
  {
    domain: "Commerce",
    control: "Rights review and seller payout readiness",
    status: "enforced",
    evidence: "Active listings require rights approval and Stripe payout readiness.",
    nextAction: "Keep checkout disabled until webhook and fulfillment controls are complete.",
  },
  {
    domain: "Payments",
    control: "Verified checkout, orders, entitlements, refunds",
    status: "planned",
    evidence: "Foundation tables exist; checkout intentionally remains disabled.",
    nextAction: "Implement only after this audit and Stripe test-mode validation.",
  },
  {
    domain: "Media security",
    control: "Documented signed-URL duration by media purpose",
    status: "partial",
    evidence: "Signed URLs are used, but duration behavior needs one reviewed policy.",
    nextAction: "Separate public-preview, protected-stream, and download lifetimes.",
  },
  {
    domain: "Playback continuity",
    control: "Top 5, playlist, same-creator, and discovery queues",
    status: "planned",
    evidence: "The listening surfaces exist, but one deterministic continuation contract is not yet enforced.",
    nextAction: "Build the queue engine only after the proposed order, controls, and discovery boundary are approved.",
  },
];
