import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export const copyrightComplianceService = {
  async accept(userAgent = "") {
    const { error } = await db.rpc("accept_creator_compliance_v24_41g2b", {
      _user_agent_summary: userAgent.slice(0, 500),
    });
    if (error) throw new Error(error.message);
  },
  async acceptanceReady(userId: string) {
    const { data, error } = await db.rpc(
      "has_current_creator_compliance_acceptance",
      { _user_id: userId },
    );
    if (error) throw new Error(error.message);
    return data === true;
  },
  async submitNotice(values: Record<string, unknown>) {
    const { data, error } = await db.rpc("submit_dmca_notice_v24_41g2b", values);
    if (error) throw new Error(error.message);
    return data as string;
  },
  async creatorCases(userId: string) {
    const { data, error } = await db
      .from("copyright_cases")
      .select("id,case_number,status,material_url,received_at,counter_received_at")
      .eq("creator_id", userId)
      .order("received_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async submitCounterNotice(caseId: string, values: Record<string, unknown>) {
    const { error } = await db.rpc("submit_counter_notice_v24_41g2b", {
      _case_id: caseId,
      ...values,
    });
    if (error) throw new Error(error.message);
  },
  async adminCases() {
    const { data, error } = await db.rpc(
      "get_admin_copyright_cases_v24_41g2b",
    );
    if (error) throw new Error(error.message);
    return Array.isArray(data) ? data : [];
  },
  async updateCase(id: string, status: string, notes: string, target?: { type: string; id: string; creatorId: string }) {
    const { error } = await db.rpc("admin_update_copyright_case_v24_41g2b", {
      _case_id: id,
      _status: status,
      _notes: notes,
      _target_type: target?.type ?? null,
      _target_id: target?.id ?? null,
      _creator_id: target?.creatorId ?? null,
    });
    if (error) throw new Error(error.message);
  },
  async scheduleRestoration(id: string) {
    const { error } = await db.rpc("admin_schedule_dmca_restoration_v24_41g2b", {
      _case_id: id,
      _claimant_notified: true,
    });
    if (error) throw new Error(error.message);
  },
  async restoreMaterial(id: string) {
    const { error } = await db.rpc("admin_restore_dmca_material_v24_41g2b", {
      _case_id: id,
      _court_action_confirmed_absent: true,
    });
    if (error) throw new Error(error.message);
  },
  async issueStrike(id: string, reason: string) {
    const { data, error } = await db.rpc("admin_issue_copyright_strike_v24_41g2b", {
      _case_id: id,
      _reason: reason,
    });
    if (error) throw new Error(error.message);
    return data as number;
  },
  async audits() {
    const { data, error } = await db.from("rights_audits").select("*").order("due_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  async generateAudits() {
    const { data, error } = await db.rpc("generate_random_rights_audits_v24_41g2b", {
      _percent: 5,
      _maximum: 25,
    });
    if (error) throw new Error(error.message);
    return data as number;
  },
  async respondToAudit(id: string, response: string) {
    const { error } = await db.rpc("submit_rights_audit_response_v24_41g2b", {
      _audit_id: id,
      _response: response,
    });
    if (error) throw new Error(error.message);
  },
  async createAudit(values: { creatorId:string; targetType:string; targetId:string; reason:string; request:string }) {
    const { error } = await db.rpc("admin_create_rights_audit_v24_41g2b", {
      _creator_id: values.creatorId,
      _target_type: values.targetType,
      _target_id: values.targetId,
      _reason: values.reason,
      _request: values.request,
    });
    if (error) throw new Error(error.message);
  },
};
