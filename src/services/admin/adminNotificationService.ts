import { supabase } from "@/integrations/supabase/client";

export type WorkQueueSummary = {
  generated_at: string;
  unread: number;
  urgent: number;
  business_applications: number;
  campaign_reviews: number;
  creative_reviews: number;
  document_reviews: number;
};

export type AdminNotification = {
  id: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  action_path: string;
  status: string;
  created_at: string;
};

export const adminNotificationService = {
  async summary(): Promise<WorkQueueSummary> {
    // Generated types refresh after the migration reaches the remote project.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_admin_work_queue_summary");
    if (error) throw error;
    return data as WorkQueueSummary;
  },

  async list(): Promise<AdminNotification[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("admin_notifications")
      .select(
        "id,category,priority,title,message,entity_type,entity_id,action_path,status,created_at",
      )
      .in("status", ["unread", "read"])
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []) as AdminNotification[];
  },

  async markRead(id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("admin_notifications")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "unread");
    if (error) throw error;
  },

  async resolve(id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("admin_notifications")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
};
