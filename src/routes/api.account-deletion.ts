import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("preview"),
    userId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("execute"),
    userId: z.string().uuid(),
    emailConfirmation: z.string().trim().email(),
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
  ["business_profiles", "owner_user_id"],
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

interface QueryError {
  message: string;
  code?: string;
}

interface QueryResult<T = unknown> {
  data: T | null;
  error: QueryError | null;
  count?: number | null;
}

interface AdminClient {
  from: (table: string) => {
    select: (
      columns?: string,
      options?: {
        count?: "exact";
        head?: boolean;
      },
    ) => {
      eq: (
        column: string,
        value: string,
      ) => Promise<QueryResult<unknown[]>> & {
        maybeSingle: () => Promise<QueryResult<Record<string, unknown>>>;
      };
    };
    delete: () => {
      eq: (
        column: string,
        value: string,
      ) => Promise<QueryResult>;
    };
    insert: (
      values: Record<string, unknown>,
    ) => Promise<QueryResult>;
  };

  rpc: (
    name: string,
    args?: Record<string, unknown>,
  ) => Promise<QueryResult>;

  auth: {
    getUser: (token: string) => Promise<{
      data: {
        user: {
          id: string;
          email?: string | null;
        } | null;
      };
      error: QueryError | null;
    }>;

    admin: {
      getUserById: (id: string) => Promise<{
        data: {
          user: {
            id: string;
            email?: string | null;
          } | null;
        };
        error: QueryError | null;
      }>;

      deleteUser: (id: string) => Promise<{
        data: unknown;
        error: QueryError | null;
      }>;
    };
  };

  storage: {
    from: (bucket: string) => {
      list: (
        path: string,
        options?: {
          limit?: number;
          offset?: number;
        },
      ) => Promise<{
        data:
          | Array<{
              name: string;
              id?: string | null;
              metadata?: Record<string, unknown> | null;
            }>
          | null;
        error: QueryError | null;
      }>;

      remove: (
        paths: string[],
      ) => Promise<{
        data: unknown;
        error: QueryError | null;
      }>;
    };
  };
}

function jsonError(
  message: string,
  status = 500,
  details?: Record<string, unknown>,
) {
  return Response.json(
    {
      error: message,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "An unexpected server error occurred.";
}

async function countOwnedRows(
  client: AdminClient,
  table: string,
  column: string,
  userId: string,
) {
  const result = await client
    .from(table)
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq(column, userId);

  if (result.error) {
    /*
     * During preview, a missing or renamed table should be reported
     * rather than crashing the complete API response.
     */
    return {
      count: 0,
      warning: result.error.message,
    };
  }

  return {
    count: result.count ?? 0,
    warning: null,
  };
}

async function listUserFolder(
  client: AdminClient,
  bucket: string,
  userId: string,
) {
  const result = await client.storage.from(bucket).list(userId, {
    limit: 1000,
    offset: 0,
  });

  if (result.error) {
    return {
      paths: [] as string[],
      warning: result.error.message,
    };
  }

  const paths = (result.data ?? [])
    .filter((item) => item.name && item.name !== ".emptyFolderPlaceholder")
    .map((item) => `${userId}/${item.name}`);

  return {
    paths,
    warning: null,
  };
}

export const Route = createFileRoute("/api/account-deletion")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authorization =
            request.headers.get("authorization");

          if (!authorization?.startsWith("Bearer ")) {
            return jsonError(
              "Sign in is required.",
              401,
            );
          }

          const requestBody = await request
            .json()
            .catch(() => null);

          const parsed =
            requestSchema.safeParse(requestBody);

          if (!parsed.success) {
            return jsonError(
              parsed.error.issues[0]?.message ||
                "Invalid account-deletion request.",
              400,
            );
          }

          /*
           * This import requires the local server environment to have
           * the Supabase URL and service-role key configured.
           */
          let supabaseAdmin: unknown;

          try {
            const serverModule = await import(
              "@/integrations/supabase/client.server"
            );

            supabaseAdmin =
              serverModule.supabaseAdmin;
          } catch (error) {
            return jsonError(
              "The server Supabase client could not be initialized.",
              500,
              {
                cause: errorMessage(error),
                requiredEnvironment:
                  "SUPABASE_SERVICE_ROLE_KEY and the server Supabase URL",
              },
            );
          }

          if (!supabaseAdmin) {
            return jsonError(
              "The server Supabase client is unavailable.",
              500,
            );
          }

          const client =
            supabaseAdmin as AdminClient;

          const token =
            authorization.slice(
              "Bearer ".length,
            );

          const current =
            await client.auth.getUser(token);

          if (
            current.error ||
            !current.data.user
          ) {
            return jsonError(
              current.error?.message ||
                "Your session has expired. Sign in again.",
              401,
            );
          }

          const actor =
            current.data.user;

          const requiredPermission =
            parsed.data.action === "preview"
              ? "admin.accounts.read"
              : "admin.accounts.delete";

          const permission =
            await client.rpc(
              "has_admin_permission",
              {
                _user_id: actor.id,
                _permission:
                  requiredPermission,
              },
            );

          if (permission.error) {
            return jsonError(
              `Permission verification failed: ${permission.error.message}`,
              500,
            );
          }

          if (permission.data !== true) {
            return jsonError(
              `The ${requiredPermission} permission is required.`,
              403,
            );
          }

          const target =
            await client.auth.admin.getUserById(
              parsed.data.userId,
            );

          if (
            target.error ||
            !target.data.user
          ) {
            return jsonError(
              target.error?.message ||
                "The selected account was not found.",
              404,
            );
          }

          const targetUser =
            target.data.user;

          const tableCounts: Record<
            string,
            number
          > = {};

          const tableWarnings: Record<
            string,
            string
          > = {};

          for (const [
            table,
            column,
          ] of TABLE_MAP) {
            const result =
              await countOwnedRows(
                client,
                table,
                column,
                parsed.data.userId,
              );

            tableCounts[table] =
              result.count;

            if (result.warning) {
              tableWarnings[table] =
                result.warning;
            }
          }

          const storageCounts: Record<
            string,
            number
          > = {};

          const storagePaths: Record<
            string,
            string[]
          > = {};

          const storageWarnings: Record<
            string,
            string
          > = {};

          for (const bucket of BUCKETS) {
            const result =
              await listUserFolder(
                client,
                bucket,
                parsed.data.userId,
              );

            storagePaths[bucket] =
              result.paths;

            storageCounts[bucket] =
              result.paths.length;

            if (result.warning) {
              storageWarnings[bucket] =
                result.warning;
            }
          }

          const rolesResult =
            await client
              .from("user_roles")
              .select("role")
              .eq(
                "user_id",
                parsed.data.userId,
              );

          if (rolesResult.error) {
            return jsonError(
              `Could not inspect account roles: ${rolesResult.error.message}`,
              500,
            );
          }

          const roles = Array.isArray(
            rolesResult.data,
          )
            ? rolesResult.data
                .map((row) => {
                  if (
                    typeof row === "object" &&
                    row !== null &&
                    "role" in row &&
                    typeof row.role ===
                      "string"
                  ) {
                    return row.role;
                  }

                  return null;
                })
                .filter(
                  (
                    role,
                  ): role is string =>
                    role !== null,
                )
            : [];

          const isCurrentUser =
            parsed.data.userId ===
            actor.id;

          const isAdministrator =
            roles.includes("admin");

          const blockedReason =
            isCurrentUser
              ? "You cannot delete the administrator account currently performing this action."
              : isAdministrator
                ? "Administrator accounts are protected. Remove administrative access through Administrator Team first."
                : null;

          /*
           * Email belongs to auth.users. The profiles query therefore
           * requests only display_name, avoiding a failure if profiles
           * has no email column.
           */
          const profileResult =
            await client
              .from("profiles")
              .select("display_name")
              .eq(
                "id",
                parsed.data.userId,
              )
              .maybeSingle();

          const displayName =
            profileResult.data &&
            typeof profileResult.data ===
              "object" &&
            "display_name" in
              profileResult.data &&
            typeof profileResult.data
              .display_name === "string"
              ? profileResult.data
                  .display_name
              : null;

          const preview = {
            userId:
              parsed.data.userId,

            email:
              targetUser.email ?? null,

            displayName,

            roles,

            protected:
              Boolean(blockedReason),

            blockedReason,

            tableCounts,

            storageCounts,

            totalObjects:
              Object.values(
                storageCounts,
              ).reduce(
                (total, count) =>
                  total + count,
                0,
              ),

            warnings: {
              tables: tableWarnings,
              storage:
                storageWarnings,
              profile:
                profileResult.error
                  ?.message ?? null,
            },
          };

          if (
            parsed.data.action ===
            "preview"
          ) {
            return Response.json({
              preview,
            });
          }

          if (blockedReason) {
            return jsonError(
              blockedReason,
              409,
            );
          }

          const accountEmail =
            preview.email?.trim().toLowerCase() ??
            "";

          const confirmedEmail =
            parsed.data.emailConfirmation
              .trim()
              .toLowerCase();

          if (
            !accountEmail ||
            confirmedEmail !== accountEmail
          ) {
            return jsonError(
              "Email confirmation does not match the selected account.",
              400,
            );
          }

          /*
           * Permanent deletion remains disabled for the initial
           * localhost testing stage.
           */
          if (
            process.env
              .ALLOW_ACCOUNT_DELETION !==
            "true"
          ) {
            return Response.json({
              status:
                "execution_disabled",
              preview,
            });
          }

          /*
           * Do not execute when preview discovered unresolved schema
           * or Storage warnings.
           */
          if (
            Object.keys(tableWarnings)
              .length > 0 ||
            Object.keys(storageWarnings)
              .length > 0
          ) {
            return jsonError(
              "Permanent deletion is blocked because the preview found unresolved database or Storage warnings.",
              409,
              {
                tableWarnings,
                storageWarnings,
              },
            );
          }

          /*
           * Delete Storage objects first.
           */
          for (const bucket of BUCKETS) {
            const paths =
              storagePaths[bucket];

            if (!paths.length) {
              continue;
            }

            const removed =
              await client.storage
                .from(bucket)
                .remove(paths);

            if (removed.error) {
              throw new Error(
                `Storage cleanup failed in ${bucket}: ${removed.error.message}`,
              );
            }
          }

          /*
           * Delete known dependent records next.
           * Profiles and roles are left until the end.
           */
          for (const [
            table,
            column,
          ] of TABLE_MAP) {
            if (
              table === "profiles" ||
              table === "user_roles"
            ) {
              continue;
            }

            const result =
              await client
                .from(table)
                .delete()
                .eq(
                  column,
                  parsed.data.userId,
                );

            if (result.error) {
              throw new Error(
                `Database cleanup failed in ${table}: ${result.error.message}`,
              );
            }
          }

          const roleDelete =
            await client
              .from("user_roles")
              .delete()
              .eq(
                "user_id",
                parsed.data.userId,
              );

          if (roleDelete.error) {
            throw new Error(
              `Role cleanup failed: ${roleDelete.error.message}`,
            );
          }

          const profileDelete =
            await client
              .from("profiles")
              .delete()
              .eq(
                "id",
                parsed.data.userId,
              );

          if (profileDelete.error) {
            throw new Error(
              `Profile cleanup failed: ${profileDelete.error.message}`,
            );
          }

          /*
           * Supabase Authentication is deleted last.
           */
          const authDelete =
            await client.auth.admin.deleteUser(
              parsed.data.userId,
            );

          if (authDelete.error) {
            throw new Error(
              `Authentication deletion failed: ${authDelete.error.message}`,
            );
          }

          const auditResult =
            await client
              .from(
                "account_deletion_audit",
              )
              .insert({
                target_user_id:
                  parsed.data.userId,
                performed_by:
                  actor.id,
                request_type:
                  "administrator",
                action:
                  "permanent_delete",
                outcome: "success",
                summary: {
                  tableCounts,
                  storageCounts,
                },
              });

          if (auditResult.error) {
            /*
             * The account is already removed at this point.
             * Return success but identify the audit failure.
             */
            return Response.json({
              status: "completed",
              warning: `The account was deleted, but the final audit insert failed: ${auditResult.error.message}`,
            });
          }

          return Response.json({
            status: "completed",
          });
        } catch (error) {
          console.error(
            "Account deletion API error:",
            error,
          );

          return jsonError(
            errorMessage(error),
            500,
          );
        }
      },
    },
  },
});