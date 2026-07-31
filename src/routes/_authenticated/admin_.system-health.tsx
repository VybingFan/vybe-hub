import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, ArrowLeft, BellRing, Cpu } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminService, type SystemHealth } from "@/services/admin/adminService";

export const Route = createFileRoute("/_authenticated/admin_/system-health")({
  component: SystemHealthRoute,
});

function SystemHealthRoute() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  useEffect(() => {
    void adminService
      .getSystemHealth()
      .then(setHealth)
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Could not load system health"),
      );
  }, []);
  const processorObserved = Boolean(health?.latestCompletedAt || health?.latestProcessorVersion);
  return (
    <RoleGuard allow={["admin"]}>
      <div className="mx-auto max-w-6xl space-y-7">
        <header>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Back Office
            </Link>
          </Button>
          <div className="mt-3 flex items-center gap-2 text-primary">
            <Activity className="h-5 w-5" /> Operations health
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">System Health</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Operational signals for services that require an administrator or separate trusted
            processor.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary" />
                  <p className="font-semibold">Native rights processor</p>
                </div>
                <Badge variant={processorObserved ? "default" : "destructive"}>
                  {processorObserved ? "Observed" : "Not connected"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {processorObserved
                  ? `Last completion ${new Date(health!.latestCompletedAt!).toLocaleString()}`
                  : "Uploads can queue safely, but FFmpeg and Chromaprint results will not appear until the private processor is deployed."}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {["queued", "completed", "failed"].map((status) => (
                  <div className="rounded-lg border p-3" key={status}>
                    <p className="text-xl font-semibold">{health?.jobs[status] ?? 0}</p>
                    <p className="text-xs capitalize text-muted-foreground">{status}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                <p className="font-semibold">Back Office notifications</p>
              </div>
              <p className="text-3xl font-semibold">{health?.notificationsUnread ?? 0}</p>
              <p className="text-sm text-muted-foreground">
                Unread operational alerts. Review these from the Work Queue or the header bell.
              </p>
              <Button asChild variant="outline">
                <Link to="/admin/work-queue">Open Work Queue</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
