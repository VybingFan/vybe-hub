import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Circle,
  ExternalLink,
  Eye,
  Headphones,
  ListMusic,
  Music2,
  Plus,
  ShoppingBag,
  UserRound,
  Users,
} from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LockedFeatureCard } from "@/components/membership/LockedFeatureCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompactListRow } from "@/components/workspace/CompactListRow";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceSection } from "@/components/workspace/WorkspaceSection";
import { useUser } from "@/hooks/useUser";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { useCreatorTracks } from "@/hooks/useMusic";
import { useMyPlaylists } from "@/hooks/usePlaylists";
import { useMerch } from "@/hooks/useMerch";
import { useMyActivity } from "@/hooks/useActivity";
import { useMyConnections } from "@/hooks/useConnections";
import { useMembership } from "@/hooks/useMembership";
import { getCreatorEntitlements } from "@/features/membership/entitlements";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});
function DashboardPage() {
  return (
    <RoleGuard allow={["creator", "admin"]}>
      <DashboardContent />
    </RoleGuard>
  );
}

function DashboardContent() {
  const { user, profile: account } = useUser();
  const { data: creator } = useCreatorProfile(user?.id);
  const { data: tracks = [] } = useCreatorTracks(user?.id);
  const { data: playlists = [] } = useMyPlaylists(user?.id);
  const { data: merch = [] } = useMerch(user?.id);
  const { data: activity = [] } = useMyActivity(user?.id);
  const { data: connections = [] } = useMyConnections(user?.id);
  const { data: membership } = useMembership();
  const creatorEntitlements = getCreatorEntitlements(membership?.plan_code);
  const published = tracks.filter(
    (track) => track.status === "published",
  ).length;
  const opens = activity.filter(
    (item) => item.event_type === "link_opened",
  ).length;
  const plays = activity.filter(
    (item) => item.event_type === "playback_started",
  ).length;
  const newConnections = connections.filter(
    (item) => item.status === "new",
  ).length;
  const playlistTotals = new Map<string, { title: string; total: number }>();
  activity.forEach((item) => {
    const row = playlistTotals.get(item.playlist_id) || {
      title: item.playlists?.title || "Shared playlist",
      total: 0,
    };
    row.total += 1;
    playlistTotals.set(item.playlist_id, row);
  });
  const topPlaylist = [...playlistTotals.values()].sort(
    (a, b) => b.total - a.total,
  )[0];
  const tasks = [
    {
      done: !!creator?.username && !!creator.artist_name,
      title: "Claim your artist name and public URL",
      body: "Add the identity supporters will recognize.",
      to: "/profile",
    },
    {
      done: published > 0,
      title: "Publish your music",
      body: published
        ? `${published} songs are public.`
        : "Upload at least one public song.",
      to: "/music/upload",
    },
    {
      done: !!creator?.bio && !!creator?.avatar_url,
      title: "Tell your story",
      body: "Add your bio, artist image, banner, and links.",
      to: "/profile",
    },
    {
      done: !!creator?.merch_url || merch.some((product) => product.is_active),
      title: "Showcase your merch",
      body: merch.length
        ? `${merch.length} showcase items are ready.`
        : "Add a product preview.",
      to: "/merch",
    },
    {
      done: playlists.some((playlist) => playlist.is_published),
      title: "Create a shareable experience",
      body: playlists.length
        ? `${playlists.length} playlists are ready.`
        : "Build a curated playlist.",
      to: "/playlists",
    },
  ] as const;
  const completed = tasks.filter((task) => task.done).length;
  const setupComplete = completed === tasks.length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <WorkspacePageHeader
        eyebrow="Creator Studio"
        title={`${creator?.artist_name || account?.display_name || "Creator"} Studio`}
        description="See what needs attention, create quickly, and follow your audience activity."
        action={
          creator?.username ? (
            <Button asChild variant="outline" size="sm">
              <Link
                to="/artist/$username"
                params={{ username: creator.username }}
              >
                View public page
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : undefined
        }
      />

      <section className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={Eye}
          value={opens}
          label="Playlist opens"
          to="/activity"
        />
        <Metric
          icon={Headphones}
          value={plays}
          label="Track plays"
          to="/activity"
        />
        <Metric
          icon={Users}
          value={connections.length}
          label={newConnections ? `${newConnections} new` : "Connections"}
          to="/connections"
        />
        <Metric
          icon={Music2}
          value={published}
          label="Published songs"
          to="/music"
        />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quick create</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction to="/music/upload" icon={Music2} title="Upload music" />
          <QuickAction
            to="/playlists"
            icon={ListMusic}
            title="Create playlist"
          />
          <QuickAction to="/merch" icon={ShoppingBag} title="Add merch" />
          <QuickAction to="/profile" icon={UserRound} title="Update profile" />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <WorkspaceSection
          title="Recent activity"
          count={activity.length}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/activity">View all</Link>
            </Button>
          }
        >
          {activity.slice(0, 6).map((item) => (
            <CompactListRow
              key={item.id}
              title={
                item.event_type === "link_opened"
                  ? "Playlist opened"
                  : "Track played"
              }
              description={`${item.tracks?.title ? `${item.tracks.title} • ` : ""}${item.playlists?.title || "Shared playlist"}`}
              metadata={new Date(item.created_at).toLocaleDateString()}
            />
          ))}
          {!activity.length ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Share a playlist to begin seeing audience activity.
            </p>
          ) : null}
        </WorkspaceSection>
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Top shared experience
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {topPlaylist?.title || "No activity yet"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {topPlaylist
                  ? `${topPlaylist.total} recorded opens and plays`
                  : "Your most active playlist will appear here."}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/playlists">Manage playlists</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Connection follow-up
              </p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">{newConnections}</h2>
                  <p className="text-sm text-muted-foreground">
                    new connections
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/connections">Open</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {creatorEntitlements.effectivePlan === "creator_free" ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Membership & growth</h2>
          <LockedFeatureCard
            title="Protected playlist sharing"
            description="Add password-protected playlists with controlled expiration for private previews."
            requiredPlan="creator_plus"
            educationKey="playlist_password"
            usage="Creator Free includes public links and up to two active unlisted playlists."
            compact
          />
          <LockedFeatureCard
            title="Full Creator Website and EPK"
            description="Build a multi-section public creator home and unlock the complete professional EPK."
            requiredPlan="creator_pro"
            educationKey="epk_full"
            compact
          />
        </section>
      ) : creatorEntitlements.effectivePlan === "creator_plus" ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Membership & growth</h2>
          <LockedFeatureCard
            title="Full Creator Website and professional EPK"
            description="Move beyond the Creator Showcase with full public sections, EPK export, and professional sharing controls."
            requiredPlan="creator_pro"
            educationKey="epk_full"
            usage="Your Creator Showcase, Top 5, EPK Lite, and protected-sharing allowance remain active."
            compact
          />
        </section>
      ) : null}

      {setupComplete ? (
        <details className="group rounded-2xl border border-emerald-500/25 bg-emerald-500/5">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15">
              <Check className="h-5 w-5 text-emerald-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Creator setup complete</p>
              <p className="text-sm text-muted-foreground">
                All five essentials are ready. Open to review them.
              </p>
            </div>
          </summary>
          <div className="grid gap-1 border-t border-border/60 p-3 sm:grid-cols-2">
            {tasks.map((task) => (
              <Link
                key={task.title}
                to={task.to}
                className="flex gap-3 rounded-xl p-3 hover:bg-muted"
              >
                <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </details>
      ) : (
        <WorkspaceSection
          title={`${completed} of ${tasks.length} setup essentials ready`}
          description="Complete the remaining items to strengthen your public presence."
          collapsible
          defaultOpen
        >
          {tasks.map((task) => (
            <CompactListRow
              key={task.title}
              leading={
                task.done ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )
              }
              title={<Link to={task.to}>{task.title}</Link>}
              description={task.body}
            />
          ))}
        </WorkspaceSection>
      )}
    </div>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
  to,
}: {
  icon: typeof Eye;
  value: number;
  label: string;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="h-full transition hover:border-primary/40">
        <CardContent className="flex items-center gap-3 p-3.5 sm:p-4">
          <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:flex">
            <Icon className="h-4 w-4 text-primary" />
          </span>
          <div>
            <p className="text-xl font-semibold sm:text-2xl">{value}</p>
            <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
function QuickAction({
  to,
  icon: Icon,
  title,
}: {
  to: string;
  icon: typeof Music2;
  title: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition hover:border-primary/40"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-medium">{title}</span>
      <Plus className="ml-auto h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
