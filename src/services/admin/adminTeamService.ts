import { supabase } from "@/integrations/supabase/client";

export type AdminRoleCode =
  | "super_admin"
  | "business_operations"
  | "creator_support"
  | "content_moderator"
  | "rights_reviewer"
  | "finance_admin"
  | "analytics_viewer"
  | "support_agent";

export interface AdminAccess {
  is_admin: boolean;
  status: "active" | "suspended" | "revoked" | "none";
  roles: AdminRoleCode[];
  permissions: string[];
}

export interface AdminRoleDefinition {
  code: AdminRoleCode;
  name: string;
  description: string;
  permissions: string[];
}

export interface AdminTeamMember {
  user_id: string;
  display_name: string;
  email: string | null;
  status: "active" | "suspended" | "revoked";
  activated_at: string;
  suspended_at: string | null;
  revoked_at: string | null;
  roles: AdminRoleCode[];
}

export interface AdminInvitation {
  id: string;
  email: string;
  recipient_name: string | null;
  expires_at: string;
  delivery_status: "pending" | "sent" | "failed";
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  roles: AdminRoleCode[];
}

export interface AdminTeamDashboard {
  generated_at: string;
  roles: AdminRoleDefinition[];
  members: AdminTeamMember[];
  invitations: AdminInvitation[];
}

export interface AdminInvitationPreview {
  recipient_name: string | null;
  role_names: string[];
  expires_at: string;
  invitation_status: "pending" | "accepted" | "expired" | "revoked";
}

type RpcResult = { data: unknown; error: { message: string } | null };
type RpcClient = {
  rpc: (name: string, args?: Record<string, unknown>) => Promise<RpcResult>;
};

const rpcClient = supabase as unknown as RpcClient;

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpcClient.rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const adminTeamService = {
  getMyAccess() {
    return rpc<AdminAccess>("get_my_admin_access_v24_28");
  },

  dashboard() {
    return rpc<AdminTeamDashboard>("get_admin_team_dashboard_v24_28");
  },

  async sendInvitation(input: {
    email: string;
    recipientName?: string;
    roleCodes: AdminRoleCode[];
    expiresInDays: number;
  }): Promise<{ invitationId: string; expiresAt: string }> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Your session has expired. Sign in again.");

    const response = await fetch("/api/admin-team-invite", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    const result = (await response.json()) as {
      invitationId?: string;
      expiresAt?: string;
      error?: string;
    };
    if (!response.ok || !result.invitationId || !result.expiresAt) {
      throw new Error(result.error || "The administrator invitation could not be sent.");
    }
    return { invitationId: result.invitationId, expiresAt: result.expiresAt };
  },

  async inspect(token: string): Promise<AdminInvitationPreview | null> {
    const rows = await rpc<AdminInvitationPreview[]>("inspect_admin_invitation_v24_28", {
      _token: token,
    });
    return rows[0] ?? null;
  },

  accept(token: string) {
    return rpc<string>("accept_admin_invitation_v24_28", { _token: token });
  },

  revokeInvitation(invitationId: string) {
    return rpc<void>("revoke_admin_invitation_v24_28", { _invitation_id: invitationId });
  },

  setMemberRoles(userId: string, roleCodes: AdminRoleCode[]) {
    return rpc<void>("set_admin_member_roles_v24_28", {
      _target_user_id: userId,
      _role_codes: roleCodes,
    });
  },

  setMemberStatus(userId: string, status: "active" | "suspended" | "revoked") {
    return rpc<void>("set_admin_member_status_v24_28", {
      _target_user_id: userId,
      _status: status,
    });
  },
};
