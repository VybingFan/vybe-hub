import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const AUDIO_BUCKET = "music-audio";
const COVER_BUCKET = "music-covers";
const PREVIEW_BUCKET = "music-previews";
const AVATAR_BUCKET = "avatars";
const SIGNED_URL_TTL_SECONDS = 60 * 3;

const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("authorize"),
    slug: z.string().trim().min(1).max(160),
    password: z.string().max(128).optional(),
  }),
  z.object({
    action: z.literal("set_password"),
    slug: z.string().trim().min(1).max(160),
    password: z.string().min(8).max(128),
  }),
  z.object({
    action: z.literal("clear_password"),
    slug: z.string().trim().min(1).max(160),
  }),
]);

const PASSWORD_ITERATIONS = 210_000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function passwordDigest(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS },
    key,
    256,
  );
  return bytesToBase64(new Uint8Array(bits));
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2-sha256$${PASSWORD_ITERATIONS}$${bytesToBase64(salt)}$${await passwordDigest(password, salt)}`;
}

async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [algorithm, iterations, encodedSalt, expected] = stored.split("$");
  if (
    algorithm !== "pbkdf2-sha256" ||
    Number(iterations) !== PASSWORD_ITERATIONS ||
    !encodedSalt ||
    !expected
  )
    return false;
  const actual = await passwordDigest(password, base64ToBytes(encodedSalt));
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

type AccessReason =
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

interface QueryError {
  message: string;
}

interface AuthenticatedUser {
  id: string;
  email?: string | null;
}

interface AdminClient {
  from: (table: string) => any;
  auth: {
    getUser: (token: string) => Promise<{
      data: { user: AuthenticatedUser | null };
      error: QueryError | null;
    }>;
  };
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (
        path: string,
        expiresIn: number,
      ) => Promise<{
        data: { signedUrl?: string } | null;
        error: QueryError | null;
      }>;
    };
  };
}

async function signedUrl(
  client: AdminClient,
  bucket: string,
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("Secure media signing failed", {
      bucket,
      path,
      message: error.message,
    });
    return null;
  }

  return data?.signedUrl ?? null;
}

function normalizedEmail(email: string | null | undefined): string | null {
  const value = email?.trim().toLowerCase();
  return value || null;
}

function denied(reason: AccessReason, accessMode: string | null, expiresAt: string | null) {
  return {
    authorized: false,
    reason,
    accessMode,
    expiresAt,
    playlist: null,
  };
}

async function logAccess(
  client: AdminClient,
  input: {
    playlistId?: string | null;
    listenerUserId?: string | null;
    accessMode?: string | null;
    outcome: "granted" | "denied";
    reason: AccessReason;
  },
) {
  const { error } = await client.from("media_access_events").insert({
    resource_type: "playlist",
    resource_id: input.playlistId ?? null,
    listener_user_id: input.listenerUserId ?? null,
    access_mode: input.accessMode ?? null,
    outcome: input.outcome,
    reason_code: input.reason,
  });

  if (error) {
    console.error("Could not record secure media access event", error.message);
  }
}

export const Route = createFileRoute("/api/secure-playlist")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = requestSchema.safeParse(await request.json().catch(() => null));

        if (!parsed.success) {
          return Response.json({ error: "Invalid protected-playlist request." }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const client = supabaseAdmin as unknown as AdminClient;

        const authorization = request.headers.get("authorization");
        const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

        let listener: AuthenticatedUser | null = null;

        if (token) {
          const current = await client.auth.getUser(token);
          if (!current.error) listener = current.data.user;
        }

        const { data: playlist, error: playlistError } = await client
          .from("playlists")
          .select("*")
          .eq("slug", parsed.data.slug)
          .eq("is_published", true)
          .maybeSingle();

        if (playlistError) {
          return Response.json({ error: playlistError.message }, { status: 500 });
        }

        if (!playlist) {
          await logAccess(client, {
            listenerUserId: listener?.id,
            outcome: "denied",
            reason: "RESOURCE_NOT_FOUND",
          });

          return Response.json({
            result: denied("RESOURCE_NOT_FOUND", null, null),
          });
        }

        if (parsed.data.action === "set_password" || parsed.data.action === "clear_password") {
          if (!listener || listener.id !== playlist.creator_id) {
            return Response.json(
              { error: "Only the playlist owner can manage its password." },
              { status: 403 },
            );
          }

          const accessPasswordHash =
            parsed.data.action === "set_password" ? await hashPassword(parsed.data.password) : null;
          const currentAccessMode = String(playlist.access_mode || "public");
          const { error: passwordError } = await client
            .from("playlists")
            .update({
              access_password_hash: accessPasswordHash,
              access_mode:
                parsed.data.action === "set_password"
                  ? "password"
                  : currentAccessMode === "password"
                    ? "unlisted"
                    : currentAccessMode,
            })
            .eq("id", playlist.id)
            .eq("creator_id", listener.id);

          if (passwordError) {
            return Response.json({ error: passwordError.message }, { status: 500 });
          }

          return Response.json({ result: { success: true } });
        }

        const accessMode = String(playlist.access_mode || "public");
        const expiresAt = (playlist.access_expires_at as string | null) ?? null;

        if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
          await logAccess(client, {
            playlistId: playlist.id,
            listenerUserId: listener?.id,
            accessMode,
            outcome: "denied",
            reason: "PLAYLIST_EXPIRED",
          });

          return Response.json({
            result: denied("PLAYLIST_EXPIRED", accessMode, expiresAt),
          });
        }

        if (playlist.require_sign_in && !listener) {
          await logAccess(client, {
            playlistId: playlist.id,
            accessMode,
            outcome: "denied",
            reason: "NOT_SIGNED_IN",
          });

          return Response.json({
            result: denied("NOT_SIGNED_IN", accessMode, expiresAt),
          });
        }

        if (
          accessMode === "password" &&
          !(await verifyPassword(parsed.data.password ?? "", playlist.access_password_hash))
        ) {
          await logAccess(client, {
            playlistId: playlist.id,
            listenerUserId: listener?.id,
            accessMode,
            outcome: "denied",
            reason: "PASSWORD_REQUIRED",
          });

          return Response.json({
            result: denied("PASSWORD_REQUIRED", accessMode, expiresAt),
          });
        }

        if (accessMode === "membership_only") {
          await logAccess(client, {
            playlistId: playlist.id,
            listenerUserId: listener?.id,
            accessMode,
            outcome: "denied",
            reason: "MEMBERSHIP_REQUIRED",
          });

          return Response.json({
            result: denied("MEMBERSHIP_REQUIRED", accessMode, expiresAt),
          });
        }

        if (accessMode === "approved_listeners") {
          if (!listener) {
            await logAccess(client, {
              playlistId: playlist.id,
              accessMode,
              outcome: "denied",
              reason: "NOT_SIGNED_IN",
            });

            return Response.json({
              result: denied("NOT_SIGNED_IN", accessMode, expiresAt),
            });
          }

          const email = normalizedEmail(listener.email);

          if (!email) {
            await logAccess(client, {
              playlistId: playlist.id,
              listenerUserId: listener.id,
              accessMode,
              outcome: "denied",
              reason: "ACCESS_DENIED",
            });

            return Response.json({
              result: denied("ACCESS_DENIED", accessMode, expiresAt),
            });
          }

          const { data: grant, error: grantError } = await client
            .from("playlist_access_grants")
            .select("*")
            .eq("playlist_id", playlist.id)
            .eq("email_normalized", email)
            .maybeSingle();

          if (grantError) {
            return Response.json({ error: grantError.message }, { status: 500 });
          }

          if (!grant) {
            await logAccess(client, {
              playlistId: playlist.id,
              listenerUserId: listener.id,
              accessMode,
              outcome: "denied",
              reason: "ACCESS_DENIED",
            });

            return Response.json({
              result: denied("ACCESS_DENIED", accessMode, expiresAt),
            });
          }

          if (grant.revoked_at) {
            await logAccess(client, {
              playlistId: playlist.id,
              listenerUserId: listener.id,
              accessMode,
              outcome: "denied",
              reason: "INVITATION_REVOKED",
            });

            return Response.json({
              result: denied("INVITATION_REVOKED", accessMode, expiresAt),
            });
          }

          if (grant.expires_at && new Date(grant.expires_at).getTime() <= Date.now()) {
            await logAccess(client, {
              playlistId: playlist.id,
              listenerUserId: listener.id,
              accessMode,
              outcome: "denied",
              reason: "PLAYLIST_EXPIRED",
            });

            return Response.json({
              result: denied("PLAYLIST_EXPIRED", accessMode, expiresAt),
            });
          }

          if (grant.max_plays !== null && grant.play_count >= grant.max_plays) {
            await logAccess(client, {
              playlistId: playlist.id,
              listenerUserId: listener.id,
              accessMode,
              outcome: "denied",
              reason: "PLAY_LIMIT_REACHED",
            });

            return Response.json({
              result: denied("PLAY_LIMIT_REACHED", accessMode, expiresAt),
            });
          }
        } else if (
          accessMode !== "public" &&
          accessMode !== "unlisted" &&
          accessMode !== "password"
        ) {
          return Response.json({
            result: denied("UNSUPPORTED_ACCESS_MODE", accessMode, expiresAt),
          });
        }

        const [{ data: creator }, { data: items, error: itemsError }] = await Promise.all([
          client
            .from("creator_profiles")
            .select(
              "artist_name, display_name, username, avatar_path, cover_path, avatar_url, cover_url",
            )
            .eq("user_id", playlist.creator_id)
            .maybeSingle(),
          client
            .from("playlist_tracks")
            .select("position, tracks(*)")
            .eq("playlist_id", playlist.id)
            .order("position"),
        ]);

        if (itemsError) {
          return Response.json({ error: itemsError.message }, { status: 500 });
        }

        const rawTracks = (items ?? []).flatMap((item: any) => (item.tracks ? [item.tracks] : []));

        const tracks = await Promise.all(
          rawTracks
            .filter((track: any) => {
              if (accessMode === "public" || accessMode === "unlisted") {
                return track.visibility === "public" && track.status === "published";
              }

              return track.status === "published";
            })
            .map(async (track: any) => {
              let playableUrl = "";

              if (track.playback_mode === "preview") {
                playableUrl =
                  (await signedUrl(client, PREVIEW_BUCKET, track.preview_audio_path)) ?? "";
              } else if (track.playback_mode === "none") {
                playableUrl = "";
              } else if (
                track.playback_mode === "approved_listeners" &&
                accessMode !== "approved_listeners"
              ) {
                playableUrl = "";
              } else {
                playableUrl = (await signedUrl(client, AUDIO_BUCKET, track.audio_url)) ?? "";
              }

              return {
                ...track,
                audio_url: playableUrl,
                cover_url: await signedUrl(client, COVER_BUCKET, track.cover_url),
              };
            }),
        );

        const hydratedPlaylist = {
          ...playlist,
          cover_url: await signedUrl(client, COVER_BUCKET, playlist.cover_path),
          artistName: creator?.artist_name || creator?.display_name || "VYBE Artist",
          artistUsername: creator?.username || null,
          artistAvatarUrl:
            (await signedUrl(client, AVATAR_BUCKET, creator?.avatar_path)) ||
            creator?.avatar_url ||
            null,
          artistBannerUrl:
            (await signedUrl(client, AVATAR_BUCKET, creator?.cover_path)) ||
            creator?.cover_url ||
            null,
          tracks,
        };

        await logAccess(client, {
          playlistId: playlist.id,
          listenerUserId: listener?.id,
          accessMode,
          outcome: "granted",
          reason: "AUTHORIZED",
        });

        return Response.json({
          result: {
            authorized: true,
            reason: "AUTHORIZED",
            accessMode,
            expiresAt,
            playlist: hydratedPlaylist,
          },
        });
      },
    },
  },
});
