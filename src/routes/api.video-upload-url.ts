import { createFileRoute } from "@tanstack/react-router";

const PLAN_UPLOAD_LIMITS: Record<string, { videos: number; maxDurationSeconds: number }> = {
  creator_free: { videos: 1, maxDurationSeconds: 0 },
  creator_plus: { videos: 10, maxDurationSeconds: 600 },
  creator_pro: { videos: 50, maxDurationSeconds: 1200 },
  creator_studio: { videos: 200, maxDurationSeconds: 1800 },
  founding_beta: { videos: 50, maxDurationSeconds: 1200 },
};

export const Route = createFileRoute("/api/video-upload-url")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorization = request.headers.get("authorization");
        if (!authorization?.startsWith("Bearer ")) {
          return Response.json({ error: "Sign in to upload a video." }, { status: 401 });
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
            body: JSON.stringify({ maxDurationSeconds: limits.maxDurationSeconds }),
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
