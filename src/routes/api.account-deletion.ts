import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("preview"), userId: z.string().uuid() }),
  z.object({
    action: z.literal("execute"),
    userId: z.string().uuid(),
    emailConfirmation: z.string().email(),
  }),
]);

const TABLE_MAP = [
  ["tracks", "creator_id"],
  ["albums", "creator_id"],
  ["playlists", "creator_id"],
  ["track_likes", "user_id"],
  ["follows", "follower_id"],
  ["creator_profiles", "user_id"],
  ["supporter_profiles", "user_id"],
  ["business_profiles", "user_id"],
  ["profiles", "id"],
  ["user_roles", "user_id"],
  ["account_entitlements", "user_id"],
  ["merch_products", "creator_id"],
  ["creator_rights_documents", "creator_id"],
  ["audio_processing_jobs", "creator_id"],
  ["audio_fingerprints", "creator_id"],
] as const;

const BUCKETS = [
  "avatars",
  "music-audio",
  "music-covers",
  "creator-epk-assets",
  "creator-audio-masters",
  "creator-rights-documents",
] as const;

type AdminClient = {
  from: (table: string) => any;
  rpc: (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: any }>;
  auth: {
    getUser: (token: string) => Promise<any>;
    admin: { getUserById: (id: string) => Promise<any>; deleteUser: (id: string) => Promise<any> };
  };
  storage: { from: (bucket: string) => any };
};

async function listFolder(client: AdminClient, bucket: string, userId: string) {
  const result = await client.storage.from(bucket).list(userId, { limit: 1000 });
  if (result.error) return [];
  return (result.data || []).map((item: any) => `${userId}/${item.name}`);
}

export const Route = createFileRoute("/api/account-deletion")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorization = request.headers.get("authorization");
        if (!authorization?.startsWith("Bearer ")) {
          return Response.json({ error: "Sign in is required." }, { status: 401 });
        }

        const parsed = requestSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const client = supabaseAdmin as unknown as AdminClient;
        const token = authorization.slice(7);
        const current = await client.auth.getUser(token);
        if (current.error || !current.data?.user) {
          return Response.json({ error: "Session expired." }, { status: 401 });
        }

        const permission = await client.rpc("has_admin_permission", {
          _user_id: current.data.user.id,
          _permission: parsed.data.action === "preview" ? "admin.accounts.read" : "admin.accounts.delete",
        });
        if (permission.error || permission.data !== true) {
          return Response.json({ error: "Required administrator permission is missing." }, { status: 403 });
        }

        const target = await client.auth.admin.getUserById(parsed.data.userId);
        if (target.error || !target.data?.user) {
          return Response.json({ error: "Account not found." }, { status: 404 });
        }

        const targetUser = target.data.user;
        const tableCounts: Record<string, number> = {};
        for (const [table, column] of TABLE_MAP) {
          const result = await client.from(table).select("*", { count: "exact", head: true }).eq(column, parsed.data.userId);
          tableCounts[table] = result.count || 0;
        }

        const storageCounts: Record<string, number> = {};
        const storagePaths: Record<string, string[]> = {};
        for (const bucket of BUCKETS) {
          const paths = await listFolder(client, bucket, parsed.data.userId);
          storagePaths[bucket] = paths;
          storageCounts[bucket] = paths.length;
        }

        const rolesResult = await client.from("user_roles").select("role").eq("user_id", parsed.data.userId);
        const roles = (rolesResult.data || []).map((row: any) => row.role);
        const isCurrentUser = parsed.data.userId === current.data.user.id;
        const isProtected = isCurrentUser || roles.includes("admin");
        const blockedReason = isCurrentUser
          ? "You cannot delete the administrator account currently performing this action."
          : roles.includes("admin")
            ? "Administrator accounts are protected. Remove administrative access through Administrator Team first."
            : null;

        const profile = await client.from("profiles").select("display_name,email").eq("id", parsed.data.userId).maybeSingle();

        const preview = {
          userId: parsed.data.userId,
          email: targetUser.email || profile.data?.email || null,
          displayName: profile.data?.display_name || null,
          roles,
          protected: isProtected,
          blockedReason,
          tableCounts,
          storageCounts,
          totalObjects: Object.values(storageCounts).reduce((a, b) => a + b, 0),
        };

        if (parsed.data.action === "preview") {
          return Response.json({ preview });
        }

        if (preview.blockedReason) {
          return Response.json({ error: preview.blockedReason }, { status: 409 });
        }
        if (parsed.data.emailConfirmation.toLowerCase() !== (preview.email || "").toLowerCase()) {
          return Response.json({ error: "Email confirmation does not match." }, { status: 400 });
        }

        if (process.env.ALLOW_ACCOUNT_DELETION !== "true") {
          return Response.json({ status: "execution_disabled", preview });
        }

        for (const bucket of BUCKETS) {
          const paths = storagePaths[bucket];
          if (paths.length) {
            const removed = await client.storage.from(bucket).remove(paths);
            if (removed.error) throw new Error(`Storage cleanup failed in ${bucket}: ${removed.error.message}`);
          }
        }

        for (const [table, column] of TABLE_MAP) {
          if (table === "profiles" || table === "user_roles") continue;
          const result = await client.from(table).delete().eq(column, parsed.data.userId);
          if (result.error) throw new Error(`Database cleanup failed in ${table}: ${result.error.message}`);
        }

        await client.from("user_roles").delete().eq("user_id", parsed.data.userId);
        await client.from("profiles").delete().eq("id", parsed.data.userId);

        const authDelete = await client.auth.admin.deleteUser(parsed.data.userId);
        if (authDelete.error) throw new Error(`Auth deletion failed: ${authDelete.error.message}`);

        await client.from("account_deletion_audit").insert({
          target_user_id: parsed.data.userId,
          performed_by: current.data.user.id,
          request_type: "administrator",
          action: "permanent_delete",
          outcome: "success",
          summary: { tableCounts, storageCounts },
        });

        return Response.json({ status: "completed" });
      },
    },
  },
});
