import {
  BarChart3, BellRing, BookOpenText, Eye, FileCheck2, Film, Heart,
  ListMusic, Music2, Share2, ShieldCheck, Upload, UserRound, Video,
} from "lucide-react";

export type GuideRole = "creator" | "supporter" | "business" | "admin";

export interface VybeGuideItem {
  id: string;
  title: string;
  summary: string;
  what: string;
  where: string;
  route?: string;
  roles: GuideRole[];
  keywords: string[];
  icon: typeof UserRound;
}

export interface CreatorOnboardingStep {
  id: string;
  title: string;
  short: string;
  instruction: string;
  route: string;
  actionLabel: string;
  minutes: number;
  guideItemId: string;
}

export const CREATOR_ONBOARDING_STEPS: CreatorOnboardingStep[] = [
  {
    id: "rules",
    title: "Review the creator rules",
    short: "Know the basics before you publish.",
    instruction: "What to do: Open Creator Rules and review the basic publishing, ownership, copyright, privacy, and community expectations. Upload-specific confirmations will still appear when you publish content.",
    route: "/creator-compliance",
    actionLabel: "Review Creator Rules",
    minutes: 1,
    guideItemId: "rights",
  },
  {
    id: "profile",
    title: "Build your creator profile",
    short: "Photo, creator name, bio, genres, links, and public profile basics.",
    instruction: "What to do: Open Public Profile & Discovery and complete the essentials people need to recognize you. Add your creator name, photo, bio, genres, and important links. You can polish the rest later.",
    route: "/profile",
    actionLabel: "Build My Profile",
    minutes: 1,
    guideItemId: "profile",
  },
  {
    id: "music",
    title: "Add your first song",
    short: "Add one track so you can experience VYBE as a creator.",
    instruction: "What to do: Open Upload Music and add one song. Complete the required song details and rights confirmation, then save it to your library.",
    route: "/music/upload",
    actionLabel: "Upload Music",
    minutes: 1,
    guideItemId: "music-upload",
  },
  {
    id: "visibility",
    title: "Choose who can see your content",
    short: "Understand Public, Unlisted, and Private.",
    instruction: "What to know: Public content can be discovered broadly. Unlisted content is intended for people with a direct link. Private content stays in your creator workspace until you are ready.",
    route: "/music",
    actionLabel: "View My Music Library",
    minutes: 0.5,
    guideItemId: "visibility",
  },
  {
    id: "playlist",
    title: "Create a playlist",
    short: "Group songs, publish the playlist, and copy its share link.",
    instruction: "What to do: Open Playlists, create one playlist, add songs, and use its sharing tools. This gives supporters a direct VYBE listening experience you can send anywhere.",
    route: "/playlists",
    actionLabel: "Create a Playlist",
    minutes: 1,
    guideItemId: "playlists",
  },
  {
    id: "audience",
    title: "See what your audience is doing",
    short: "Insights, Connections, and notifications.",
    instruction: "What to do: Open Insights and take a quick look around. This is where you return after sharing your VYBE to understand audience and performance activity as data becomes available.",
    route: "/creator-analytics",
    actionLabel: "View My Insights",
    minutes: 0.5,
    guideItemId: "insights",
  },
  {
    id: "ready",
    title: "You're ready to VYBE",
    short: "Your essential creator setup is complete.",
    instruction: "Your essential creator setup is complete. Use the VG quick tool whenever you need directions, and Settings > VYBE Guide for detailed explanations of every major VYBE tool.",
    route: "/dashboard",
    actionLabel: "Go to Creator Dashboard",
    minutes: 0,
    guideItemId: "guide",
  },
];

export const VYBE_GUIDE_ITEMS: VybeGuideItem[] = [
  {
    id: "guide",
    title: "VYBE Guide & Quick VG tool",
    summary: "The full reference library and the small VG navigation helper.",
    what: "The full VYBE Guide explains what features mean, what they do, and where to find them. The VG button is the fast navigation companion you can open from the VYBE header.",
    where: "Settings > VYBE Guide. The VG circle appears beside the VYBE logo.",
    route: "/settings",
    roles: ["creator", "supporter", "business", "admin"],
    keywords: ["help", "guide", "vg", "quick help", "where"],
    icon: BookOpenText,
  },
  {
    id: "profile",
    title: "Public Profile & Discovery",
    summary: "Your creator identity and the page supporters discover.",
    what: "Your public profile brings your creator identity, bio, imagery, links, and public experiences together in one place.",
    where: "Creator Studio > Profile & Growth > Public Profile & Discovery.",
    route: "/profile",
    roles: ["creator", "admin"],
    keywords: ["profile", "bio", "creator page", "photo", "links", "discovery"],
    icon: UserRound,
  },
  {
    id: "music-upload",
    title: "Upload Music",
    summary: "Add music to your VYBE library.",
    what: "Upload Music adds a track and its creator-facing metadata to your library. Rights confirmation is required before publishing.",
    where: "Creator Studio > Upload Music.",
    route: "/music/upload",
    roles: ["creator", "admin"],
    keywords: ["song", "music", "upload", "track", "rights"],
    icon: Upload,
  },
  {
    id: "music-library",
    title: "Music Library",
    summary: "Manage uploaded songs and their publishing state.",
    what: "Music Library is where creators review uploaded tracks, manage availability, and return to songs after upload.",
    where: "Creator Studio > Music Library.",
    route: "/music",
    roles: ["creator", "admin"],
    keywords: ["music library", "songs", "tracks", "manage"],
    icon: Music2,
  },
  {
    id: "visibility",
    title: "Public, unlisted, and private",
    summary: "Visibility controls who can access a piece of content.",
    what: "Public content is intended for general VYBE discovery. Unlisted content is intended for direct-link sharing without broad discovery. Private content remains creator-only until you change it.",
    where: "Visibility controls appear where supported while managing or publishing content.",
    route: "/music",
    roles: ["creator", "admin"],
    keywords: ["public", "private", "unlisted", "visibility", "publish"],
    icon: Eye,
  },
  {
    id: "playlists",
    title: "Playlists & sharing",
    summary: "Create a listening experience and send it directly to supporters.",
    what: "Playlists group songs into a shareable VYBE experience. Published playlists can be shared through their direct link.",
    where: "Creator Studio > Playlists. Open a playlist to manage songs and sharing.",
    route: "/playlists",
    roles: ["creator", "admin"],
    keywords: ["playlist", "share", "copy link", "songs", "listening"],
    icon: ListMusic,
  },
  {
    id: "insights",
    title: "Insights",
    summary: "See creator-facing audience and performance information.",
    what: "Insights is the creator analytics area. It helps you understand how people are interacting with your VYBE presence as data becomes available.",
    where: "Creator Studio > Audience > Insights.",
    route: "/creator-analytics",
    roles: ["creator", "admin"],
    keywords: ["insights", "analytics", "audience", "views", "engagement"],
    icon: BarChart3,
  },
  {
    id: "connections",
    title: "Connections",
    summary: "Manage supporter and creator relationship activity.",
    what: "Connections is where creator-facing relationship and connection activity is organized.",
    where: "Creator Studio > Audience > Connections.",
    route: "/connections",
    roles: ["creator", "admin"],
    keywords: ["connections", "supporters", "followers", "audience"],
    icon: Heart,
  },
  {
    id: "notifications",
    title: "Notifications",
    summary: "Control activity preferences and optional VYBE sounds.",
    what: "Notification preferences control the activity signals VYBE currently supports. Some future delivery channels remain under development.",
    where: "Creator Settings > Notifications.",
    route: "/settings",
    roles: ["creator", "supporter", "business", "admin"],
    keywords: ["notifications", "alerts", "sound", "activity", "chime"],
    icon: BellRing,
  },
  {
    id: "video",
    title: "Video Library",
    summary: "Hosted and native video tools for eligible creator plans.",
    what: "Video Library lets eligible creators add hosted video and, where enabled, upload native video for VYBE-hosted playback.",
    where: "Creator Studio > Video Library.",
    route: "/videos",
    roles: ["creator", "admin"],
    keywords: ["video", "stream", "youtube", "vimeo", "native upload"],
    icon: Video,
  },
  {
    id: "film",
    title: "Film Studio & project media",
    summary: "Creator-focus tools for film/video work.",
    what: "Film-focused creator tools organize project media, review workflows, and film-specific experiences when that creator focus is enabled.",
    where: "Creator Studio > Film Studio and Project Media & Review.",
    route: "/film-studio",
    roles: ["creator", "admin"],
    keywords: ["film", "movie", "project media", "review", "video focus"],
    icon: Film,
  },
  {
    id: "rights",
    title: "Terms, publishing rights & copyright",
    summary: "Know what you can upload, publish, and share.",
    what: "Your VYBE account is governed by the Terms, Privacy Policy, Community Guidelines, and copyright rules. Publishing workflows may separately require you to confirm that you own content or have permission to use it.",
    where: "Terms, Privacy, Copyright, and Community Guidelines are available from VYBE legal/help areas. Creator publishing confirmations appear inside upload and publishing workflows.",
    route: "/creator-compliance",
    roles: ["creator", "admin"],
    keywords: ["terms", "privacy", "copyright", "rights", "agreement", "permission", "community guidelines"],
    icon: ShieldCheck,
  },
  {
    id: "epk",
    title: "Industry Kit & EPK",
    summary: "Build professional creator-facing materials in one place.",
    what: "The EPK area organizes professional creator information and assets for industry-facing use.",
    where: "Creator Studio > Profile & Growth > Industry Kit & EPK.",
    route: "/epk",
    roles: ["creator", "admin"],
    keywords: ["epk", "industry kit", "press kit", "professional"],
    icon: FileCheck2,
  },
  {
    id: "sharing",
    title: "Sharing VYBE",
    summary: "Send supporters directly to a creator, song, playlist, or public experience.",
    what: "VYBE sharing tools are designed to give supporters a direct destination rather than requiring them to search through unrelated social posts.",
    where: "Look for Copy Link or Share actions on public creator experiences and creator management pages.",
    roles: ["creator", "supporter", "business", "admin"],
    keywords: ["share", "copy link", "link", "supporters"],
    icon: Share2,
  },
];
