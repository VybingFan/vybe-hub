import { supabase } from "@/integrations/supabase/client";

export type MembershipAuditFinding = {
  severity: "pass" | "review" | "warning";
  domain: string;
  code: string;
  affected_count: number;
  summary: string;
  recommendation: string;
};

export const membershipAuditService = {
  async run(): Promise<MembershipAuditFinding[]> {
    const { data, error } = await (supabase as any).rpc(
      "get_membership_privacy_audit_v24_41h",
    );
    if (error) throw new Error(error.message);
    return (data ?? []) as MembershipAuditFinding[];
  },
};

