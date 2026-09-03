import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Library, Package, RefreshCw, Search, Users, Video } from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminService, type AdminCreatorRecord } from "@/services/admin/adminService";

export const Route = createFileRoute("/_authenticated/admin_/creators")({
  component: AdminCreatorsRoute,
});

function AdminCreatorsRoute() {
  return (
    <AdminPermissionGuard anyOf={["admin.creator.read"]}>
      <AdminCreatorsPage />
    </AdminPermissionGuard>
  );
}

function AdminCreatorsPage() {
  const [records, setRecords] = useState<AdminCreatorRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const accounts = await adminService.listCreators(query);
      setRecords(accounts.filter((record) => record.roles.includes("creator")));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load creator operations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Back Office
          </Link>
        </Button>
        <div className="mt-3 flex items-center gap-2 text-primary">
          <Users className="h-5 w-5" /> Creator operations
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Creator directory</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Review creator roles, membership state, and catalog activity. Open a creator's content to see exactly what that account has uploaded before cleanup, classification, or rights processing.
        </p>
      </header>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void load(search);
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by creator name or email"
          />
        </div>
        <Button type="submit">Search</Button>
        <Button type="button" variant="outline" size="icon" aria-label="Refresh" onClick={() => void load(search)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </form>

      {loading ? <p className="text-sm text-muted-foreground">Loading accounts…</p> : null}
      {!loading && records.length === 0 ? (
        <Card><CardContent className="p-7 text-sm text-muted-foreground">No creators match this search.</CardContent></Card>
      ) : null}
      <div className="space-y-4">
        {records.map((record) => <CreatorRecordCard key={record.user_id} record={record} />)}
      </div>
    </div>
  );
}

function CreatorRecordCard({ record }: { record: AdminCreatorRecord }) {
  const totalItems = record.track_count + record.playlist_count + record.video_count + record.merch_count;
  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <p className="text-lg font-semibold">{record.creator_name || record.display_name || "Unnamed account"}</p>
            {record.creator_name && record.display_name && record.creator_name !== record.display_name ? <p className="text-xs text-muted-foreground">Account: {record.display_name}</p> : null}
            <p className="text-sm text-muted-foreground">{record.email || "No email available"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Joined {new Date(record.joined_at).toLocaleDateString()}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {record.roles.length ? record.roles.map((role) => <Badge key={role} variant={role === "admin" ? "default" : "secondary"}>{role}</Badge>) : <Badge variant="outline">role incomplete</Badge>}
            <Badge variant="outline">{record.plan_code.replaceAll("_", " ")} · {record.entitlement_status}</Badge>
            {record.focus_codes?.map((focus) => <Badge key={focus} variant="outline">{focus}</Badge>)}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CatalogMetric icon={Library} label="Songs" value={`${record.published_track_count}/${record.track_count}`} note="published / total" />
          <CatalogMetric icon={Library} label="Playlists" value={record.playlist_count} note="total" />
          <CatalogMetric icon={Video} label="Videos" value={record.video_count} note="total" />
          <CatalogMetric icon={Package} label="Merch" value={record.merch_count} note="items" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-sm text-muted-foreground">{totalItems ? `${totalItems} known creator item${totalItems === 1 ? "" : "s"}` : "No known creator content"}</p>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/content" search={{ creator: record.user_id }}>
              View creator content <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CatalogMetric({ icon: Icon, label, value, note }: { icon: typeof Library; label: string; value: string | number; note: string; }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3">
      <Icon className="h-4 w-4 text-primary" />
      <div><p className="font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label} · {note}</p></div>
    </div>
  );
}
