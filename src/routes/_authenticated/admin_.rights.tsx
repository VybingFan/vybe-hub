import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Copyright,
  ExternalLink,
  FileCheck2,
  Fingerprint,
  LibraryBig,
  RefreshCw,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/_authenticated/admin_/rights")({
  component: RightsReviewRoute,
});

type CopyrightReport = {
  id: string;
  reporter_name: string;
  reporter_email: string;
  rights_owner_name: string;
  content_url: string;
  original_work_description: string;
  signature: string;
  status: string;
  internal_notes: string;
  created_at: string;
};

type ProcessingJob = {
  id: string;
  track_id: string;
  status: string;
  attempt_count: number;
  processor_version: string | null;
  queued_at: string;
  completed_at: string | null;
  last_error: string | null;
  tracks: { title: string; primary_artist_name: string } | null;
};

type ModerationCase = {
  id: string;
  case_type: string;
  severity: string;
  status: string;
  risk_score: number | null;
  reason_codes: string[];
  summary: string;
  created_at: string;
  tracks: { title: string; primary_artist_name: string } | null;
};

type RightsStats = {
  fingerprints: number;
  matchCandidates: number;
  pendingDocuments: number;
};

const statuses = ["received", "reviewing", "actioned", "rejected", "counter_notice"] as const;

function RightsReviewRoute() {
  return (
    <AdminPermissionGuard anyOf={["admin.rights.read", "admin.content.read"]}>
      <RightsReviewPage />
    </AdminPermissionGuard>
  );
}

function RightsReviewPage() {
  const { user } = useUser();
  const [reports, setReports] = useState<CopyrightReport[]>([]);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [stats, setStats] = useState<RightsStats>({ fingerprints: 0, matchCandidates: 0, pendingDocuments: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const database = supabase;
    const [reportResult, jobResult, caseResult, fingerprintResult, matchResult, documentResult] = await Promise.all([
      database
        .from("copyright_reports")
        .select("id,reporter_name,reporter_email,rights_owner_name,content_url,original_work_description,signature,status,internal_notes,created_at")
        .order("created_at", { ascending: false }),
      database
        .from("audio_processing_jobs")
        .select("id,track_id,status,attempt_count,processor_version,queued_at,completed_at,last_error,tracks(title,primary_artist_name)")
        .order("queued_at", { ascending: false })
        .limit(100),
      database
        .from("moderation_cases")
        .select("id,case_type,severity,status,risk_score,reason_codes,summary,created_at,tracks(title,primary_artist_name)")
        .order("created_at", { ascending: false })
        .limit(100),
      database.from("audio_fingerprints").select("id", { count: "exact", head: true }),
      database.from("audio_match_candidates").select("id", { count: "exact", head: true }),
      database.from("creator_rights_documents").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
    ]);

    const firstError =
      reportResult.error ??
      jobResult.error ??
      caseResult.error ??
      fingerprintResult.error ??
      matchResult.error ??
      documentResult.error;

    if (firstError) toast.error(firstError.message);
    setReports((reportResult.data ?? []) as CopyrightReport[]);
    setJobs((jobResult.data ?? []) as ProcessingJob[]);
    setCases((caseResult.data ?? []) as ModerationCase[]);
    setStats({
      fingerprints: fingerprintResult.count ?? 0,
      matchCandidates: matchResult.count ?? 0,
      pendingDocuments: documentResult.count ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateReport(id: string, status: string, internalNotes: string) {
    const { error } = await supabase
      .from("copyright_reports")
      .update({
        status,
        internal_notes: internalNotes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
      })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Rights report updated");
      await load();
    }
  }

  const jobCounts = useMemo(
    () =>
      jobs.reduce<Record<string, number>>((result, job) => {
        result[job.status] = (result[job.status] ?? 0) + 1;
        return result;
      }, {}),
    [jobs],
  );
  const openCases = cases.filter((item) => !["resolved", "closed", "dismissed"].includes(item.status)).length;
  const openCopyright = reports.filter((report) => !["actioned", "rejected"].includes(report.status)).length;

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to Back Office
          </Link>
        </Button>
        <div className="mt-3 flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" /> Rights & Protection
        </div>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Rights & Protection Operations</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              One operational home for VYBE rights records, audio protection, review signals, commerce rights, and formal copyright matters. Automated matches remain review signals—not legal determinations of ownership or infringement.
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Protected fingerprints" value={stats.fingerprints} icon={Fingerprint} />
        <Metric label="Match candidates" value={stats.matchCandidates} icon={AlertTriangle} />
        <Metric label="Open review cases" value={openCases} icon={ShieldCheck} />
        <Metric label="Open copyright reports" value={openCopyright} icon={Copyright} />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RightsModule
          icon={LibraryBig}
          title="Rights Registry"
          description="Review protected works, creator declarations, rights documents, and existing catalog context."
          status={`${stats.fingerprints} fingerprint records`}
          to="/admin/content"
          action="Open catalog registry"
        />
        <RightsModule
          icon={Fingerprint}
          title="Fingerprints & Matches"
          description="Monitor processing jobs and match candidates. The processor itself is activated separately after controlled testing."
          status={`${jobCounts.queued ?? 0} queued · ${stats.matchCandidates} matches`}
          tab="processing"
          action="Review processing"
        />
        <RightsModule
          icon={FileCheck2}
          title="Commerce Rights Review"
          description="Preserve the existing specialized review of creator rights declarations before music products can be activated for sale."
          status="Existing workflow"
          to="/admin/commerce-rights"
          action="Open commerce review"
        />
        <RightsModule
          icon={Copyright}
          title="DMCA & Copyright Operations"
          description="Formal copyright cases, takedowns, counter-notices, strikes, restoration, legal holds, and rights audits."
          status={`${openCopyright} open reports`}
          to="/admin/copyright"
          action="Open copyright operations"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rights system roadmap</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <RoadmapItem icon={UsersRound} title="Permissions & Collaborations" description="Planned: document authorized duplicates, collaborator roles, licenses, and creator-to-creator permission scope without treating every fingerprint match as infringement." />
          <RoadmapItem icon={FileCheck2} title="Copyright Registration" description="Planned: creator priority lists, readiness records, document preparation, and optional VYBE-assisted federal registration workflow." />
          <RoadmapItem icon={ShieldCheck} title="Enhanced Rights Record" description={`Current rights-document review queue: ${stats.pendingDocuments}. Future Rights Vault work will build from the existing rights-document foundation.`} />
        </CardContent>
      </Card>

      {loading ? <p className="text-muted-foreground">Loading rights records…</p> : null}
      {!loading ? (
        <Tabs defaultValue="processing">
          <TabsList className="grid h-auto w-full grid-cols-3">
            <TabsTrigger value="processing">Fingerprint processing</TabsTrigger>
            <TabsTrigger value="cases">Rights review cases</TabsTrigger>
            <TabsTrigger value="reports">Incoming copyright reports</TabsTrigger>
          </TabsList>
          <TabsContent value="processing" className="mt-6 space-y-5">
            <ProcessingOverview jobs={jobs} />
          </TabsContent>
          <TabsContent value="cases" className="mt-6 space-y-5">
            {cases.length ? cases.map((item) => <CaseCard key={item.id} item={item} />) : <EmptyState text="No automated or manual review cases are open." />}
          </TabsContent>
          <TabsContent value="reports" className="mt-6 space-y-5">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                <p className="text-sm text-muted-foreground">This tab preserves the existing intake review. Full legal operations remain in the dedicated DMCA & Copyright workspace.</p>
                <Button asChild size="sm" variant="outline"><Link to="/admin/copyright">Open legal operations <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              </CardContent>
            </Card>
            {reports.length ? reports.map((report) => <ReportCard key={report.id} report={report} onSave={updateReport} />) : <EmptyState text="No copyright reports have been submitted." />}
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}

function RightsModule({ icon: Icon, title, description, status, to, tab, action }: { icon: typeof ShieldCheck; title: string; description: string; status: string; to?: "/admin/content" | "/admin/commerce-rights" | "/admin/copyright"; tab?: "processing"; action: string; }) {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3"><span className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></span><Badge variant="secondary">{status}</Badge></div>
        <p className="mt-4 font-semibold">{title}</p>
        <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
        {to ? (
          <Button asChild variant="outline" className="mt-5"><Link to={to}>{action} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        ) : (
          <Button variant="outline" className="mt-5" onClick={() => document.querySelector(`[data-value=\"${tab}\"]`)?.dispatchEvent(new MouseEvent("click", { bubbles: true }))}>{action} <ArrowRight className="ml-2 h-4 w-4" /></Button>
        )}
      </CardContent>
    </Card>
  );
}

function RoadmapItem({ icon: Icon, title, description }: { icon: typeof ShieldCheck; title: string; description: string; }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><p className="font-medium">{title}</p><Badge variant="outline" className="ml-auto">Planned</Badge></div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function ProcessingOverview({ jobs }: { jobs: ProcessingJob[] }) {
  const counts = jobs.reduce<Record<string, number>>((result, job) => {
    result[job.status] = (result[job.status] ?? 0) + 1;
    return result;
  }, {});
  const activeProcessor = jobs.some((job) => job.processor_version && ["processing", "completed", "flagged"].includes(job.status));

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Queued" value={counts.queued ?? 0} icon={Activity} />
        <Metric label="Completed" value={counts.completed ?? 0} icon={CheckCircle2} />
        <Metric label="Flagged" value={counts.flagged ?? 0} icon={AlertTriangle} />
        <Metric label="Failed" value={counts.failed ?? 0} icon={ShieldCheck} />
      </div>
      {!activeProcessor ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-5 text-sm leading-6">
            <p className="font-medium">Native rights processor not yet observed</p>
            <p className="text-muted-foreground">Uploads can queue safely, but FFmpeg and Chromaprint results will appear only after the separate private processor is deployed and the controlled test sequence is approved.</p>
          </CardContent>
        </Card>
      ) : null}
      {jobs.length ? jobs.map((job) => (
        <Card key={job.id}>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium">{job.tracks?.title ?? "Unavailable track"}{job.tracks?.primary_artist_name ? ` · ${job.tracks.primary_artist_name}` : ""}</p>
              <p className="mt-1 text-xs text-muted-foreground">Queued {new Date(job.queued_at).toLocaleString()} · Attempt {job.attempt_count}{job.processor_version ? ` · ${job.processor_version}` : ""}</p>
              {job.last_error ? <p className="mt-2 max-w-2xl text-sm text-destructive">{job.last_error}</p> : null}
            </div>
            <StatusBadge status={job.status} />
          </CardContent>
        </Card>
      )) : <EmptyState text="No audio-processing jobs exist yet." />}
    </>
  );
}

function CaseCard({ item }: { item: ModerationCase }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">{item.tracks?.title ?? "Rights review"} {item.tracks?.primary_artist_name ? `· ${item.tracks.primary_artist_name}` : ""}</CardTitle>
          <div className="flex gap-2"><Badge variant="outline">{item.severity}</Badge><StatusBadge status={item.status} /></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{item.summary || "No summary has been entered."}</p>
        <p className="text-muted-foreground">{item.case_type.replaceAll("_", " ")}{item.risk_score === null ? "" : ` · Risk signal ${Math.round(item.risk_score * 100)}%`} · {new Date(item.created_at).toLocaleString()}</p>
        {item.reason_codes.length ? <div className="flex flex-wrap gap-2">{item.reason_codes.map((reason) => <Badge key={reason} variant="secondary">{reason.replaceAll("_", " ")}</Badge>)}</div> : null}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Activity; }) {
  return (
    <Card><CardContent className="flex items-center gap-3 p-5"><Icon className="h-5 w-5 text-primary" /><div><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "failed" ? "destructive" : status === "flagged" ? "outline" : "secondary";
  return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
}

function EmptyState({ text }: { text: string }) {
  return <Card><CardContent className="p-7 text-sm text-muted-foreground">{text}</CardContent></Card>;
}

function ReportCard({ report, onSave }: { report: CopyrightReport; onSave: (id: string, status: string, notes: string) => Promise<void>; }) {
  const [status, setStatus] = useState(report.status);
  const [notes, setNotes] = useState(report.internal_notes);
  const [saving, setSaving] = useState(false);

  return (
    <Card>
      <CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>{report.rights_owner_name}</CardTitle><Badge variant="secondary">{report.status.replace("_", " ")}</Badge></div></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">Reporter:</span> {report.reporter_name}</p>
          <p><span className="text-muted-foreground">Email:</span> {report.reporter_email}</p>
          <p><span className="text-muted-foreground">Signature:</span> {report.signature}</p>
          <p><span className="text-muted-foreground">Received:</span> {new Date(report.created_at).toLocaleString()}</p>
        </div>
        <Button asChild variant="outline" size="sm"><a href={report.content_url} target="_blank" rel="noreferrer">Open reported VYBE content <ExternalLink className="ml-2 h-4 w-4" /></a></Button>
        <div><p className="text-sm font-medium">Claim description</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{report.original_work_description}</p></div>
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div className="space-y-2"><Label>Status</Label><select value={status} onChange={(event) => setStatus(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{statuses.map((value) => <option key={value} value={value}>{value.replace("_", " ")}</option>)}</select></div>
          <div className="space-y-2"><Label>Private internal notes</Label><Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
        </div>
        <Button disabled={saving} onClick={async () => { setSaving(true); await onSave(report.id, status, notes); setSaving(false); }}>{saving ? "Saving…" : "Save review record"}</Button>
      </CardContent>
    </Card>
  );
}
