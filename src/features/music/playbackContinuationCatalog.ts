export type PlaybackEntryPoint = {
  entry: string;
  firstQueue: string;
  sameCreatorNext: string;
  discoveryBoundary: string;
};

export const PLAYBACK_ENTRY_POINTS: PlaybackEntryPoint[] = [
  {
    entry: "Artist's Top 5",
    firstQueue: "Selected song, then remaining ranked Top 5 without repeats",
    sameCreatorNext: "Eligible creator catalog using the listener's chosen order",
    discoveryBoundary: "Offer similar creators or a VYBE Top 50 after the catalog ends",
  },
  {
    entry: "Creator playlist",
    firstQueue: "The playlist's saved song order",
    sameCreatorNext: "More eligible songs from the playlist creator",
    discoveryBoundary: "Offer similar creators or a genre chart after the playlist and catalog",
  },
  {
    entry: "Single public song",
    firstQueue: "The requested song",
    sameCreatorNext: "More eligible music from the same creator",
    discoveryBoundary: "Offer discovery after same-creator music",
  },
  {
    entry: "VYBE Top 50",
    firstQueue: "Published chart order for all genres or the selected genre",
    sameCreatorNext: "Stay in chart mode unless the listener opens a creator",
    discoveryBoundary: "Continue the selected chart; clearly label promoted placements",
  },
];

export const CREATOR_CATALOG_SORTS = [
  "Newest added",
  "Oldest added",
  "Newest release",
  "Oldest release",
  "Title A–Z",
  "Title Z–A",
] as const;

export const PLAYBACK_SAFETY_RULES = [
  "Recheck visibility, playback permission, expiry, grants, and purchase entitlement when every song starts.",
  "Never enqueue private, archived, expired, no-playback, or unauthorized music.",
  "Do not repeat a session song unless repeat is enabled.",
  "Tell the listener before autoplay crosses to another creator.",
  "Allow creators to exclude otherwise-public songs from recommendations.",
  "Keep sponsored placement separate from organic chart or similarity ranking.",
] as const;

