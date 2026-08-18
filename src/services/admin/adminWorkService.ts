import { supabase } from "@/integrations/supabase/client";

export type AdminWorkStatus =
  | "unassigned"
  | "assigned"
  | "in_progress"
  | "waiting"
  | "completed"
  | "cancelled";

export type AdminWorkPriority = "low" | "normal" | "high" | "urgent";

export type AdminWorkItem = {
  id: string;
  source_type: string;
  source_id: string | null;
  category: string;
  title: string;
  description: string | null;
  action_path: string | null;
  status: AdminWorkStatus;
  priority: AdminWorkPriority;
  assigned_to: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  due_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type AdminWorkSummary = {
  authorized: boolean;
  my_open?: number;
  my_urgent?: number;
  unassigned?: number;
  overdue?: number;
};

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

export const adminWorkService = {
  async currentUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  },

  async syncAlerts(): Promise<{ inserted: number; refreshed: number }> {
    return rpc<{ inserted: number; refreshed: number }>(
      "sync_admin_notifications_to_work_items",
    );
  },

  async summary(): Promise<AdminWorkSummary> {
    return rpc<AdminWorkSummary>("get_my_admin_work_summary");
  },

  async list(): Promise<AdminWorkItem[]> {
    return rpc<AdminWorkItem[]>("list_admin_work_items");
  },

  create(input: {
    sourceType: string;
    sourceId: string;
    category: string;
    title: string;
    description?: string | null;
    actionPath?: string | null;
    priority?: AdminWorkPriority;
    dueAt?: string | null;
  }) {
    return rpc<AdminWorkItem>("create_admin_work_item", {
      p_source_type: input.sourceType,
      p_source_id: input.sourceId,
      p_category: input.category,
      p_title: input.title,
      p_description: input.description ?? null,
      p_action_path: input.actionPath ?? null,
      p_priority: input.priority ?? "normal",
      p_due_at: input.dueAt ?? null,
    });
  },

  assign(workItemId: string, assignedTo: string) {
    return rpc<AdminWorkItem>("assign_admin_work_item", {
      p_work_item_id: workItemId,
      p_assigned_to: assignedTo,
    });
  },

  unassign(workItemId: string) {
    return rpc<AdminWorkItem>("unassign_admin_work_item", {
      p_work_item_id: workItemId,
    });
  },

  update(input: {
    workItemId: string;
    status?: Exclude<AdminWorkStatus, "unassigned"> | null;
    priority?: AdminWorkPriority | null;
    dueAt?: string | null;
    clearDueAt?: boolean;
    notes?: string | null;
  }) {
    return rpc<AdminWorkItem>("update_admin_work_item", {
      p_work_item_id: input.workItemId,
      p_status: input.status ?? null,
      p_priority: input.priority ?? null,
      p_due_at: input.dueAt ?? null,
      p_clear_due_at: input.clearDueAt ?? false,
      p_notes: input.notes ?? null,
    });
  },
};
