import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Circle, ExternalLink, Eye, Headphones, ListMusic, Music2, Plus, ShoppingBag, UserRound, Users } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { useCreatorTracks } from "@/hooks/useMusic";
import { useMyPlaylists } from "@/hooks/usePlaylists";
import { useMerch } from "@/hooks/useMerch";
import { useMyActivity } from "@/hooks/useActivity";
import { useMyConnections } from "@/hooks/useConnections";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

function DashboardPage() { return <RoleGuard allow={["creator", "admin"]}><DashboardContent /></RoleGuard>; }

function DashboardContent() {
  const { user, profile: account } = useUser();
  const { data: creator } = useCreatorProfile(user?.id);
  const { data: tracks = [] } = useCreatorTracks(user?.id);
  const { data: playlists = [] } = useMyPlaylists(user?.id);
  const { data: merch = [] } = useMerch(user?.id);
  const { data: activity = [] } = useMyActivity(user?.id);
  const { data: connections = [] } = useMyConnections(user?.id);
  const published = tracks.filter((track) => track.status === "published").length;
  const opens = activity.filter((item) => item.event_type === "link_opened").length;
  const plays = activity.filter((item) => item.event_type === "playback_started").length;
  const newConnections = connections.filter((item) => item.status === "new").length;
  const playlistTotals = new Map<string, { title: string; total: number }>();
  activity.forEach((item) => {
    const row = playlistTotals.get(item.playlist_id) || { title: item.playlists?.title || "Shared playlist", total: 0 };
    row.total += 1;
    playlistTotals.set(item.playlist_id, row);
  });
  const topPlaylist = [...playlistTotals.values()].sort((a, b) => b.total - a.total)[0];
  const tasks = [
    { done: !!creator?.username && !!creator.artist_name, title: "Claim your artist name and public URL", body: "Add the identity supporters will recognize.", to: "/profile", icon: UserRound },
    { done: published > 0, title: "Publish your music", body: published ? `${published} songs are public.` : "Upload at least one public song.", to: "/music/upload", icon: Music2 },
    { done: !!creator?.bio && !!creator?.avatar_url, title: "Tell your story", body: "Add your bio, artist image, banner, and links.", to: "/profile", icon: UserRound },
    { done: !!creator?.merch_url || merch.some((product) => product.is_active), title: "Showcase your merch", body: merch.length ? `${merch.length} showcase items are on your page.` : "Add a product preview.", to: "/merch", icon: ShoppingBag },
    { done: playlists.some((playlist) => playlist.is_published), title: "Create a shareable experience", body: playlists.length ? `${playlists.length} shareable playlists are ready.` : "Build a curated playlist.", to: "/playlists", icon: ListMusic },
  ] as const;
  const completed = tasks.filter((task) => task.done).length;
  const setupComplete = completed === tasks.length;

  return <div className="mx-auto max-w-7xl space-y-8">
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="text-sm text-muted-foreground">Welcome back</p><h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">{creator?.artist_name || account?.display_name || "Creator"} Studio</h1><p className="mt-3 text-muted-foreground">Track your audience, manage your work, and decide what to share next.</p></div>{creator?.username && <Button asChild variant="outline"><Link to="/artist/$username" params={{ username: creator.username }}>View public page <ExternalLink className="ml-2 h-4 w-4" /></Link></Button>}</header>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Eye} value={opens} label="Playlist opens" to="/activity" /><Metric icon={Headphones} value={plays} label="Track plays" to="/activity" /><Metric icon={Users} value={connections.length} label={newConnections ? `${newConnections} new connections` : "Listener connections"} to="/connections" /><Metric icon={Music2} value={published} label="Published tracks" to="/music" /></section>

    <section><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-medium text-primary">Create and manage</p><h2 className="mt-1 text-2xl font-semibold">Quick actions</h2></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><QuickAction to="/music/upload" icon={Music2} title="Upload music" /><QuickAction to="/playlists" icon={ListMusic} title="Create playlist" /><QuickAction to="/merch" icon={ShoppingBag} title="Add merch item" /><QuickAction to="/profile" icon={UserRound} title="Update profile" /></div></section>

    <section className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-primary">Audience pulse</p><h2 className="mt-1 text-2xl font-semibold">Recent activity</h2></div><Button asChild variant="ghost" size="sm"><Link to="/activity">View all</Link></Button></div><div className="mt-5 space-y-1">{activity.slice(0, 6).map((item) => <div key={item.id} className="flex items-start justify-between gap-4 border-b border-border/60 py-3 last:border-0"><div><p className="text-sm font-medium">{item.event_type === "link_opened" ? "Playlist opened" : "Track played"}</p><p className="text-xs text-muted-foreground">{item.tracks?.title ? `${item.tracks.title} • ` : ""}{item.playlists?.title || "Shared playlist"}</p></div><time className="shrink-0 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</time></div>)}{!activity.length && <p className="py-8 text-center text-sm text-muted-foreground">Share a playlist to begin seeing audience activity.</p>}</div></CardContent></Card>
      <div className="space-y-6"><Card><CardContent className="p-6"><p className="text-sm font-medium text-primary">Top shared experience</p><h2 className="mt-2 text-xl font-semibold">{topPlaylist?.title || "No activity yet"}</h2><p className="mt-2 text-sm text-muted-foreground">{topPlaylist ? `${topPlaylist.total} recorded opens and plays` : "Your most active playlist will appear here."}</p><Button asChild variant="outline" className="mt-5"><Link to="/playlists">Manage playlists</Link></Button></CardContent></Card><Card><CardContent className="p-6"><p className="text-sm font-medium text-primary">Connection follow-up</p><h2 className="mt-2 text-2xl font-semibold">{newConnections} new</h2><p className="mt-2 text-sm text-muted-foreground">Organize listener requests, private notes, categories, and follow-ups.</p><Button asChild variant="outline" className="mt-5"><Link to="/connections">Open connections</Link></Button></CardContent></Card></div>
    </section>

    {setupComplete ? <section className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15"><Check className="h-5 w-5 text-primary" /></span><div><p className="font-semibold">Creator setup complete</p><p className="text-sm text-muted-foreground">All 5 essentials are ready. Keep your information current as you grow.</p></div></div><Button asChild variant="ghost"><Link to="/profile">Review profile</Link></Button></section> : <section className="rounded-3xl border border-primary/20 bg-card p-6 md:p-8"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-primary">Ready-to-share checklist</p><h2 className="mt-2 text-2xl font-semibold">{completed} of {tasks.length} essentials ready</h2></div><div className="text-3xl font-bold text-gradient-brand">{Math.round((completed / tasks.length) * 100)}%</div></div><div className="mt-7 grid gap-3 md:grid-cols-2">{tasks.map((task) => <Link key={task.title} to={task.to} className="flex gap-4 rounded-2xl border border-border bg-background/45 p-5 transition hover:border-primary/40"><div className="mt-0.5">{task.done ? <Check className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}</div><div><p className="font-medium">{task.title}</p><p className="mt-1 text-sm text-muted-foreground">{task.body}</p></div></Link>)}</div></section>}
  </div>;
}

function Metric({ icon: Icon, value, label, to }: { icon: typeof Eye; value: number; label: string; to: string }) { return <Link to={to}><Card className="h-full transition hover:border-primary/40"><CardContent className="flex items-center gap-4 p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"><Icon className="h-5 w-5 text-primary" /></span><div><p className="text-2xl font-semibold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div></CardContent></Card></Link>; }
function QuickAction({ to, icon: Icon, title }: { to: string; icon: typeof Music2; title: string }) { return <Link to={to} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted"><Icon className="h-5 w-5" /></span><span className="font-medium">{title}</span><Plus className="ml-auto h-4 w-4 text-muted-foreground" /></Link>; }
