import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileCheck2, Fingerprint, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { adminService, type AdminCreatorRecord } from "@/services/admin/adminService";

export const Route = createFileRoute("/_authenticated/admin_/rights-registry")({
  component: RightsRegistryRoute,
});

type TrackRow = {
  id: string;
  creator_id: string;
  title: string;
  primary_artist_name: string | null;
  rights_basis: string | null;
  rights_confirmed: boolean | null;
  rights_policy_version: string | null;
  rights_confirmed_at: string | null;
  created_at: string;
};

type FingerprintRow = {
  track_id: string;
  sha256: string;
  processor_version: string | null;
  created_at: string;
};

type RightsDocumentRow = {
  id: string;
  creator_id: string;
  track_id: string | null;
  document_type: string;
  review_status: string;
  original_filename: string;
  submitted_at: string;
  expires_at: string | null;
};

type CertificationRow = {
  creator_id: string;
  policy_version: string;
  default_rights_basis: string | null;
  certification_statement: boolean;
  certified_track_count: number;
  certified_at: string;
  revoked_at: string | null;
};

function RightsRegistryRoute() {
  return (
    <AdminPermissionGuard anyOf={["admin.rights.read", "admin.content.read"]}>
      <RightsRegistryPage />
    </AdminPermissionGuard>
  );
}

function RightsRegistryPage() {
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [fingerprints, setFingerprints] = useState<FingerprintRow[]>([]);
  const [documents, setDocuments] = useState<RightsDocumentRow[]>([]);
  const [certifications, setCertifications] = useState<CertificationRow[]>([]);
  const [creators, setCreators] = useState<AdminCreatorRecord[]>([]);
  const [search, setSearch] = useState("");
  const [rightsFilter, setRightsFilter] = useState<"all" | "confirmed" | "needs_review">("all");
  const [fingerprintFilter, setFingerprintFilter] = useState<"all" | "protected" | "pending">("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Generated Supabase types can lag newer rights tables while migrations are ahead of the type snapshot.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const database = supabase as any;
      const [creatorRows, trackResult, fingerprintResult, documentResult, certificationResult] = await Promise.all([
        adminService.listCreators(),
        database.from("tracks").select("id,creator_id,title,primary_artist_name,rights_basis,rights_confirmed,rights_policy_version,rights_confirmed_at,created_at").order("created_at", { ascending: false }),
        database.from("audio_fingerprints").select("track_id,sha256,processor_version,created_at"),
        database.from("creator_rights_documents").select("id,creator_id,track_id,document_type,review_status,original_filename,submitted_at,expires_at").order("submitted_at", { ascending: false }),
        database.from("creator_music_rights_certifications").select("creator_id,policy_version,default_rights_basis,certification_statement,certified_track_count,certified_at,revoked_at").order("certified_at", { ascending: false }),
      ]);
      const firstError = trackResult.error ?? fingerprintResult.error ?? documentResult.error ?? certificationResult.error;
      if (firstError) throw firstError;
      setCreators(creatorRows.filter((row) => row.roles.includes("creator")));
      setTracks((trackResult.data ?? []) as TrackRow[]);
      setFingerprints((fingerprintResult.data ?? []) as FingerprintRow[]);
      setDocuments((documentResult.data ?? []) as RightsDocumentRow[]);
      setCertifications((certificationResult.data ?? []) as CertificationRow[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load the rights registry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const creatorMap = useMemo(() => new Map(creators.map((creator) => [creator.user_id, creator])), [creators]);
  const fingerprintMap = useMemo(() => new Map(fingerprints.map((item) => [item.track_id, item])), [fingerprints]);
  const documentCountByTrack = useMemo(() => {
    const result = new Map<string, number>();
    documents.forEach((document) => {
      if (!document.track_id) return;
      result.set(document.track_id, (result.get(document.track_id) ?? 0) + 1);
    });
    return result;
  }, [documents]);
  const activeCertificationByCreator = useMemo(() => {
    const result = new Map<string, CertificationRow>();
    certifications.forEach((certification) => {
      if (certification.revoked_at || result.has(certification.creator_id)) return;
      result.set(certification.creator_id, certification);
    });
    return result;
  }, [certifications]);

  const filteredTracks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tracks.filter((track) => {
      const protectedTrack = fingerprintMap.has(track.id);
      if (rightsFilter === "confirmed" && !track.rights_confirmed) return false;
      if (rightsFilter === "needs_review" && track.rights_confirmed) return false;
      if (fingerprintFilter === "protected" && !protectedTrack) return false;
      if (fingerprintFilter === "pending" && protectedTrack) return false;
      if (!query) return true;
      const creator = creatorMap.get(track.creator_id);
      return [track.title, track.primary_artist_name, creator?.creator_name, creator?.display_name, creator?.email, track.rights_basis]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [tracks, search, rightsFilter, fingerprintFilter, fingerprintMap, creatorMap]);

  const confirmedCount = tracks.filter((track) => track.rights_confirmed).length;
  const pendingFingerprintCount = Math.max(tracks.length - fingerprints.length, 0);
  const pendingDocuments = documents.filter((document) => document.review_status === "pending").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/rights"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Rights Overview</Link>
        </Button>
        <div className="mt-3 flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /> Rights & Protection</div>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Rights Registry</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Read-only operational view of each music work's VYBE rights declaration, fingerprint status, creator certification context, and supporting-document count. These records document platform evidence and workflow status; they do not independently determine legal ownership.
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh"><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Music works" value={tracks.length} icon={FileCheck2} />
        <Metric label="Rights confirmed" value={confirmedCount} icon={ShieldCheck} />
        <Metric label="Fingerprint records" value={fingerprints.length} icon={Fingerprint} />
        <Metric label="Fingerprint pending" value={pendingFingerprintCount} icon={Fingerprint} />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[260px] flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Search registry</label>
              <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Song, artist, creator, email or rights basis" /></div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Rights</label>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={rightsFilter} onChange={(event) => setRightsFilter(event.target.value as typeof rightsFilter)}>
                <option value="all">All</option><option value="confirmed">Confirmed</option><option value="needs_review">Needs review</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Fingerprint</label>
              <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={fingerprintFilter} onChange={(event) => setFingerprintFilter(event.target.value as typeof fingerprintFilter)}>
                <option value="all">All</option><option value="protected">Fingerprint exists</option><option value="pending">Pending fingerprint</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead className="bg-muted/25 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-3 py-2">Creator</th><th className="px-3 py-2">Work</th><th className="px-3 py-2">Rights declaration</th><th className="px-3 py-2">Creator certification</th><th className="px-3 py-2">Documents</th><th className="px-3 py-2">Fingerprint</th><th className="px-3 py-2">VYBE received</th></tr>
              </thead>
              <tbody>
                {filteredTracks.map((track) => {
                  const creator = creatorMap.get(track.creator_id);
                  const fingerprint = fingerprintMap.get(track.id);
                  const certification = activeCertificationByCreator.get(track.creator_id);
                  return (
                    <tr key={track.id} className="border-t align-top hover:bg-muted/20">
                      <td className="px-3 py-3"><p className="font-medium">{creator?.creator_name || creator?.display_name || "Unknown creator"}</p><p className="text-xs text-muted-foreground">{creator?.email || track.creator_id}</p></td>
                      <td className="px-3 py-3"><p className="font-medium">{track.title}</p>{track.primary_artist_name ? <p className="text-xs text-muted-foreground">{track.primary_artist_name}</p> : null}</td>
                      <td className="px-3 py-3"><Badge variant={track.rights_confirmed ? "secondary" : "outline"}>{track.rights_confirmed ? track.rights_basis?.replaceAll("_", " ") || "confirmed" : "needs review"}</Badge>{track.rights_policy_version ? <p className="mt-1 text-xs text-muted-foreground">Policy {track.rights_policy_version}</p> : null}</td>
                      <td className="px-3 py-3">{certification ? <><Badge variant="outline">active</Badge><p className="mt-1 text-xs text-muted-foreground">{certification.default_rights_basis?.replaceAll("_", " ") || "basis not set"}</p></> : <Badge variant="outline">not found</Badge>}</td>
                      <td className="px-3 py-3"><Badge variant={documentCountByTrack.get(track.id) ? "secondary" : "outline"}>{documentCountByTrack.get(track.id) ?? 0} attached</Badge></td>
                      <td className="px-3 py-3">{fingerprint ? <><Badge variant="secondary">protected record</Badge><p className="mt-1 text-xs text-muted-foreground">{fingerprint.processor_version || "processor version not recorded"}</p></> : <Badge variant="outline">pending processor</Badge>}</td>
                      <td className="px-3 py-3 text-muted-foreground">{new Date(track.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
                {!loading && !filteredTracks.length ? <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No rights records match the current filters.</td></tr> : null}
              </tbody>
            </table>
          </div>
          {loading ? <p className="mt-4 text-sm text-muted-foreground">Loading rights registry…</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Rights-document review</h2><p className="mt-1 text-sm text-muted-foreground">Supporting rights documents already stored by creators. Review workflows can be expanded later without replacing this underlying evidence.</p></div><Badge variant={pendingDocuments ? "default" : "secondary"}>{pendingDocuments} pending</Badge></div>
          <div className="mt-4 space-y-2">
            {documents.slice(0, 12).map((document) => {
              const creator = creatorMap.get(document.creator_id);
              return <div key={document.id} className="flex flex-col justify-between gap-2 rounded-lg border p-3 sm:flex-row sm:items-center"><div><p className="font-medium">{document.original_filename}</p><p className="text-xs text-muted-foreground">{creator?.creator_name || creator?.display_name || document.creator_id} · {document.document_type.replaceAll("_", " ")} · submitted {new Date(document.submitted_at).toLocaleDateString()}</p></div><Badge variant={document.review_status === "pending" ? "default" : "outline"}>{document.review_status.replaceAll("_", " ")}</Badge></div>;
            })}
            {!documents.length && !loading ? <p className="text-sm text-muted-foreground">No creator rights documents are stored.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof ShieldCheck }) {
  return <Card><CardContent className="flex items-center gap-3 p-5"><Icon className="h-5 w-5 text-primary" /><div><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>;
}
