import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const roleCodes = [
  "super_admin",
  "business_operations",
  "creator_support",
  "content_moderator",
  "rights_reviewer",
  "finance_admin",
  "analytics_viewer",
  "support_agent",
] as const;

const requestSchema = z.object({
  email: z.string().trim().email().max(320),
  recipientName: z.string().trim().max(100).optional(),
  roleCodes: z.array(z.enum(roleCodes)).min(1).max(8),
  expiresInDays: z.number().int().min(1).max(14),
});

type RpcClient = {
  rpc: (
    name: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export const Route = createFileRoute("/api/admin-team-invite")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorization = request.headers.get("authorization");
        if (!authorization?.startsWith("Bearer ")) {
          return Response.json({ error: "Sign in is required." }, { status: 401 });
        }

        const parsed = requestSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0]?.message || "Invalid request." }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const token = authorization.slice("Bearer ".length);
        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !authData.user) {
          return Response.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
        }

        const adminRpc = supabaseAdmin as unknown as RpcClient;
        const permission = await adminRpc.rpc("has_admin_permission", {
          _user_id: authData.user.id,
          _permission: "admin.team.manage",
        });
        if (permission.error || permission.data !== true) {
          return Response.json({ error: "Super Administrator permission is required." }, { status: 403 });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceKey) {
          return Response.json({ error: "Administrator email delivery is not configured." }, { status: 503 });
        }

        const createResponse = await fetch(
          `${supabaseUrl}/rest/v1/rpc/create_admin_invitation_v24_28`,
          {
            method: "POST",
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              _email: parsed.data.email,
              _role_codes: [...new Set(parsed.data.roleCodes)],
              _recipient_name: parsed.data.recipientName || null,
              _expires_in_days: parsed.data.expiresInDays,
            }),
          },
        );
        const created = (await createResponse.json()) as
          | Array<{ invitation_id: string; invitation_token: string; expires_at: string }>
          | { message?: string };
        if (!createResponse.ok || !Array.isArray(created) || !created[0]) {
          const message = !Array.isArray(created) ? created.message : undefined;
          return Response.json({ error: message || "The administrator invitation could not be created." }, { status: 400 });
        }

        const invitation = created[0];
        const origin = new URL(request.url).origin;
        const redirectTo = `${origin}/admin-invite/${invitation.invitation_token}`;
        const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          parsed.data.email,
          {
            redirectTo,
            data: {
              display_name: parsed.data.recipientName || "VYBE Administrator",
              admin_invitation_id: invitation.invitation_id,
            },
          },
        );

        if (emailError) {
          await adminRpc.rpc("mark_admin_invitation_delivery_v24_28", {
            _invitation_id: invitation.invitation_id,
            _delivery_status: "failed",
            _delivery_error_code: "AUTH_INVITE_FAILED",
          });
          return Response.json(
            { error: "The invitation record was created, but the email could not be sent. Revoke it before retrying." },
            { status: 502 },
          );
        }

        await adminRpc.rpc("mark_admin_invitation_delivery_v24_28", {
          _invitation_id: invitation.invitation_id,
          _delivery_status: "sent",
          _delivery_error_code: null,
        });

        return Response.json({
          invitationId: invitation.invitation_id,
          expiresAt: invitation.expires_at,
        });
      },
    },
  },
});
