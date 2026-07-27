export const PLAY_GENRES = [
  "Mixed VYBE",
  "R&B & Soul",
  "Hip-Hop & Rap",
  "Pop",
  "Rock",
  "Country",
  "Jazz",
  "Gospel & Inspirational",
  "Electronic & Dance",
  "Latin",
  "Reggae & Caribbean",
  "Alternative & Indie",
] as const;

export type PlayGenre = (typeof PLAY_GENRES)[number];

export const AVAILABLE_PLAY_GENRES: PlayGenre[] = ["Mixed VYBE"];

export const DAILY_PLAY_ITEMS = [
  {
    id: "daily-trivia",
    title: "Daily Trivia",
    detail: "A short three-question round built for a quick daily check-in.",
    href: "#trivia",
    status: "Available now",
    cadence: "Daily",
  },
  {
    id: "daily-poll",
    title: "Daily Poll",
    detail: "Make one music choice and see the demonstration results.",
    href: "#daily-poll",
    status: "Available now",
    cadence: "Daily",
  },
  {
    id: "creator-spotlight",
    title: "Creator Spotlight",
    detail: "Meet a featured creator and continue into their VYBE world.",
    href: "#spotlight",
    status: "Demo",
    cadence: "Daily",
  },
  {
    id: "weekly-challenge",
    title: "Discovery Challenge",
    detail: "A low-cost weekly path through approved VYBE content.",
    href: "#spotlight",
    status: "Demo",
    cadence: "Weekly",
  },
] as const;

export const PLAY_RELEASE_CHECKS = [
  {
    label: "Knowledge traceability",
    detail: "Every factual experience must point to an approved knowledge asset.",
  },
  {
    label: "Rights and authorization",
    detail: "Audio, artwork, lyrics, video, and creator material require documented eligibility.",
  },
  {
    label: "Editorial review",
    detail: "Facts, answers, difficulty, cultural context, and disputes require human review.",
  },
  {
    label: "Access and safety",
    detail:
      "Visibility, age suitability, reporting, and moderation must be explicit before release.",
  },
] as const;

export const PLAY_ROADMAP_ITEMS = [
  {
    name: "Daily VYBE",
    stage: "Live foundation",
    note: "Trivia, poll, Spotlight, and discovery challenge presentation.",
  },
  {
    name: "Genre play",
    stage: "Pilot",
    note: "Mixed VYBE opens first; individual genres activate after approved content reaches depth.",
  },
  {
    name: "Knowledge Engine import",
    stage: "Architecture dependency",
    note: "Waits for the approved production record template and 50-asset pilot.",
  },
  {
    name: "Live multiplayer",
    stage: "Future",
    note: "Requires real-time rooms, fairness, moderation, rights, and prize rules.",
  },
] as const;
