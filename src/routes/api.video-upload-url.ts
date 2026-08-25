import { createFileRoute } from "@tanstack/react-router";

const PLAN_UPLOAD_LIMITS: Record<string, { videos: number; maxDurationSeconds: number }> = {
  creator_free: { videos: 1, maxDurationSeconds: 0 },
  creator_plus: { videos: 10, maxDurationSeconds: 600 },
  creator_pro: { videos: 50, maxDurationSeconds: 1200 },
  creator_studio: { videos: 200, maxDurationSeconds: 1800 },
  founding_beta: { videos: 50, maxDurationSeconds: 1200 },
};

function normalizePlaybackOrigin(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const parsed = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    const isLocal =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "[::1]";

    return isLocal ? parsed.host : parsed.hostname;
  } catch {
    return trimmed.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  }
}

function playbackOrigins(request: Request) {
  const configured = (process.env.CLOUDFLARE_STREAM_ALLOWED_ORIGINS || "")
    .split(",")
    .map(normalizePlaybackOrigin)
    .filter(Boolean);

  const defaults = ["vybewithvybe.com", "www.vybewithvybe.com"];

  const requestOrigin = request.headers.get("origin");
  let requestHost = "";
  try {
    const parsed = requestOrigin ? new URL(requestOrigin) : null;
    if (parsed) {
      const isLocal =
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "[::1]";
      requestHost = isLocal ? parsed.host : parsed.hostname;
    }
  } catch {}

  return Array.from(
    new Set(
      [...configured, ...defaults, requestHost]
        .map(normalizePlaybackOrigin)
        .filter(Boolean),
    ),
  );
}

async function requireCreator(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return { error: Response.json({ error: "Sign in to manage video playback." }, { status: 401 }) };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const token = authorization.slice("Bearer ".length);
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData.user) {
    return { error: Response.json({ error: "Your session has expired. Sign in again." }, { status: 401 }) };
  }

  const { data: role } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .in("role", ["creator", "admin"])
    .limit(1)
    .maybeSingle();

  if (!role) {
    return { error: Response.json({ error: "Creator access is required." }, { status: 403 }) };
  }

  return { userId: authData.user.id, supabaseAdmin };
}

export const Route = createFileRoute("/api/video-upload-url")({
  server: {
    handlers: {
      PATCH: async ({ request }) => {
        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN;
        if (!accountId || !apiToken) {
          return Response.json({ error: "Cloudflare Stream is not configured." }, { status: 503 });
        }

        const auth = await requireCreator(request);
        if ("error" in auth) return auth.error;

        const { userId, supabaseAdmin } = auth;
        const { data: videos, error: videosError } = await supabaseAdmin
          .from("creator_videos")
          .select("id,provider,provider_video_id")
          .eq("creator_id", userId)
          .eq("provider", "cloudflare_stream");

        if (videosError) {
          return Response.json({ error: videosError.message }, { status: 500 });
        }

        const allowedOrigins = playbackOrigins(request);
        const failures: Array<{ id: string; message: string }> = [];
        let repaired = 0;

        for (const video of videos || []) {
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${encodeURIComponent(video.provider_video_id)}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ allowedOrigins }),
            },
          );
          const result = (await response.json().catch(() => ({}))) as {
            success?: boolean;
            errors?: Array<{ message?: string }>;
          };
          if (response.ok && result.success !== false) repaired += 1;
          else failures.push({
            id: video.id,
            message: result.errors?.[0]?.message || `Cloudflare returned ${response.status}`,
          });
        }

        return Response.json({
          repaired,
          total: videos?.length || 0,
          allowedOrigins,
          failures,
        }, { status: failures.length ? 207 : 200 });
      },

      POST: async ({ request }) => {
        const authorization = request.headers.get("authorization");
        if (!authorization?.startsWith("Bearer ")) {
          return Response.json({ error: "Sign in to upload a video." }, { status: 401 });
        }

        const input = (await request.json().catch(() => ({}))) as { fileName?: string; fileSize?: number };
        if (!input.fileName || !Number.isFinite(input.fileSize) || Number(input.fileSize) <= 0) {
          return Response.json({ error: "Choose a valid video file." }, { status: 400 });
        }
        if (Number(input.fileSize) > 200 * 1024 * 1024) {
          return Response.json({ error: "This direct uploader currently accepts files up to 200MB." }, { status: 413 });
        }

        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN;
        if (!accountId || !apiToken) {
          return Response.json(
            {
              error:
                "Native video uploads are waiting for Cloudflare Stream setup. Add the Stream account ID and API token to activate this button.",
              code: "STREAM_NOT_CONFIGURED",
            },
            { status: 503 },
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const token = authorization.slice("Bearer ".length);
        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !authData.user) {
          return Response.json(
            { error: "Your session has expired. Sign in again." },
            { status: 401 },
          );
        }

        const userId = authData.user.id;
        const [{ data: role }, { data: entitlement }, { count: videoCount }] = await Promise.all([
          supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .in("role", ["creator", "admin"])
            .limit(1)
            .maybeSingle(),
          supabaseAdmin
            .from("account_entitlements")
            .select("plan_code")
            .eq("user_id", userId)
            .eq("status", "active")
            .limit(1)
            .maybeSingle(),
          supabaseAdmin
            .from("creator_videos")
            .select("id", { count: "exact", head: true })
            .eq("creator_id", userId),
        ]);

        if (!role) {
          return Response.json({ error: "Creator access is required." }, { status: 403 });
        }

        const planCode = entitlement?.plan_code || "creator_free";
        const limits = PLAN_UPLOAD_LIMITS[planCode] || PLAN_UPLOAD_LIMITS.creator_free;
        if (!limits.maxDurationSeconds) {
          return Response.json(
            { error: "Native uploads require Creator Plus or higher." },
            { status: 403 },
          );
        }
        if ((videoCount || 0) >= limits.videos) {
          return Response.json(
            { error: "Your membership video limit has been reached." },
            { status: 403 },
          );
        }

        const cloudflareResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              maxDurationSeconds: limits.maxDurationSeconds,
              expiry: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
              creator: userId,
              meta: { creatorId: userId, originalFileName: input.fileName.slice(0, 200) },
              allowedOrigins: playbackOrigins(request),
              requireSignedURLs: false,
            }),
          },
        );
        const cloudflare = (await cloudflareResponse.json()) as {
          success?: boolean;
          result?: { uploadURL?: string; uid?: string };
          errors?: Array<{ message?: string }>;
        };

        if (!cloudflareResponse.ok || !cloudflare.success || !cloudflare.result?.uploadURL) {
          return Response.json(
            {
              error:
                cloudflare.errors?.[0]?.message || "Cloudflare could not prepare the video upload.",
            },
            { status: 502 },
          );
        }

        return Response.json({
          uploadURL: cloudflare.result.uploadURL,
          uid: cloudflare.result.uid,
          maxDurationSeconds: limits.maxDurationSeconds,
        });
      },
    },
  },
});
