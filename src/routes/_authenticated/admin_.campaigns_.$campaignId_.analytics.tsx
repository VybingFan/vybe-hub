import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Download,
  FileCheck2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  businessAdminService,
  type CampaignAnalytics,
  type CampaignEventRecord,
  type CampaignReportRecord,
} from "@/services/business/businessAdminService";

export const Route = createFileRoute("/_authenticated/admin_/campaigns_/$campaignId_/analytics")({
  component: CampaignAnalyticsRoute,
});

function dateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function CampaignAnalyticsRoute() {
  const { campaignId } = Route.useParams();
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000);
  const [rangeStart, setRangeStart] = useState(dateInput(monthAgo));
  const [rangeEnd, setRangeEnd] = useState(dateInput(now));
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [events, setEvents] = useState<CampaignEventRecord[]>([]);
  const [reports, setReports] = useState<CampaignReportRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date(`${rangeStart}T00:00:00`).toISOString();
      const endDate = new Date(`${rangeEnd}T00:00:00`);
      endDate.setDate(endDate.getDate() + 1);
      const end = endDate.toISOString();
      const [nextAnalytics, nextEvents, nextReports] = await Promise.all([
        businessAdminService.getCampaignAnalytics(campaignId, start, end),
        businessAdminService.listCampaignEvents(campaignId),
        businessAdminService.listCampaignReports(campaignId),
      ]);
      setAnalytics(nextAnalytics);
      setEvents(nextEvents);
      setReports(nextReports);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load campaign analytics");
    } finally {
      setLoading(false);
    }
  }, [campaignId, rangeEnd, rangeStart]);

  useEffect(() => void load(), [load]);

  async function changeTracking(status: "not_connected" | "testing" | "connected") {
    try {
      await businessAdminService.setConversionTrackingStatus(campaignId, status);
      toast.success("Conversion tracking state updated");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update tracking state");
    }
  }

  async function changeEvent(event: CampaignEventRecord, valid: boolean) {
    try {
      await businessAdminService.setEventValidity(
        event.id,
        valid,
        valid ? undefined : "admin_excluded",
      );
      toast.success(valid ? "Event restored" : "Event excluded");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update event");
    }
  }

  function downloadCsv() {
    if (!analytics) return;
    const header = [
      "date",
      "valid_impressions",
      "valid_clicks",
      "offer_claims",
      "verified_redemptions",
      "validated_conversions",
    ];
    const rows = analytics.daily.map((row) => [
      row.date,
      row.impressions,
      row.clicks,
      row.offer_claims,
      row.redemptions,
      analytics.conversion_tracking_status === "connected" ? row.conversions : "not_connected",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${analytics.campaign_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-verified-report.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function releaseReport() {
    if (!analytics) return;
    try {
      await businessAdminService.releaseCampaignReport(analytics);
      toast.success("Verified partner report released and audited");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not release report");
    }
  }

  return (
    <RoleGuard allow={["admin"]}>
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/campaigns/$campaignId" params={{ campaignId }}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to campaign
            </Link>
          </Button>
          <div className="mt-3 flex items-center gap-2 text-primary">
            <BarChart3 className="h-5 w-5" /> Verified event reporting
          </div>
          <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {analytics?.campaign_name || "Campaign Analytics"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Recorded VYBE activity only. Internal and invalid events are excluded from reported
                totals.
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </header>

        <Card>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="report-start">Report starts</Label>
              <Input
                id="report-start"
                type="date"
                value={rangeStart}
                onChange={(event) => setRangeStart(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-end">Report ends</Label>
              <Input
                id="report-end"
                type="date"
                value={rangeEnd}
                onChange={(event) => setRangeEnd(event.target.value)}
              />
            </div>
            <Button onClick={() => void load()}>Reconcile range</Button>
          </CardContent>
        </Card>

        {analytics ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <Metric label="Valid impressions" value={analytics.metrics.impressions} />
              <Metric label="Valid clicks" value={analytics.metrics.clicks} />
              <Metric
                label="Click-through rate"
                value={`${analytics.metrics.click_through_rate}%`}
              />
              <Metric label="Offer claims" value={analytics.metrics.offer_claims} />
              <Metric label="Redemptions" value={analytics.metrics.redemptions} />
              <Metric
                label="Conversions"
                value={
                  analytics.conversion_tracking_status === "connected"
                    ? analytics.metrics.conversions
                    : "Not connected"
                }
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tracking and data quality</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label htmlFor="tracking-state">Conversion tracking</Label>
                    <select
                      id="tracking-state"
                      className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={analytics.conversion_tracking_status}
                      onChange={(event) =>
                        void changeTracking(
                          event.target.value as "not_connected" | "testing" | "connected",
                        )
                      }
                    >
                      <option value="not_connected">Not connected</option>
                      <option value="testing">Testing - exclude from partner totals</option>
                      <option value="connected">Connected and validated</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Quality label="Events received" value={analytics.quality.events_total} />
                    <Quality label="Valid reported" value={analytics.quality.events_valid} />
                    <Quality label="Internal excluded" value={analytics.quality.events_internal} />
                    <Quality label="Invalid excluded" value={analytics.quality.events_invalid} />
                  </div>
                  {Object.keys(analytics.invalid_reasons).length ? (
                    <div>
                      <p className="text-sm font-medium">Exclusion reasons</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(analytics.invalid_reasons).map(([reason, count]) => (
                          <Badge key={reason} variant="outline">
                            {reason.replaceAll("_", " ")} · {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Partner report controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-6 text-muted-foreground">
                    CSV exports contain the selected date range and valid daily events. Releasing a
                    report saves an immutable metrics snapshot with its methodology and audit
                    record.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={downloadCsv}>
                      <Download className="mr-2 h-4 w-4" /> Download CSV
                    </Button>
                    <Button onClick={() => void releaseReport()}>
                      <FileCheck2 className="mr-2 h-4 w-4" /> Release verified report
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Conversion totals remain labeled “Not connected” until a validated conversion
                    source is explicitly marked connected.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Daily verified activity</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {analytics.daily.length ? (
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b text-xs text-muted-foreground">
                      <tr>
                        <th className="py-3">Date</th>
                        <th>Impressions</th>
                        <th>Clicks</th>
                        <th>Claims</th>
                        <th>Redemptions</th>
                        <th>Conversions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.daily.map((row) => (
                        <tr key={row.date} className="border-b last:border-0">
                          <td className="py-3">{row.date}</td>
                          <td>{row.impressions}</td>
                          <td>{row.clicks}</td>
                          <td>{row.offer_claims}</td>
                          <td>{row.redemptions}</td>
                          <td>
                            {analytics.conversion_tracking_status === "connected"
                              ? row.conversions
                              : "Not connected"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No valid, non-internal events were recorded in this date range.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Recent event verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.length ? (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border p-3 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{event.event_type.replaceAll("_", " ")}</p>
                      <Badge variant={event.is_valid && !event.is_internal ? "default" : "outline"}>
                        {event.is_internal
                          ? "internal"
                          : event.is_valid
                            ? "valid"
                            : `excluded: ${event.invalid_reason || "unspecified"}`}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(event.occurred_at).toLocaleString()} · session {event.session_id}
                    </p>
                  </div>
                  {!event.is_internal ? (
                    event.is_valid ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void changeEvent(event, false)}
                      >
                        <ShieldAlert className="mr-2 h-4 w-4" /> Exclude
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void changeEvent(event, true)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Restore
                      </Button>
                    )
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No campaign events have been recorded.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Released report history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reports.length ? (
              reports.map((report) => (
                <div key={report.id} className="flex justify-between gap-3 rounded-xl border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(report.range_start).toLocaleDateString()} -{" "}
                      {new Date(report.range_end).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Released{" "}
                      {report.released_at
                        ? new Date(report.released_at).toLocaleString()
                        : "not yet"}
                    </p>
                  </div>
                  <Badge>{report.status}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No verified reports have been released.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function Quality({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
