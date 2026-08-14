import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Download, Eye, Headphones, Heart, LockKeyhole, MessageCircle, Repeat2, UserPlus } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LockedFeatureCard } from "@/components/membership/LockedFeatureCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCreatorEntitlements, hasCreatorFeature } from "@/features/membership/entitlements";
import { useMembership } from "@/hooks/useMembership";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/creator-analytics")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <CreatorInsightsPage />
    </RoleGuard>
  ),
});

type SocialTotals = Record<string, number>;
type PlaylistRow = { playlist_id: string; title: string; opens: number; plays: number; unique_visitors: number };
type PlaylistInsights = { opens: number; plays: number; unique_visitors: number; playlists: PlaylistRow[] };

const emptyPlaylistInsights: PlaylistInsights = { opens: 0, plays: 0, unique_visitors: 0, playlists: [] };

function CreatorInsightsPage() {
  const { data: membership } = useMembership();
  const entitlements = getCreatorEntitlements(membership?.plan_code);
  const analyticsDays = entitlements.limits.analyticsDays;
  const queryDays = analyticsDays ?? 3650;
  const canExport = hasCreatorFeature(membership?.plan_code, "analytics.export");
  const [social, setSocial] = useState<SocialTotals>({});
  const [playlist, setPlaylist] = useState<PlaylistInsights>(emptyPlaylistInsights);

  useEffect(() => {
    void (async () => {
      const [{ data: socialData }, { data: playlistData }] = await Promise.all([
        (supabase.rpc as any)("get_my_creator_activity", { p_days: queryDays }),
        (supabase.rpc as any)("get_my_creator_playlist_insights", { p_days: queryDays }),
      ]);
      setSocial(socialData || {});
      setPlaylist(playlistData || emptyPlaylistInsights);
    })();
  }, [queryDays]);

  const periodLabel = analyticsDays ? `Last ${analyticsDays} days` : "All available history";
  const metrics = useMemo(() => [
    ["Playlist opens", playlist.opens || 0, Eye],
    ["Playback starts", playlist.plays || 0, Headphones],
    ["Unique visitors", playlist.unique_visitors || 0, BarChart3],
    ["Followers", social.followers || 0, UserPlus],
    ["Likes", social.likes || 0, Heart],
    ["Saves", social.saves || 0, Repeat2],
    ["Comments", social.comments || 0, MessageCircle],
  ] as const, [playlist, social]);

  const exportCsv = () => {
    const rows = [
      "Category,Item,Playlist opens,Playback starts,Unique visitors",
      ...playlist.playlists.map((row) => `Playlist,"${row.title.replaceAll('"', '""')}",${row.opens},${row.plays},${row.unique_visitors}`),
      `Engagement,Followers,${social.followers || 0},,`,
      `Engagement,Likes,${social.likes || 0},,`,
      `Engagement,Saves,${social.saves || 0},,`,
      `Engagement,Comments,${social.comments || 0},,`,
    ];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "vybe-creator-insights.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Creator Studio</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Creator Insights</h1>
          <p className="mt-2 text-muted-foreground">Understand how people discover, experience, and engage with your content.</p>
          <p className="mt-1 text-sm text-muted-foreground">Reporting period: {periodLabel}</p>
        </div>
        {canExport ? (
          <Button type="button" variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><LockKeyhole className="h-4 w-4" /> Export requires Creator Pro</span>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-max min-w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(([label, value, Icon]) => (
              <Card key={label}><CardContent className="flex items-center gap-4 p-5"><Icon className="h-6 w-6 text-primary" /><div><p className="text-3xl font-semibold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div></CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="p-6"><h2 className="text-xl font-semibold">More listening detail is coming</h2><p className="mt-2 text-sm text-muted-foreground">Qualified plays, listening time, completion, repeat listeners, and song retention will appear here as VYBE begins recording playback progress events.</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="playlists">
          <section>
            <h2 className="text-2xl font-semibold">Playlist performance</h2>
            <p className="mt-2 text-sm text-muted-foreground">Complete totals for the active reporting period—not only the latest activity records.</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-border">
              {playlist.playlists.map((row) => (
                <div key={row.playlist_id} className="grid gap-2 border-b border-border px-4 py-4 last:border-0 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-5 sm:px-5">
                  <span className="font-medium">{row.title}</span>
                  <span className="text-sm text-muted-foreground">{row.opens} opens</span>
                  <span className="text-sm text-muted-foreground">{row.plays} plays</span>
                  <span className="text-sm text-muted-foreground">{row.unique_visitors} visitors</span>
                </div>
              ))}
              {!playlist.playlists.length && <p className="p-8 text-center text-muted-foreground">Share a playlist to begin collecting insights.</p>}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.slice(3).map(([label, value, Icon]) => (
              <Card key={label}><CardContent className="flex items-center gap-4 p-5"><Icon className="h-6 w-6 text-primary" /><div><p className="text-3xl font-semibold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div></CardContent></Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {!canExport ? <LockedFeatureCard title="Advanced insights and exports" description="Keep a longer reporting window and export creator performance for professional review." requiredPlan="creator_pro" usage={`${periodLabel} reporting is active on your current membership.`} compact /> : null}
    </div>
  );
}
