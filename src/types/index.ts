import type { AppRole } from "@/features/auth/roles";

export type UserRole = AppRole;

export interface Track {
  id: string;
  title: string;
  creatorId: string;
  coverUrl?: string;
  audioUrl: string;
  durationSec: number;
}

export interface Video {
  id: string;
  title: string;
  creatorId: string;
  thumbnailUrl?: string;
  videoUrl: string;
}
