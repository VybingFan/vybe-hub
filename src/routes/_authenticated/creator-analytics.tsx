import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CheckCircle2, Clock3, Download, Eye, Headphones, Heart, LockKeyhole, MessageCircle, Repeat2, UserPlus, Users } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LockedFeatureCard } from "@/components/membership/LockedFeatureCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCreatorEntitlements, hasCreatorFeature } from "@/features/membership/entitlements";
import { useMembership } from "@/hooks/useMembership";
import { supabase } from "@/integrations/supabase/client";
import { CreatorEngagementPanel } from "@/components/engagement/CreatorEngagementPanel";

export const Route = createFileRoute("/_authenticated/creator-analytics")({
  component: () => <RoleGuard allow={["creator", "admin"]}><CreatorInsightsPage /></RoleGuard>,
});

type SocialTotals = Record<string, number>;
type PlaylistRow = { playlist_id: string; title: string; opens: number; plays: number; unique_visitors: number };
type PlaylistInsights = { opens: number; plays: number; unique_visitors: number; playlists: PlaylistRow[] };
type TrackRetention = {
  track_id: string; title: string; starts: number; qualified_plays: number; unique_listeners: number;
  listening_seconds: number; average_listening_seconds: number; completions: number;
  completion_rate: number; repeat_listeners: number; reached_25: number; reached_50: number;
  reached_75: number; reached_90: number;
};
type RetentionInsights = Omit<TrackRetention, "track_id" | "title"> & { tracks: TrackRetention[] };

const emptyPlaylist: PlaylistInsights = { opens: 0, plays: 0, unique_visitors: 0, playlists: [] };
const emptyRetention: RetentionInsights = {
  starts: 0, qualified_plays: 0, unique_listeners: 0, listening_seconds: 0,
  average_listening_seconds: 0, completions: 0, completion_rate: 0, repeat_listeners: 0,
  reached_25: 0, reached_50: 0, reached_75: 0, reached_90: 0, tracks: [],
};

function formatListeningTime(seconds: number) {
  const safe = Math.max(0, Math.round(seconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainder = safe % 60;
  return hours ? `${hours}h ${minutes}m` : minutes ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

function CreatorInsightsPage() {
  const { data: membership } = useMembership();
  const entitlements = getCreatorEntitlements(membership?.plan_code);
  const analyticsDays = entitlements.limits.analyticsDays;
  const queryDays = analyticsDays ?? 3650;
  const canExport = hasCreatorFeature(membership?.plan_code, "analytics.export");
  const [social, setSocial] = useState<SocialTotals>({});
  const [playlist, setPlaylist] = useState<PlaylistInsights>(emptyPlaylist);
  const [retention, setRetention] = useState<RetentionInsights>(emptyRetention);

  useEffect(() => {
    void (async () => {
      const [{ data: socialData }, { data: playlistData }, { data: retentionData }] = await Promise.all([
        (supabase.rpc as any)("get_my_creator_activity", { p_days: queryDays }),
        (supabase.rpc as any)("get_my_creator_playlist_insights", { p_days: queryDays }),
        (supabase.rpc as any)("get_my_creator_retention_insights", { p_days: queryDays }),
      ]);
      setSocial(socialData || {});
      setPlaylist(playlistData || emptyPlaylist);
      setRetention(retentionData || emptyRetention);
    })();
  }, [queryDays]);

  const periodLabel = analyticsDays ? `Last ${analyticsDays} days` : "All available history";
  const overviewMetrics = useMemo(() => [
    ["Qualified plays", retention.qualified_plays || 0, Headphones],
    ["Unique listeners", retention.unique_listeners || 0, Users],
    ["Listening time", formatListeningTime(retention.listening_seconds), Clock3],
    ["Completion rate", `${retention.completion_rate || 0}%`, CheckCircle2],
    ["Repeat listeners", retention.repeat_listeners || 0, Repeat2],
    ["Playlist opens", playlist.opens || 0, Eye],
    ["Followers", social.followers || 0, UserPlus],
    ["Likes & saves", (social.likes || 0) + (social.saves || 0), Heart],
  ] as const, [playlist, retention, social]);

  const exportCsv = () => {
    const rows = [
      "Song,Starts,Qualified plays,Unique listeners,Listening seconds,Average seconds,Completions,Completion rate,Repeat listeners,Listened 25%,Listened 50%,Listened 75%,Listened 90%",
      ...retention.tracks.map((row) => `"${row.title.replaceAll('"', '""')}",${row.starts},${row.qualified_plays},${row.unique_listeners},${row.listening_seconds},${row.average_listening_seconds},${row.completions},${row.completion_rate},${row.repeat_listeners},${row.reached_25},${row.reached_50},${row.reached_75},${row.reached_90}`),
    ];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "vybe-creator-retention-insights.csv"; link.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 min-[900px]:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Creator Studio</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Creator Insights</h1>
          <p className="mt-2 text-muted-foreground">Understand how people discover, experience, and engage with your content.</p>
          <p className="mt-1 text-sm text-muted-foreground">Reporting period: {periodLabel} · Creator self-plays excluded</p>
        </div>
        {canExport ? <Button type="button" variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          : <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><LockKeyhole className="h-4 w-4" /> Export requires Creator Pro</span>}
      </div>

      <Tabs defaultValue="overview" className="space-y-6 min-[900px]:space-y-4">
        <div className="overflow-x-auto pb-1"><TabsList className="w-max min-w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger><TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList></div>

        <TabsContent value="overview" className="space-y-6 min-[900px]:space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 min-[900px]:gap-3">
            {overviewMetrics.map(([label, value, Icon]) => <Card key={label}><CardContent className="flex items-center gap-4 p-5 min-[900px]:gap-3 min-[900px]:p-4"><Icon className="h-6 w-6 text-primary min-[900px]:h-5 min-[900px]:w-5" /><div><p className="text-3xl font-semibold min-[900px]:text-2xl">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div></CardContent></Card>)}
          </div>
          <Card><CardContent className="p-6 min-[900px]:p-4"><h2 className="text-xl font-semibold">Listening depth</h2><p className="mt-1 text-sm text-muted-foreground">How many playback sessions accumulated each share of a song.</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 min-[900px]:mt-3">{[["25%", retention.reached_25], ["50%", retention.reached_50], ["75%", retention.reached_75], ["90%", retention.reached_90]].map(([label, value]) => <div key={label} className="rounded-xl border p-4 min-[900px]:p-3"><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">Listened {label}</p></div>)}</div></CardContent></Card>
        </TabsContent>

        <TabsContent value="music">
          <section><h2 className="text-2xl font-semibold">Song performance</h2><p className="mt-2 text-sm text-muted-foreground">A qualified play is at least 30 seconds, or half of content shorter than 30 seconds.</p>
            <div className="mt-4 overflow-x-auto rounded-2xl border"><table className="w-full min-w-[850px] text-sm"><thead className="bg-muted/40 text-left text-muted-foreground"><tr><th className="p-4 min-[900px]:p-3">Song</th><th>Qualified</th><th>Listeners</th><th>Listening time</th><th>Average</th><th>Completed</th><th>Repeat</th></tr></thead><tbody>
              {retention.tracks.map((row) => <tr key={row.track_id} className="border-t"><td className="p-4 font-medium min-[900px]:p-3">{row.title}</td><td>{row.qualified_plays}</td><td>{row.unique_listeners}</td><td>{formatListeningTime(row.listening_seconds)}</td><td>{formatListeningTime(row.average_listening_seconds)}</td><td>{row.completion_rate}%</td><td>{row.repeat_listeners}</td></tr>)}
              {!retention.tracks.length && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground min-[900px]:p-6">Play shared music to begin collecting song retention insights.</td></tr>}
            </tbody></table></div>
          </section>
        </TabsContent>

        <TabsContent value="playlists"><section><h2 className="text-2xl font-semibold">Playlist performance</h2><div className="mt-4 overflow-hidden rounded-2xl border">{playlist.playlists.map((row) => <div key={row.playlist_id} className="grid gap-2 border-b px-4 py-4 last:border-0 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-5 min-[900px]:py-3"><span className="font-medium">{row.title}</span><span className="text-muted-foreground">{row.opens} opens</span><span className="text-muted-foreground">{row.plays} starts</span><span className="text-muted-foreground">{row.unique_visitors} visitors</span></div>)}{!playlist.playlists.length && <p className="p-8 text-center text-muted-foreground min-[900px]:p-6">Share a playlist to begin collecting insights.</p>}</div></section></TabsContent>

        <TabsContent value="engagement"><CreatorEngagementPanel days={queryDays} social={social} /></TabsContent>
      </Tabs>

      {!canExport ? <LockedFeatureCard title="Advanced insights and exports" description="Keep a longer reporting window and export creator performance for professional review." requiredPlan="creator_pro" educationKey="analytics_export" usage={`${periodLabel} reporting is active on your current membership.`} compact /> : null}
    </div>
  );
}
