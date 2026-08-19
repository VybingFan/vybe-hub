import { supabase } from "@/integrations/supabase/client";

export type AdminNotificationPreferences = {
  enabled: boolean;
  notify_assigned: boolean;
  notify_urgent: boolean;
  notify_overdue: boolean;
  updated_at: string;
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

export const adminDeviceNotificationService = {
  getPreferences() {
    return rpc<AdminNotificationPreferences>("get_my_admin_notification_preferences");
  },

  updatePreferences(input: {
    enabled?: boolean;
    notifyAssigned?: boolean;
    notifyUrgent?: boolean;
    notifyOverdue?: boolean;
  }) {
    return rpc<AdminNotificationPreferences>("update_my_admin_notification_preferences", {
      p_enabled: input.enabled ?? null,
      p_notify_assigned: input.notifyAssigned ?? null,
      p_notify_urgent: input.notifyUrgent ?? null,
      p_notify_overdue: input.notifyOverdue ?? null,
    });
  },

  async requestPermission(): Promise<NotificationPermission | "unsupported"> {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    if (Notification.permission === "granted") return "granted";
    return Notification.requestPermission();
  },

  permission(): NotificationPermission | "unsupported" {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  },

  async show(input: { title: string; body: string; url: string; tag: string }) {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (this.permission() !== "granted") return;

    const registration = await navigator.serviceWorker.ready;
    const worker = registration.active || registration.waiting || registration.installing;
    if (!worker) return;

    worker.postMessage({
      type: "BACK_OFFICE_NOTIFY",
      notification: {
        title: input.title,
        options: {
          body: input.body,
          icon: "/pwa/back-office/icon-192.png",
          badge: "/pwa/back-office/icon-192.png",
          tag: input.tag,
          renotify: false,
          data: { url: input.url },
        },
      },
    });
  },
};
