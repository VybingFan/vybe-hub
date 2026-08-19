import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { adminWorkService, type AdminWorkItem } from "@/services/admin/adminWorkService";
import { adminDeviceNotificationService } from "@/services/admin/adminDeviceNotificationService";

const STORAGE_KEY = "vybe:back-office-notified:v24.45e";
const POLL_MS = 60_000;

type SeenMap = Record<string, string>;

function loadSeen(): SeenMap {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as SeenMap;
  } catch {
    return {};
  }
}

function saveSeen(seen: SeenMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
}

function candidateKey(kind: string, item: AdminWorkItem) {
  const marker =
    kind === "overdue"
      ? item.due_at || item.updated_at
      : item.updated_at || item.assigned_at || item.created_at;
  return `${kind}:${item.id}:${marker}`;
}

export function BackOfficeNotificationMonitor() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const running = useRef(false);

  useEffect(() => {
    if (!pathname.startsWith("/admin")) return;

    let cancelled = false;

    const poll = async () => {
      if (running.current || cancelled) return;
      running.current = true;
      try {
        if (adminDeviceNotificationService.permission() !== "granted") return;

        const prefs = await adminDeviceNotificationService.getPreferences();
        if (!prefs.enabled) return;

        const [items, userId] = await Promise.all([
          adminWorkService.list(),
          adminWorkService.currentUserId(),
        ]);
        if (!userId) return;

        const mine = items.filter((item) => item.assigned_to === userId);
        const seen = loadSeen();
        const now = Date.now();
        const notifications: Array<{
          kind: string;
          item: AdminWorkItem;
          title: string;
          body: string;
        }> = [];

        for (const item of mine) {
          if (prefs.notify_assigned && item.status === "assigned") {
            notifications.push({
              kind: "assigned",
              item,
              title: "New Back Office assignment",
              body: item.title,
            });
          }

          if (prefs.notify_urgent && item.priority === "urgent") {
            notifications.push({
              kind: "urgent",
              item,
              title: "Urgent Back Office work",
              body: item.title,
            });
          }

          if (prefs.notify_overdue && item.due_at && new Date(item.due_at).getTime() < now) {
            notifications.push({
              kind: "overdue",
              item,
              title: "Back Office work is overdue",
              body: item.title,
            });
          }
        }

        let delivered = 0;
        for (const candidate of notifications) {
          const key = candidateKey(candidate.kind, candidate.item);
          if (seen[key]) continue;
          if (delivered >= 3) break;

          await adminDeviceNotificationService.show({
            title: candidate.title,
            body: candidate.body,
            url: candidate.item.action_path || "/admin/work-queue",
            tag: `vybe-back-office-${candidate.kind}-${candidate.item.id}`,
          });
          seen[key] = new Date().toISOString();
          delivered += 1;
        }

        const entries = Object.entries(seen);
        if (entries.length > 250) {
          entries
            .sort((a, b) => a[1].localeCompare(b[1]))
            .slice(0, entries.length - 200)
            .forEach(([key]) => delete seen[key]);
        }
        saveSeen(seen);
      } catch (error) {
        console.error("VYBE Back Office notification monitor failed", error);
      } finally {
        running.current = false;
      }
    };

    void poll();
    const interval = window.setInterval(() => void poll(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    window.addEventListener("online", poll);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("online", poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  return null;
}
