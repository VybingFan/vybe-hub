import { supabase } from "@/integrations/supabase/client";

export type BackOfficeSummary = {
  generated_at: string;
  accounts: {
    total: number;
    creators: number;
    supporters: number;
    new_last_7_days: number;
  };
  content: {
    tracks_total: number;
    tracks_published: number;
    tracks_draft: number;
    playlists_total: number;
    playlists_published: number;
    videos_total: number;
    videos_published: number;
    merch_total: number;
    merch_active: number;
  };
  attention: {
    rights_jobs_queued: number;
    rights_jobs_failed: number;
    rights_jobs_flagged: number;
    moderation_cases_open: number;
    copyright_reports_open: number;
    invitations_ready: number;
  };
  memberships: Record<string, number>;
};

export type AdminCreatorRecord = {
  user_id: string;
  display_name: string;
  creator_name?: string | null;
  focus_codes?: string[];
  email: string | null;
  joined_at: string;
  roles: string[];
  plan_code: string;
  entitlement_status: string;
  track_count: number;
  published_track_count: number;
  playlist_count: number;
  video_count: number;
  merch_count: number;
};

export type AdminMembershipRecord = {
  user_id: string;
  plan_code: string;
  status: string;
  billing_interval: string | null;
  stripe_subscription_status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type BusinessPackageRecord = {
  code: string;
  name: string;
  price_cents: number;
  billing_interval: string;
  duration_days: number | null;
  active_campaign_limit: number;
  is_public: boolean;
};

export type BusinessOfferRecord = {
  id: string;
  title: string;
  description: string;
  offer_code: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  max_redemptions: number | null;
  business_profiles: { public_name: string } | null;
};

export type SystemHealth = {
  jobs: Record<string, number>;
  latestCompletedAt: string | null;
  latestProcessorVersion: string | null;
  notificationsUnread: number;
};

export const adminService = {
  async getSummary(): Promise<BackOfficeSummary> {
    // Generated Supabase types are refreshed after this migration reaches the remote project.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("get_admin_back_office_summary");
    if (error) throw error;
    return data as BackOfficeSummary;
  },

  async listCreators(searchText = ""): Promise<AdminCreatorRecord[]> {
    // Generated Supabase types are refreshed after this migration reaches the remote project.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("get_admin_creator_directory", {
      search_text: searchText || undefined,
      result_limit: 100,
    });
    if (error) throw error;

    const base = (data ?? []) as AdminCreatorRecord[];
    const creatorIds = base
      .filter((row) => row.roles.includes("creator"))
      .map((row) => row.user_id);

    if (!creatorIds.length) return base;

    const [
      { data: profiles, error: profileError },
      { data: focusRows, error: focusError },
    ] = await Promise.all([
      supabase
        .from("creator_profiles")
        .select("user_id,artist_name,display_name")
        .in("user_id", creatorIds),
      supabase
        .from("creator_focus_access")
        .select("creator_id,focus_code,status,ends_at")
        .in("creator_id", creatorIds),
    ]);

    if (profileError) throw profileError;
    if (focusError) throw focusError;

    const creatorNames = new Map(
      (profiles ?? []).map((profile) => [
        profile.user_id,
        profile.artist_name || profile.display_name || null,
      ]),
    );

    const focuses = new Map<string, string[]>();
    const now = Date.now();

    (focusRows ?? []).forEach((row) => {
      const active =
        row.status === "active" &&
        (!row.ends_at || new Date(row.ends_at).getTime() > now);

      if (!active) return;

      const existing = focuses.get(row.creator_id) ?? [];
      if (!existing.includes(row.focus_code)) existing.push(row.focus_code);
      focuses.set(row.creator_id, existing);
    });

    return base.map((row) => ({
      ...row,
      creator_name: creatorNames.get(row.user_id) ?? null,
      focus_codes: focuses.get(row.user_id) ?? [],
    }));
  },

  async listMemberships(): Promise<AdminMembershipRecord[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("account_entitlements")
      .select(
        "user_id,plan_code,status,billing_interval,stripe_subscription_status,current_period_end,cancel_at_period_end",
      )
      .order("current_period_end", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as AdminMembershipRecord[];
  },

  async listBusinessPackages(): Promise<BusinessPackageRecord[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("business_packages")
      .select(
        "code,name,price_cents,billing_interval,duration_days,active_campaign_limit,is_public",
      )
      .order("price_cents", { ascending: true });
    if (error) throw error;
    return (data ?? []) as BusinessPackageRecord[];
  },

  async listBusinessOffers(): Promise<BusinessOfferRecord[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("business_offers")
      .select(
        "id,title,description,offer_code,status,starts_at,ends_at,max_redemptions,business_profiles(public_name)",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as BusinessOfferRecord[];
  },

  async getSystemHealth(): Promise<SystemHealth> {
    const [{ data: jobs, error: jobsError }, { count, error: notificationError }] =
      await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase
          .from("audio_processing_jobs")
          .select("status,completed_at,processor_version")
          .order("updated_at", { ascending: false })
          .limit(500),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase
          .from("admin_notifications")
          .select("id", { count: "exact", head: true })
          .eq("status", "unread"),
      ]);
    if (jobsError) throw jobsError;
    if (notificationError) throw notificationError;
    const rows = (jobs ?? []) as Array<{
      status: string;
      completed_at: string | null;
      processor_version: string | null;
    }>;
    const counts = rows.reduce<Record<string, number>>((result, row) => {
      result[row.status] = (result[row.status] ?? 0) + 1;
      return result;
    }, {});
    const completed = rows.find((row) => row.completed_at);
    const processed = rows.find((row) => row.processor_version);
    return {
      jobs: counts,
      latestCompletedAt: completed?.completed_at ?? null,
      latestProcessorVersion: processed?.processor_version ?? null,
      notificationsUnread: count ?? 0,
    };
  },
};
