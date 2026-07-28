import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Copyright, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const statuses = ["received", "reviewing", "actioned", "rejected", "counter_notice"] as const;

function RightsReviewRoute() {
  return (
    <RoleGuard allow={["admin"]}>
      <RightsReviewPage />
    </RoleGuard>
  );
}

function RightsReviewPage() {
  const { user } = useUser();
  const [reports, setReports] = useState<CopyrightReport[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("copyright_reports")
      .select(
        "id,reporter_name,reporter_email,rights_owner_name,content_url,original_work_description,signature,status,internal_notes,created_at",
      )
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setReports(data ?? []);
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

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to administration
          </Link>
        </Button>
        <div className="mt-3 flex items-center gap-2 text-primary">
          <Copyright className="h-5 w-5" /> Rights administration
        </div>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Copyright reports</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Preserve every report and decision. A status update records workflow progress; it is
              not a legal determination of ownership or infringement.
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {loading ? <p className="text-muted-foreground">Loading reports…</p> : null}
      {!loading && reports.length === 0 ? (
        <Card>
          <CardContent className="p-7 text-sm text-muted-foreground">
            No copyright reports have been submitted.
          </CardContent>
        </Card>
      ) : null}
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} onSave={updateReport} />
      ))}
    </div>
  );
}

function ReportCard({
  report,
  onSave,
}: {
  report: CopyrightReport;
  onSave: (id: string, status: string, notes: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(report.status);
  const [notes, setNotes] = useState(report.internal_notes);
  const [saving, setSaving] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{report.rights_owner_name}</CardTitle>
          <Badge variant="secondary">{report.status.replace("_", " ")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Reporter:</span> {report.reporter_name}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span> {report.reporter_email}
          </p>
          <p>
            <span className="text-muted-foreground">Signature:</span> {report.signature}
          </p>
          <p>
            <span className="text-muted-foreground">Received:</span>{" "}
            {new Date(report.created_at).toLocaleString()}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={report.content_url} target="_blank" rel="noreferrer">
            Open reported VYBE content <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <div>
          <p className="text-sm font-medium">Claim description</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {report.original_work_description}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {value.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Private internal notes</Label>
            <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>
        <Button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSave(report.id, status, notes);
            setSaving(false);
          }}
        >
          {saving ? "Saving…" : "Save review record"}
        </Button>
      </CardContent>
    </Card>
  );
}
