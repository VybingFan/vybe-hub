import type { PublicCreatorPlanCode } from "@/features/membership/catalog";

export type LockedFeatureEducationKey =
  | "profile_background"
  | "multiple_genres"
  | "video_library"
  | "film_review"
  | "priority_support"
  | "team_workspace"
  | "playlist_password"
  | "playlist_approved_listeners"
  | "analytics_export"
  | "epk_full"
  | "commerce_prepare"
  | "commerce_publish"
  | "creator_browsing";

export interface LockedFeatureEducation {
  title: string;
  description: string;
  howItWorks: string[];
  benefits: string[];
  requiredPlan: PublicCreatorPlanCode;
  requiredPlanLabel: string;
}

export const LOCKED_FEATURE_EDUCATION: Record<LockedFeatureEducationKey, LockedFeatureEducation> = {
  profile_background: {
    title: "Build a more immersive public creator page",
    description: "A full-page background carries your visual identity behind the music, profile, and calls to action while VYBE preserves readability.",
    howItWorks: ["Upload one landscape image for the full public-page canvas.", "Your profile photo and standard banner remain separate, so each asset keeps its purpose.", "VYBE adds a readability layer behind text and controls."],
    benefits: ["Creates a stronger first impression", "Keeps campaign visuals consistent", "Makes shared pages feel creator-owned", "Supports a professional release presentation"],
    requiredPlan: "creator_pro",
    requiredPlanLabel: "Creator Pro or Creator Studio",
  },
  multiple_genres: {
    title: "Reach listeners through more than one genre",
    description: "Multiple genres describe cross-genre work more accurately and create additional discovery paths without changing your primary identity.",
    howItWorks: ["Keep one primary genre and add relevant secondary genres.", "VYBE can use the additional signals in discovery and profile presentation.", "Choose only genres that genuinely describe your work."],
    benefits: ["Improves discovery accuracy", "Represents hybrid sounds", "Supports collaboration matching", "Reduces reliance on one category"],
    requiredPlan: "creator_plus",
    requiredPlanLabel: "Creator Plus or higher",
  },
  video_library: {
    title: "Tell the story around your music with video",
    description: "The Video Library keeps performances, interviews, trailers, short films, and behind-the-scenes content beside your music and creator identity.",
    howItWorks: ["Add an authorized hosted video or upload supported video directly.", "Save drafts, publish when ready, and manage video visibility.", "Share a VYBE video link without separating the viewer from your creator ecosystem."],
    benefits: ["Deepens audience connection", "Adds context behind releases", "Supports visual discovery", "Keeps more creator media in one destination"],
    requiredPlan: "creator_plus",
    requiredPlanLabel: "Creator Plus or higher",
  },
  film_review: {
    title: "Organize film media and prepare focused reviews",
    description: "Project Media & Review connects scenes, trailers, clips, and rough cuts to a production and records exactly what reviewers should evaluate.",
    howItWorks: ["Attach Video Library items to a film project.", "Label each asset by role and completion state.", "Prepare private-review briefs with purpose and instructions before secure delivery."],
    benefits: ["Reduces production confusion", "Keeps versions tied to projects", "Improves the quality of feedback", "Prepares work for collaborators and reviewers"],
    requiredPlan: "creator_plus",
    requiredPlanLabel: "Creator Plus or higher",
  },
  priority_support: {
    title: "Get faster help for active creator work",
    description: "Priority creator support gives time-sensitive publishing, account, and workflow questions a dedicated path.",
    howItWorks: ["Submit the issue from the creator workspace.", "Include the affected tool and the result you expected.", "The request is marked for priority creator review."],
    benefits: ["Shortens avoidable delays", "Keeps launch work moving", "Provides clearer issue context", "Creates a support record for follow-up"],
    requiredPlan: "creator_plus",
    requiredPlanLabel: "Creator Plus or higher",
  },
  team_workspace: {
    title: "Manage a collective, label, or creative team",
    description: "The Organization Workspace presents multiple creators and team roles without erasing each creator's individual identity and ownership.",
    howItWorks: ["Create an organization profile and mission.", "Build a roster with roles, departments, and featured creators.", "Keep organization presentation separate from individual creator accounts."],
    benefits: ["Clarifies team structure", "Supports roster growth", "Presents a unified brand", "Preserves individual creator identity"],
    requiredPlan: "creator_studio",
    requiredPlanLabel: "Creator Studio",
  },
  playlist_password: {
    title: "Share unreleased playlists with more control",
    description: "Password protection adds a simple access boundary for previews, pitches, and private listening moments.",
    howItWorks: ["Choose password-protected access when creating a playlist.", "Set an expiration within your plan allowance.", "Send the playlist link and password through the channel you choose."],
    benefits: ["Supports private previews", "Creates safer pitch links", "Limits casual forwarding", "Keeps one controlled listening destination"],
    requiredPlan: "creator_plus",
    requiredPlanLabel: "Creator Plus or higher",
  },
  playlist_approved_listeners: {
    title: "Choose exactly who can open a playlist",
    description: "Approved-listener access is for sensitive pitches and reviews where a password alone is not enough.",
    howItWorks: ["Create a playlist for approved listeners.", "Require sign-in and authorize the intended recipients.", "Use access reporting to understand controlled opens."],
    benefits: ["Adds recipient-level control", "Supports professional review workflows", "Reduces unintended access", "Improves pitch accountability"],
    requiredPlan: "creator_pro",
    requiredPlanLabel: "Creator Pro or Creator Studio",
  },
  analytics_export: {
    title: "Turn creator insights into a portable performance record",
    description: "Longer reporting windows and CSV export help you review campaigns and share credible results with your team or partners.",
    howItWorks: ["Review listening, retention, playlist, and engagement performance.", "Use a longer history to compare releases over time.", "Export song-level results for planning or professional review."],
    benefits: ["Supports better release decisions", "Makes trends easier to compare", "Creates partner-ready reporting", "Preserves a working analytics record"],
    requiredPlan: "creator_pro",
    requiredPlanLabel: "Creator Pro or Creator Studio",
  },
  epk_full: {
    title: "Prepare a professional creator package",
    description: "A full EPK organizes the biography, contacts, brand files, credits, and proof that industry reviewers commonly need.",
    howItWorks: ["Create purpose-specific bios and professional contact details.", "Add credits and approved brand materials.", "Export or privately share a complete package for the opportunity."],
    benefits: ["Reduces back-and-forth with partners", "Improves professional presentation", "Keeps key materials current", "Supports pitches, press, booking, and licensing"],
    requiredPlan: "creator_pro",
    requiredPlanLabel: "Creator Pro or Creator Studio",
  },
  commerce_prepare: {
    title: "Prepare music for direct sales",
    description: "Commerce preparation turns a song or permanent collection into a structured product before live checkout is activated.",
    howItWorks: ["Choose a published song or collection.", "Set the title, description, price, and intended fulfillment.", "Complete rights and seller-readiness information before activation."],
    benefits: ["Creates a direct-sales foundation", "Organizes rights before launch", "Tests offers without rushing checkout", "Keeps products connected to VYBE content"],
    requiredPlan: "creator_plus",
    requiredPlanLabel: "Creator Plus or higher",
  },
  commerce_publish: {
    title: "Move a prepared sales listing toward launch",
    description: "Publishing controls are the final creator-side step after the product, rights, and seller details are ready.",
    howItWorks: ["Prepare the product and confirm its source content.", "Complete the required rights declaration.", "Activate the listing when VYBE checkout and payout readiness allow it."],
    benefits: ["Creates a repeatable sales workflow", "Separates preparation from launch", "Reduces rights mistakes", "Supports future direct-to-supporter revenue"],
    requiredPlan: "creator_pro",
    requiredPlanLabel: "Creator Pro or Creator Studio",
  },
  creator_browsing: {
    title: "Browse VYBE while keeping your creator identity active",
    description: "Creator-mode browsing lets you explore and engage without repeatedly switching away from your creator workspace.",
    howItWorks: ["Open VYBE discovery from creator mode.", "Browse public creators and experiences with the appropriate identity context.", "Return to Creator HQ without losing your working mode."],
    benefits: ["Makes collaboration discovery easier", "Reduces account-mode friction", "Supports creator-to-creator networking", "Keeps work and discovery connected"],
    requiredPlan: "creator_pro",
    requiredPlanLabel: "Creator Pro or Creator Studio",
  },
};
