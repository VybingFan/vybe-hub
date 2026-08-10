import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, LockKeyhole } from "lucide-react";
import { LockedFeatureCard } from "@/components/membership/LockedFeatureCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCreatorEntitlements, hasCreatorFeature } from "@/features/membership/entitlements";
import { useMembership } from "@/hooks/useMembership";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/creator-analytics")({
  component: CreatorAnalyticsPage,
});

function CreatorAnalyticsPage() {
  const { data: membership } = useMembership();
  const entitlements = getCreatorEntitlements(membership?.plan_code);
  const analyticsDays = entitlements.limits.analyticsDays;
  const queryDays = analyticsDays ?? 3650;
  const canExport = hasCreatorFeature(membership?.plan_code, "analytics.export");
  const [data, setData] = useState<Record<string, number>>({});

  useEffect(() => {
    void (async () => {
      const { data: activity } = await (supabase.rpc as any)(
        "get_my_creator_activity",
        { p_days: queryDays },
      );
      setData(activity || {});
    })();
  }, [queryDays]);

  const title = analyticsDays ? `${analyticsDays}-day creator activity` : "All-time creator activity";
  const rows = useMemo(
    () => [
      ["Followers", data.followers || 0],
      ["Likes", data.likes || 0],
      ["Saves", data.saves || 0],
      ["Comments", data.comments || 0],
    ] as const,
    [data],
  );

  const exportCsv = () => {
    const csv = ["Metric,Total", ...rows.map(([label, value]) => `${label},${value}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "vybe-creator-analytics.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Creator Studio</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your reporting window is based on the active creator membership.
          </p>
        </div>
        {canExport ? (
          <Button type="button" variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <LockKeyhole className="h-4 w-4" /> Export requires Creator Pro
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-3xl font-semibold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!canExport ? (
        <LockedFeatureCard
          title="Advanced analytics and exports"
          description="Keep a one-year reporting window and export creator activity for professional review."
          requiredPlan="creator_pro"
          usage={analyticsDays ? `${analyticsDays}-day reporting is active on your current membership.` : "All-time reporting is active on your current membership."}
          compact
        />
      ) : null}
    </div>
  );
}
