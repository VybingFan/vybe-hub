import { supabase } from "@/integrations/supabase/client";
import type { Track } from "@/features/music/schema";
import type { SharedPlaylist } from "@/features/playlists/schema";

export type MediaAccessReason =
  | "AUTHORIZED"
  | "NOT_SIGNED_IN"
  | "PASSWORD_REQUIRED"
  | "ACCESS_DENIED"
  | "PLAYLIST_EXPIRED"
  | "INVITATION_REVOKED"
  | "PLAY_LIMIT_REACHED"
  | "MEMBERSHIP_REQUIRED"
  | "RESOURCE_NOT_FOUND"
  | "UNSUPPORTED_ACCESS_MODE";

export interface PlaylistAuthorizationResult {
  authorized: boolean;
  reason: MediaAccessReason;
  accessMode: string | null;
  expiresAt: string | null;
  playlist: SharedPlaylist | null;
}

interface SecurePlaylistApiResponse {
  result?: unknown;
  error?: string;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : {
        "Content-Type": "application/json",
      };
}

async function readJson(response: Response): Promise<SecurePlaylistApiResponse> {
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Secure media API returned ${response.status} instead of JSON. Response began with: ${body
        .slice(0, 120)
        .replace(/\s+/g, " ")
        .trim()}`,
    );
  }

  const parsed = JSON.parse(body) as SecurePlaylistApiResponse;

  if (!response.ok) {
    throw new Error(parsed.error || "Protected media authorization failed.");
  }

  return parsed;
}

export const secureMediaService = {
  async authorizePlaylist(slug: string, password?: string, trackId?: string): Promise<PlaylistAuthorizationResult> {
    const response = await fetch("/api/secure-playlist", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({
        action: "authorize",
        slug,
        password: password || undefined,
        trackId: trackId || undefined,
      }),
    });

    const payload = await readJson(response);

    if (!payload.result) {
      throw new Error("The secure media API did not return an authorization result.");
    }

    return payload.result as PlaylistAuthorizationResult;
  },

  async playbackUrl(slug: string, track: Track, password?: string): Promise<string> {
    const result = await this.authorizePlaylist(slug, password, track.id);

    if (!result.authorized || !result.playlist) {
      return "";
    }

    const resolvedTrack = result.playlist.tracks.find((item) => item.id === track.id);
    return resolvedTrack?.audio_url || "";
  },

  async setPlaylistPassword(slug: string, password: string): Promise<void> {
    const response = await fetch("/api/secure-playlist", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ action: "set_password", slug, password }),
    });

    await readJson(response);
  },

  async clearPlaylistPassword(slug: string): Promise<void> {
    const response = await fetch("/api/secure-playlist", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ action: "clear_password", slug }),
    });

    await readJson(response);
  },
};
