import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, LibraryBig, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { adminService, type AdminCreatorRecord } from "@/services/admin/adminService";

export const Route = createFileRoute("/_authenticated/admin_/content")({
  validateSearch: (search: Record<string, unknown>) => ({
    creator: typeof search.creator === "string" ? search.creator : undefined,
  }),
  component: AdminContentRoute,
});

type TrackInventoryRow = {
  id: string;
  creator_id: string;
  title: string;
  primary_artist_name: string | null;
  is_published: boolean;
  rights_confirmed: boolean | null;
  rights_basis: string | null;
  created_at: string;
};

type CreatorSummary = {
  creator: AdminCreatorRecord;
  totalItems: number;
};

function AdminContentRoute() {
  return (
    <AdminPermissionGuard anyOf={["admin.content.read", "admin.creator.read"]}>
      <AdminContentInventory />
    </AdminPermissionGuard>
  );
}

function AdminContentInventory() {
  const routeSearch = Route.useSearch();
  const [creators, setCreators] = useState<AdminCreatorRecord[]>([]);
  const [tracks, setTracks] = useState<TrackInventoryRow[]>([]);
  const [search, setSearch] = useState("");
  const [creatorFilter, setCreatorFilter] = useState(routeSearch.creator ?? "all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCreatorFilter(routeSearch.creator ?? "all");
  }, [routeSearch.creator]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [creatorRows, trackResult] = await Promise.all([
        adminService.listCreators(),
        supabase
          .from("tracks")
          .select(
            "id,creator_id,title,primary_artist_name,is_published,rights_confirmed,rights_basis,created_at",
          )
          .order("created_at", { ascending: false }),
      ]);
      if (trackResult.error) throw trackResult.error;
      setCreators(creatorRows.filter((row) => row.roles.includes("creator")));
      setTracks((trackResult.data ?? []) as TrackInventoryRow[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load creator content inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const creatorMap = useMemo(
    () => new Map(creators.map((creator) => [creator.user_id, creator])),
    [creators],
  );

  const creatorSummaries = useMemo<CreatorSummary[]>(
    () =>
      creators
        .map((creator) => ({
          creator,
          totalItems:
            creator.track_count + creator.playlist_count + creator.video_count + creator.merch_count,
        }))
        .sort((a, b) => b.totalItems - a.totalItems),
    [creators],
  );

  const creatorsWithContent = creatorSummaries.filter((item) => item.totalItems > 0).length;
  const creatorsWithoutContent = creatorSummaries.length - creatorsWithContent;
  const totalKnownItems = creatorSummaries.reduce((sum, item) => sum + item.totalItems, 0);
  const selectedCreator = creatorFilter === "all" ? null : creatorMap.get(creatorFilter) ?? null;

  const filteredTracks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tracks.filter((track) => {
      if (creatorFilter !== "all" && track.creator_id !== creatorFilter) return false;
      if (statusFilter === "published" && !track.is_published) return false;
      if (statusFilter === "draft" && track.is_published) return false;
      if (!query) return true;
      const creator = creatorMap.get(track.creator_id);
      const haystack = [
        track.title,
        track.primary_artist_name,
        creator?.creator_name,
        creator?.display_name,
        creator?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [tracks, search, creatorFilter, statusFilter, creatorMap]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Back Office
          </Link>
        </Button>
        <div className="mt-3 flex items-center gap-2 text-primary">
          <LibraryBig className="h-5 w-5" /> Content operations
        </div>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Creator Content Inventory</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Review what creator accounts currently have on VYBE before catalog cleanup and rights fingerprint backfill. This page is read-only.
            </p>
            {selectedCreator ? (
              <p className="mt-2 text-sm font-medium text-primary">
                Filtered to {selectedCreator.creator_name || selectedCreator.display_name || selectedCreator.email || "selected creator"}
              </p>
            ) : null}
          </div>
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Creators" value={creators.length} />
        <Metric label="Creators with content" value={creatorsWithContent} />
        <Metric label="Creators without content" value={creatorsWithoutContent} />
        <Metric label="Known creator items" value={totalKnownItems} />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[240px] flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Search music</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Song, artist, creator or email"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Creator</label>
              <select
                className="h-10 min-w-[220px] rounded-md border border-input bg-background px-3 text-sm"
                value={creatorFilter}
                onChange={(event) => setCreatorFilter(event.target.value)}
              >
                <option value="all">All creators</option>
                {creatorSummaries.map(({ creator, totalItems }) => (
                  <option key={creator.user_id} value={creator.user_id}>
                    {(creator.creator_name || creator.display_name || creator.email || "Unnamed creator") + ` (${totalItems})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Music status</label>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead className="bg-muted/25 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Creator</th>
                  <th className="px-3 py-2 font-medium">Song</th>
                  <th className="px-3 py-2 font-medium">Uploaded</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Rights</th>
                  <th className="px-3 py-2 font-medium">Fingerprint</th>
                </tr>
              </thead>
              <tbody>
                {filteredTracks.map((track) => {
                  const creator = creatorMap.get(track.creator_id);
                  return (
                    <tr key={track.id} className="border-t align-middle hover:bg-muted/20">
                      <td className="px-3 py-2">
                        <p className="font-medium">{creator?.creator_name || creator?.display_name || "Unknown creator"}</p>
                        <p className="text-xs text-muted-foreground">{creator?.email || track.creator_id}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium">{track.title}</p>
                        {track.primary_artist_name ? <p className="text-xs text-muted-foreground">{track.primary_artist_name}</p> : null}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{new Date(track.created_at).toLocaleDateString()}</td>
                      <td className="px-3 py-2">
                        <Badge variant={track.is_published ? "default" : "outline"}>{track.is_published ? "Published" : "Draft"}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={track.rights_confirmed ? "secondary" : "outline"}>
                          {track.rights_confirmed ? track.rights_basis?.replaceAll("_", " ") || "Certified" : "Needs review"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline">Pending processor</Badge>
                      </td>
                    </tr>
                  );
                })}
                {!loading && !filteredTracks.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No music matches the current filters.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {loading ? <p className="mt-4 text-sm text-muted-foreground">Loading content inventory…</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold">Creator catalog summary</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use this summary to identify accounts with content before deciding which test accounts or uploads should be cleaned up.</p>
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead className="bg-muted/25 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-3 py-2">Creator</th><th className="px-3 py-2">Songs</th><th className="px-3 py-2">Playlists</th><th className="px-3 py-2">Videos</th><th className="px-3 py-2">Merch</th><th className="px-3 py-2">Total</th><th className="px-3 py-2">Action</th></tr>
              </thead>
              <tbody>
                {creatorSummaries.map(({ creator, totalItems }) => (
                  <tr key={creator.user_id} className="border-t hover:bg-muted/20">
                    <td className="px-3 py-2"><p className="font-medium">{creator.creator_name || creator.display_name || "Unnamed creator"}</p><p className="text-xs text-muted-foreground">{creator.email || "No email"}</p></td>
                    <td className="px-3 py-2">{creator.published_track_count}/{creator.track_count}</td>
                    <td className="px-3 py-2">{creator.playlist_count}</td>
                    <td className="px-3 py-2">{creator.video_count}</td>
                    <td className="px-3 py-2">{creator.merch_count}</td>
                    <td className="px-3 py-2 font-semibold">{totalItems}</td>
                    <td className="px-3 py-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/admin/content" search={{ creator: creator.user_id }}>View content</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
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
