export const APP_NAME = "VYBE";
export const APP_TAGLINE = "Where creators and supporters connect.";
export const COMPANY = "Aision Labs";

export const NAV_LINKS = [
  { label: "Discover", to: "/explore" },
  { label: "Marketplace", to: "/shop" },
] as const;

export const EXPERIENCE_LINKS = [
  { label: "Listen", to: "/experience/listen" },
  { label: "Watch", to: "/experience/watch" },
  { label: "Read", to: "/experience/read" },
  { label: "Play", to: "/experience/play" },
] as const;

export const COMMUNITY_LINKS = [
  { label: "Communities", to: "/experience/communities" },
  { label: "VYBE Events", to: "/experience/events" },
] as const;

export const BUILD_ON_VYBE_LINKS = [
  {
    label: "Creator Start",
    description: "Create an account, sign in, open Studio, or install the VYBE Creator app.",
    to: "/creator",
  },
  {
    label: "For Music Creators",
    description: "Share music, playlists, merchandise, stories, and your creator home.",
    to: "/for-artists",
  },
  {
    label: "For Film & Video Creators",
    description: "Preview a future home for films, trailers, videos, screenings, and audiences.",
    to: "/for-film-video",
  },
  {
    label: "For Writers & Poets",
    description: "Preview how poetry, lyrics, stories, and written work can live on VYBE.",
    to: "/for-writers-poets",
  },
  {
    label: "Creator Memberships",
    description: "Compare Free, Plus, Pro, and Studio plans with honest launch status.",
    to: "/creator-memberships",
  },
  {
    label: "For Businesses",
    description: "Discover partnership, promotion, venue, and brand opportunities.",
    to: "/for-businesses",
  },
  {
    label: "Creator sign in",
    description: "Go directly to your creator tools and dashboard.",
    to: "/auth/sign-in",
  },
] as const;

export const MORE_LINKS = [
  { label: "About VYBE", to: "/about" },
  { label: "How VYBE Works", to: "/about#how-vybe-works" },
  { label: "FAQ", to: "/faq" },
  { label: "Trust & Safety", to: "/trust" },
  { label: "Copyright", to: "/copyright" },
  { label: "Help Center", to: "/help" },
] as const;
