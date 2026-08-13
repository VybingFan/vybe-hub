import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MEMBERSHIP_AUDIT_CONTROLS,
  type AuditControlStatus,
} from "@/features/membership/membershipAuditCatalog";
import {
  membershipAuditService,
  type MembershipAuditFinding,
} from "@/services/membership/membershipAuditService";
import {
  CREATOR_CATALOG_SORTS,
  PLAYBACK_ENTRY_POINTS,
  PLAYBACK_SAFETY_RULES,
} from "@/features/music/playbackContinuationCatalog";

export const Route = createFileRoute("/_authenticated/admin_/membership-audit")({
  component: () => (
    <AdminPermissionGuard anyOf={["admin.finance.read", "admin.creator.membership"]}>
      <MembershipPrivacyAudit />
    </AdminPermissionGuard>
  ),
});

function MembershipPrivacyAudit() {
  const audit = useQuery({
    queryKey: ["membership-privacy-audit-v24-41h"],
    queryFn: membershipAuditService.run,
  });
  const findings = audit.data ?? [];
  const attention = findings.filter((item) => item.severity !== "pass");

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          Membership governance
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Membership, privacy & access audit
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Read-only checks across plan assignments, protected sharing,
              continuity, public display, commerce rights, payout readiness,
              and sensitive-table RLS. Running this audit changes nothing.
            </p>
          </div>
          <Button onClick={() => void audit.refetch()} disabled={audit.isFetching}>
            <RefreshCw className={"mr-2 h-4 w-4 " + (audit.isFetching ? "animate-spin" : "")} />
            Run audit
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Database checks" value={findings.length} />
        <Metric label="Needs review" value={attention.length} />
        <Metric
          label="Control areas"
          value={MEMBERSHIP_AUDIT_CONTROLS.length}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Live database findings</h2>
        {audit.isError ? (
          <Card className="border-destructive/40">
            <CardContent className="p-5 text-sm text-destructive">
              {audit.error instanceof Error ? audit.error.message : "Audit could not run."}
            </CardContent>
          </Card>
        ) : null}
        <div className="space-y-3">
          {findings.map((finding) => (
            <Finding key={finding.code} finding={finding} />
          ))}
          {!audit.isLoading && !findings.length && !audit.isError ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No audit rows were returned.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Implementation control matrix</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {MEMBERSHIP_AUDIT_CONTROLS.map((item) => (
            <Card key={item.domain + item.control}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {item.domain}
                    </p>
                    <p className="mt-1 font-semibold">{item.control}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-sm text-muted-foreground">{item.evidence}</p>
                <p className="text-sm"><strong>Next:</strong> {item.nextAction}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Playback continuation review</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Proposed deterministic behavior for Top 5, playlists, creator
            catalogs, similar creators, and VYBE charts. This audit displays the
            rules but does not activate an algorithm.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {PLAYBACK_ENTRY_POINTS.map((item) => (
            <Card key={item.entry}>
              <CardContent className="space-y-3 p-5">
                <p className="font-semibold">{item.entry}</p>
                <Rule label="Starts with" value={item.firstQueue} />
                <Rule label="Then" value={item.sameCreatorNext} />
                <Rule label="Discovery boundary" value={item.discoveryBoundary} />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="grid gap-6 p-5 md:grid-cols-2">
            <div>
              <p className="font-semibold">Same-creator ordering</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {CREATOR_CATALOG_SORTS.map((sort) => (
                  <Badge key={sort} variant="outline">{sort}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold">Required safety behavior</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {PLAYBACK_SAFETY_RULES.map((rule) => (
                  <li key={rule}>• {rule}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm">{value}</p>
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

function Finding({ finding }: { finding: MembershipAuditFinding }) {
  const passing = finding.severity === "pass";
  return (
    <Card className={finding.severity === "warning" ? "border-amber-500/40" : ""}>
      <CardContent className="flex gap-3 p-5">
        {passing ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{finding.summary}</p>
            <Badge variant={passing ? "secondary" : "outline"}>
              {finding.affected_count} affected
            </Badge>
            <Badge variant="outline">{finding.domain}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {finding.recommendation}
          </p>
          <code className="mt-2 block text-xs text-muted-foreground">{finding.code}</code>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: AuditControlStatus }) {
  return (
    <Badge variant={status === "enforced" ? "default" : "outline"}>
      {status === "enforced" ? "Enforced" : status === "partial" ? "Review" : "Planned"}
    </Badge>
  );
}
