import { supabase } from "@/integrations/supabase/client";

export const pilotStages = [
  "prospect",
  "contacted",
  "applied",
  "qualified",
  "onboarding",
  "campaign_ready",
  "pilot_active",
  "reporting",
  "completed",
  "paused",
  "declined",
] as const;

export type PilotStage = (typeof pilotStages)[number];
export type ProgressStatus = "not_started" | "in_progress" | "complete" | "blocked";

export type PilotRecord = {
  id: string;
  business_id: string;
  business_name: string;
  contact_name: string | null;
  contact_email: string;
  verification_status: string;
  package_code: string | null;
  stage: PilotStage;
  assigned_to: string | null;
  assigned_name: string | null;
  next_action: string | null;
  follow_up_at: string | null;
  qualification_status: ProgressStatus;
  onboarding_status: ProgressStatus;
  pilot_notes: string | null;
  blockers: string | null;
  decisions: string | null;
  outcomes: string | null;
  paused_declined_reason: string | null;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
  completed_documents: number;
  required_documents: number;
  document_completion_percent: number;
  campaign_readiness_score: number;
  activity_count: number;
};

export type PilotDashboard = {
  generated_at: string;
  pilot_count: number;
  active_count: number;
  overdue_count: number;
  blocked_count: number;
  records: PilotRecord[];
};

export type PilotActivity = {
  id: string;
  pilot_id: string;
  activity_type: string;
  summary: string;
  occurred_at: string;
  next_action: string | null;
  follow_up_at: string | null;
  created_at: string;
};

export const businessPilotService = {
  async dashboard(): Promise<PilotDashboard> {
    // Generated database types are refreshed after the migration reaches Supabase.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_business_pilot_dashboard");
    if (error) throw error;
    return data as PilotDashboard;
  },

  async start(businessId: string): Promise<void> {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("business_pilot_records")
      .insert({ business_id: businessId, assigned_to: authData.user.id });
    if (error) throw error;
  },

  async assignToMe(pilotId: string): Promise<void> {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    await this.update(pilotId, { assigned_to: authData.user.id });
  },

  async update(
    pilotId: string,
    patch: Partial<
      Pick<
        PilotRecord,
        | "stage"
        | "assigned_to"
        | "next_action"
        | "follow_up_at"
        | "qualification_status"
        | "onboarding_status"
        | "pilot_notes"
        | "blockers"
        | "decisions"
        | "outcomes"
        | "paused_declined_reason"
      >
    >,
  ): Promise<void> {
    const completedAt = patch.stage === "completed" ? new Date().toISOString() : undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("business_pilot_records")
      .update({
        ...patch,
        ...(completedAt ? { completed_at: completedAt } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", pilotId);
    if (error) throw error;
  },

  async activities(pilotId: string): Promise<PilotActivity[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("business_pilot_activities")
      .select("id,pilot_id,activity_type,summary,occurred_at,next_action,follow_up_at,created_at")
      .eq("pilot_id", pilotId)
      .order("occurred_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as PilotActivity[];
  },

  async addActivity(input: {
    pilotId: string;
    businessId: string;
    activityType: string;
    summary: string;
    nextAction?: string;
    followUpAt?: string;
  }): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase as any;
    const followUpAt = input.followUpAt ? new Date(input.followUpAt).toISOString() : null;
    const { error } = await client.from("business_pilot_activities").insert({
      pilot_id: input.pilotId,
      business_id: input.businessId,
      activity_type: input.activityType,
      summary: input.summary.trim(),
      next_action: input.nextAction?.trim() || null,
      follow_up_at: followUpAt,
    });
    if (error) throw error;
    if (input.nextAction || followUpAt) {
      const { error: updateError } = await client
        .from("business_pilot_records")
        .update({
          next_action: input.nextAction?.trim() || null,
          follow_up_at: followUpAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.pilotId);
      if (updateError) throw updateError;
    }
  },
};
