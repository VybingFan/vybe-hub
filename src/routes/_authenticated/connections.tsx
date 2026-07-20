import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Mail, MessageCircle, Search, Star, UserRound } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMyConnections, useUpdateConnection } from "@/hooks/useConnections";
import { useUser } from "@/hooks/useUser";
import type { ListenerConnection } from "@/services/connections/connectionService";

export const Route = createFileRoute("/_authenticated/connections")({ component: () => <RoleGuard allow={["creator", "admin"]}><ConnectionsPage /></RoleGuard> });

const categories = [
  ["supporter", "Fan / supporter"], ["superfan", "Superfan"], ["collaborator", "Collaborator"],
  ["business", "Business"], ["venue", "Venue"], ["media", "Media / press"],
  ["merch_interest", "Merch interest"], ["event_interest", "Event interest"], ["other", "Other"],
] as const;
const statuses = [["new", "New"], ["follow_up", "Follow up"], ["contacted", "Contacted"], ["archived", "Archived"]] as const;

function ConnectionsPage() {
  const { user } = useUser();
  const { data: connections = [] } = useMyConnections(user?.id);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const visible = useMemo(() => connections.filter((item) => {
    const haystack = [item.display_name, item.email, item.social_handle, item.playlists?.title, item.tags.join(" ")].join(" ").toLowerCase();
    return haystack.includes(search.toLowerCase()) && (status === "all" || item.status === status) && (category === "all" || item.category === category);
  }), [connections, search, status, category]);
  const newCount = connections.filter((item) => item.status === "new").length;
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header><p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Opt-in audience</p><h1 className="mt-2 text-4xl font-semibold">Listener connections</h1><p className="mt-3 max-w-3xl text-muted-foreground">Organize people who voluntarily shared their details after visiting your playlists. Categories, tags, and notes are private to your creator account.</p></header>
      <div className="grid gap-4 sm:grid-cols-3"><Metric value={connections.length} label="Total connections" /><Metric value={newCount} label="New requests" /><Metric value={connections.filter((item) => item.is_favorite).length} label="Favorites" /></div>
      <div className="grid gap-3 md:grid-cols-[1fr_180px_200px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, social, playlist, or tag" className="pl-9" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
      <p className="text-sm text-muted-foreground">Showing {visible.length} of {connections.length}</p>
      <div className="grid gap-4 lg:grid-cols-2">{visible.map((connection) => <ConnectionCard key={connection.id} connection={connection} creatorId={user?.id} />)}{!visible.length && <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground lg:col-span-2">No connections match these filters.</p>}</div>
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) { return <Card><CardContent className="p-6"><p className="text-3xl font-semibold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></CardContent></Card>; }

function ConnectionCard({ connection, creatorId }: { connection: ListenerConnection; creatorId?: string }) {
  const update = useUpdateConnection(creatorId);
  const [favorite, setFavorite] = useState(connection.is_favorite);
  const [category, setCategory] = useState(connection.category);
  const [status, setStatus] = useState(connection.status);
  const [tags, setTags] = useState(connection.tags.join(", "));
  const [notes, setNotes] = useState(connection.private_notes || "");
  const save = async () => {
    try {
      await update.mutateAsync({ id: connection.id, patch: { status, is_favorite: favorite, category, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 10), private_notes: notes.trim() || null } });
      toast.success("Connection saved");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save connection"); }
  };
  return <Card className={favorite ? "border-primary/40" : ""}><CardContent className="space-y-5 p-5">
    <div className="flex items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 font-semibold"><UserRound className="h-4 w-4" />{connection.display_name || "Listener"}</h2><p className="mt-1 text-sm text-muted-foreground">via {connection.playlists?.title || "shared playlist"}</p>{connection.playlists?.slug && <a href={`/playlist/${connection.playlists.slug}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">View source playlist <ExternalLink className="h-3 w-3" /></a>}</div><Button size="icon" variant="ghost" onClick={() => setFavorite((value) => !value)} aria-label="Favorite connection"><Star className={`h-5 w-5 ${favorite ? "fill-amber-400 text-amber-400" : ""}`} /></Button></div>
    <div className="space-y-2 text-sm"><a className="flex items-center gap-2 text-primary hover:underline" href={`mailto:${connection.email}`}><Mail className="h-4 w-4" />{connection.email}</a>{connection.social_handle && <p className="flex items-center gap-2"><MessageCircle className="h-4 w-4" />{connection.social_handle}</p>}{connection.message && <p className="rounded-xl bg-muted p-3 text-muted-foreground">“{connection.message}”</p>}<Badge variant="outline">{connection.consent_updates ? "Future updates requested" : "Direct response only"}</Badge></div>
    <div className="grid gap-3 sm:grid-cols-2"><div><Label>Category</Label><Select value={category} onValueChange={(value) => setCategory(value as ListenerConnection["category"])}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{categories.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value as ListenerConnection["status"])}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{statuses.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div></div>
    <div><Label>Tags</Label><Input value={tags} onChange={(event) => setTags(event.target.value)} className="mt-1" placeholder="local, release invite, VIP" /><p className="mt-1 text-xs text-muted-foreground">Separate up to 10 tags with commas.</p></div>
    <div><Label>Private notes</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} className="mt-1" placeholder="Add private follow-up details" /></div>
    <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Received {new Date(connection.created_at).toLocaleString()}</p><Button onClick={save} disabled={update.isPending}>{update.isPending ? "Saving…" : "Save connection"}</Button></div>
  </CardContent></Card>;
}
