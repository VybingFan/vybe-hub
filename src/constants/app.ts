export const APP_NAME = "VYBE";
export const APP_TAGLINE = "Where music becomes community.";
export const COMPANY = "Aision Labs";

export const NAV_LINKS = [
  { label: "Discover", to: "/explore" },
  { label: "Community", to: "/#community" },
  { label: "Merch", to: "/#merch" },
] as const;

export const BUILD_ON_VYBE_LINKS = [
  {
    label: "For Creators",
    description: "Build your creator home, share your work, and grow your community.",
    to: "/for-artists",
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
