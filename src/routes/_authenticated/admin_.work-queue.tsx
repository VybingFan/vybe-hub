import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  BellRing,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck2,
  Megaphone,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminNotificationService,
  type AdminNotification,
  type WorkQueueSummary,
} from "@/services/admin/adminNotificationService";

export const Route = createFileRoute("/_authenticated/admin_/work-queue")({
  component: WorkQueuePage,
});

function WorkQueuePage() {
  const [summary, setSummary] = useState<WorkQueueSummary | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const load = useCallback(async () => {
    try {
      const [nextSummary, nextNotifications] = await Promise.all([
        adminNotificationService.summary(),
        adminNotificationService.list(),
      ]);
      setSummary(nextSummary);
      setNotifications(nextNotifications);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load the work queue");
    }
  }, []);

  useEffect(() => void load(), [load]);

  return (
    <RoleGuard allow={["admin"]}>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <BellRing className="h-5 w-5" /> Internal operations
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Work Queue</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Review new applications, campaigns, creative, and documents that require a VYBE
              decision.
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </header>

        {summary ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QueueMetric icon={BellRing} label="Unread alerts" value={summary.unread} />
            <QueueMetric
              icon={BriefcaseBusiness}
              label="Business applications"
              value={summary.business_applications}
            />
            <QueueMetric
              icon={Megaphone}
              label="Campaign reviews"
              value={summary.campaign_reviews}
            />
            <QueueMetric
              icon={FileCheck2}
              label="Document reviews"
              value={summary.document_reviews}
            />
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Items requiring attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{item.title}</p>
                      <Badge variant={item.status === "unread" ? "default" : "outline"}>
                        {item.status}
                      </Badge>
                      <Badge variant="secondary">{item.priority}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      onClick={() => void adminNotificationService.markRead(item.id)}
                    >
                      <Link to={item.action_path}>Open</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        await adminNotificationService.resolve(item.id);
                        await load();
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Resolve
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No unread or active notifications.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}

function QueueMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BellRing;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <Icon className="h-5 w-5 text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
