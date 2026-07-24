export type PublicCreatorPlanCode =
  "creator_free" | "creator_plus" | "creator_pro" | "creator_studio";

export type CreatorPlanCode = PublicCreatorPlanCode | "founding_beta";
export type FeatureAvailability = "available" | "coming_soon" | "requires_upgrade";

export interface CreatorPlanCatalogEntry {
  code: PublicCreatorPlanCode;
  name: string;
  audience: string;
  monthlyPrice: number;
  annualPrice: number;
  pioneerMonthlyPrice?: number;
  pioneerAnnualPrice?: number;
  badge?: string;
  limits: {
    librarySongs: number;
    publishedSongs: number;
    playlists: number;
    merchItems: number;
    writtenPosts: number;
    videoMinutes: number;
    aiActions: number;
    teamMembers: number;
  };
  analytics: string;
  highlights: string[];
  launchState: "available" | "planned";
}

export const CREATOR_PLAN_CATALOG: CreatorPlanCatalogEntry[] = [
  {
    code: "creator_free",
    name: "Creator Free",
    audience: "Start a real creator home and share your work.",
    monthlyPrice: 0,
    annualPrice: 0,
    limits: {
      librarySongs: 15,
      publishedSongs: 10,
      playlists: 8,
      merchItems: 2,
      writtenPosts: 10,
      videoMinutes: 0,
      aiActions: 5,
      teamMembers: 1,
    },
    analytics: "30-day basic totals",
    highlights: [
      "Public creator page and VYBE username",
      "Music library, editors, and shareable playlists",
      "No credit card and no expiration",
      "One hosted YouTube or Vimeo video showcase",
    ],
    launchState: "available",
  },
  {
    code: "creator_plus",
    name: "Creator Plus",
    audience: "Grow an audience with more releases and creator tools.",
    monthlyPrice: 12,
    annualPrice: 120,
    pioneerMonthlyPrice: 9,
    pioneerAnnualPrice: 84,
    badge: "Recommended",
    limits: {
      librarySongs: 75,
      publishedSongs: 50,
      playlists: 30,
      merchItems: 10,
      writtenPosts: 50,
      videoMinutes: 30,
      aiActions: 30,
      teamMembers: 1,
    },
    analytics: "90-day creator analytics",
    highlights: [
      "Playlist-listen and profile-activity notifications",
      "Release scheduling and creator stories",
      "Creator Plus badge and priority email support",
      "Ten hosted videos; native storage and AI activate when connected",
    ],
    launchState: "planned",
  },
  {
    code: "creator_pro",
    name: "Creator Pro",
    audience: "Run multimedia releases, campaigns, and direct fan growth.",
    monthlyPrice: 24,
    annualPrice: 240,
    pioneerMonthlyPrice: 19,
    pioneerAnnualPrice: 180,
    limits: {
      librarySongs: 250,
      publishedSongs: 200,
      playlists: 100,
      merchItems: 50,
      writtenPosts: 250,
      videoMinutes: 180,
      aiActions: 100,
      teamMembers: 1,
    },
    analytics: "One year plus exports",
    highlights: [
      "Up to 50 hosted music videos, films, interviews, and episodes",
      "Custom creator domain and advanced profile design",
      "Campaign, presave, premiere, and audience tools",
      "Selling tools planned after commerce is connected",
    ],
    launchState: "planned",
  },
  {
    code: "creator_studio",
    name: "Creator Studio",
    audience: "Coordinate a professional creator team or production catalog.",
    monthlyPrice: 49,
    annualPrice: 490,
    pioneerMonthlyPrice: 39,
    pioneerAnnualPrice: 390,
    limits: {
      librarySongs: 500,
      publishedSongs: 400,
      playlists: 250,
      merchItems: 150,
      writtenPosts: 1000,
      videoMinutes: 600,
      aiActions: 300,
      teamMembers: 5,
    },
    analytics: "All-time and team reporting",
    highlights: [
      "Up to 200 hosted videos and five controlled team seats",
      "Multiple productions and approval workflows",
      "Branded media kits and partnership tools",
      "Live premieres, events, and studio onboarding planned",
    ],
    launchState: "planned",
  },
];

export const MEMBERSHIP_FEATURE_STATUS = {
  musicLibrary: "available",
  songAndPlaylistEditors: "available",
  publicCreatorLinks: "available",
  merchShowcase: "available",
  creatorStories: "coming_soon",
  creatorAnalytics: "coming_soon",
  creatorAssistant: "coming_soon",
  hostedVideoPublishing: "available",
  nativeVideoHosting: "coming_soon",
  commerce: "coming_soon",
  customDomains: "coming_soon",
  teamWorkspaces: "coming_soon",
} satisfies Record<string, FeatureAvailability>;

export const FOUNDING_CREATOR_NOTE =
  "Founding Creator remains invitation-only and is not a public membership.";

export const PIONEER_NOTE =
  "VYBE Pioneer is recognition for the first 50 public paying creators, not a separate plan.";
