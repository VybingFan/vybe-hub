import { supabase } from "@/integrations/supabase/client";
import type { PlayGenre } from "@/features/play/content";

export const PLAY_PACK_VERSION = "mixed-vybe-pilot-v1";
const STORAGE_KEY = `vybe:play-progress:${PLAY_PACK_VERSION}`;

export type OfflinePlayProgress = {
  packVersion: typeof PLAY_PACK_VERSION;
  playGenre: PlayGenre;
  questionIndex: number;
  score: number;
  selected: number | null;
  finished: boolean;
  vibes: number[];
  poll: string | null;
  surpriseTitle: string | null;
  updatedAt: string;
};

export const EMPTY_PLAY_PROGRESS: OfflinePlayProgress = {
  packVersion: PLAY_PACK_VERSION,
  playGenre: "Mixed VYBE",
  questionIndex: 0,
  score: 0,
  selected: null,
  finished: false,
  vibes: [],
  poll: null,
  surpriseTitle: null,
  updatedAt: new Date(0).toISOString(),
};

export function loadOfflinePlayProgress(): OfflinePlayProgress {
  if (typeof window === "undefined") return EMPTY_PLAY_PROGRESS;
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!stored || stored.packVersion !== PLAY_PACK_VERSION) return EMPTY_PLAY_PROGRESS;
    return {
      ...EMPTY_PLAY_PROGRESS,
      ...stored,
      questionIndex: Math.max(0, Math.min(2, Number(stored.questionIndex) || 0)),
      score: Math.max(0, Math.min(3, Number(stored.score) || 0)),
      selected: typeof stored.selected === "number" ? stored.selected : null,
      vibes: Array.isArray(stored.vibes)
        ? stored.vibes.filter((value: unknown) => Number.isInteger(value)).slice(0, 3)
        : [],
    };
  } catch {
    return EMPTY_PLAY_PROGRESS;
  }
}

export function saveOfflinePlayProgress(
  progress: Omit<OfflinePlayProgress, "packVersion" | "updatedAt">,
): OfflinePlayProgress {
  const saved: OfflinePlayProgress = {
    ...progress,
    packVersion: PLAY_PACK_VERSION,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Keep Play usable when private browsing or device policy blocks local storage.
  }
  return saved;
}

export async function syncOfflinePlayProgress(progress: OfflinePlayProgress) {
  if (!navigator.onLine) return "pending" as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "local" as const;

  // Generated Supabase types are refreshed after this migration reaches the remote project.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("play_activity_progress").upsert(
    {
      user_id: user.id,
      pack_version: PLAY_PACK_VERSION,
      activity_key: "daily-play",
      progress,
      verification_status: "casual_unverified",
      client_updated_at: progress.updatedAt,
      synced_at: new Date().toISOString(),
    },
    { onConflict: "user_id,pack_version,activity_key" },
  );
  if (error) throw error;
  return "synced" as const;
}
