import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { BarChart3, FileCheck2, Megaphone, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  businessAdminService,
  type AdminCampaignReportRecord,
  type CampaignRecord,
} from "@/services/business/businessAdminService";

export const Route = createFileRoute("/_authenticated/admin_/reports")({
  component: AdminReportsRoute,
});

function AdminReportsRoute() {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [reports, setReports] = useState<AdminCampaignReportRecord[]>([]);
  const load = useCallback(async () => {
    try {
      const [nextCampaigns, nextReports] = await Promise.all([
        businessAdminService.listCampaigns(),
        businessAdminService.listAllCampaignReports(),
      ]);
      setCampaigns(nextCampaigns);
      setReports(nextReports);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load analytics operations");
    }
  }, []);
  useEffect(() => void load(), [load]);

  return (
    <AdminPermissionGuard anyOf={["admin.analytics.read"]}>
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-3 sm:flex-row">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <BarChart3 className="h-5 w-5" /> Reporting operations
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Analytics & Reports</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Review campaign analytics and every released partner report. Only
              valid, non-internal recorded events are reportable.
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Campaigns" value={campaigns.length} />
          <Metric
            label="Released reports"
            value={reports.filter((item) => item.status === "released").length}
          />
          <Metric
            label="Tracking connected"
            value={
              campaigns.filter((item) => item.conversion_tracking_status === "connected").length
            }
          />
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Campaign analytics</h2>
          {!campaigns.length ? (
            <Card>
              <CardContent className="p-7 text-sm text-muted-foreground">
                No campaigns have been created.
              </CardContent>
            </Card>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {campaign.business_profiles?.public_name}
                      </p>
                    </div>
                    <Badge variant="outline">{campaign.status}</Badge>
                  </div>
                  <p className="mt-3 flex-1 text-sm text-muted-foreground">{campaign.objective}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Badge
                      variant={
                        campaign.conversion_tracking_status === "connected"
                          ? "default"
                          : "secondary"
                      }
                    >
                      Conversions:{" "}
                      {campaign.conversion_tracking_status?.replaceAll("_", " ") || "not connected"}
                    </Badge>
                    <Button asChild size="sm">
                      <Link
                        to="/admin/campaigns/$campaignId/analytics"
                        params={{ campaignId: campaign.id }}
                      >
                        <BarChart3 className="mr-2 h-4 w-4" /> View analytics
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Released report register</h2>
          {!reports.length ? (
            <Card>
              <CardContent className="p-7 text-sm text-muted-foreground">
                No verified reports have been released.
              </CardContent>
            </Card>
          ) : null}
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex flex-col justify-between gap-3 p-5 sm:flex-row">
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    <FileCheck2 className="h-4 w-4 text-primary" />
                    {report.business_campaigns?.name || "Campaign report"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {report.business_campaigns?.business_profiles?.public_name ||
                      "Business partner"}{" "}
                    · {new Date(report.range_start).toLocaleDateString()} -{" "}
                    {new Date(report.range_end).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{report.status}</Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link
                      to="/admin/campaigns/$campaignId/analytics"
                      params={{ campaignId: report.campaign_id }}
                    >
                      <Megaphone className="mr-2 h-4 w-4" /> Open
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AdminPermissionGuard>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
