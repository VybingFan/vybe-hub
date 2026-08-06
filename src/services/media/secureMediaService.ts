import { supabase } from "@/integrations/supabase/client";
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
  result?: PlaylistAuthorizationResult;
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
  async authorizePlaylist(slug: string): Promise<PlaylistAuthorizationResult> {
    const response = await fetch("/api/secure-playlist", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({
        action: "authorize",
        slug,
      }),
    });

    const payload = await readJson(response);

    if (!payload.result) {
      throw new Error("The secure media API did not return an authorization result.");
    }

    return payload.result;
  },
};