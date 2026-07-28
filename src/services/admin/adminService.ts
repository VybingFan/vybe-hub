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

export const adminService = {
  async getSummary(): Promise<BackOfficeSummary> {
    // Generated Supabase types are refreshed after this migration reaches the remote project.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_admin_back_office_summary");
    if (error) throw error;
    return data as BackOfficeSummary;
  },

  async listCreators(searchText = ""): Promise<AdminCreatorRecord[]> {
    // Generated Supabase types are refreshed after this migration reaches the remote project.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_admin_creator_directory", {
      search_text: searchText || null,
      result_limit: 100,
    });
    if (error) throw error;
    return (data ?? []) as AdminCreatorRecord[];
  },
};
