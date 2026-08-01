import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Database, Gamepad2, ShieldCheck } from "lucide-react";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AVAILABLE_PLAY_GENRES,
  DAILY_PLAY_ITEMS,
  PLAY_GENRES,
  PLAY_RELEASE_CHECKS,
  PLAY_ROADMAP_ITEMS,
} from "@/features/play/content";

export const Route = createFileRoute("/_authenticated/admin_/play")({
  component: PlayAdministrationPage,
});

function PlayAdministrationPage() {
  return (
    <AdminPermissionGuard anyOf={["admin.content.read"]}>
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <Button asChild variant="ghost" className="-ml-3 mb-4">
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to administration
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" /> Owner and administrator only
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Play release board
          </h1>
          <p className="mt-2 max-w-3xl leading-7 text-muted-foreground">
            Review what is live, what is waiting for approved content, and which safeguards must
            pass before a Play experience can be published.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-3">
          <SummaryCard
            label="Daily experiences"
            value={DAILY_PLAY_ITEMS.length}
            note="Available and demonstration items"
          />
          <SummaryCard
            label="Active genre sets"
            value={AVAILABLE_PLAY_GENRES.length}
            note={`of ${PLAY_GENRES.length} planned choices`}
          />
          <SummaryCard
            label="Knowledge status"
            value="Pilot"
            note="Production import waits for approved architecture"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" /> Daily VYBE inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {DAILY_PLAY_ITEMS.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{item.title}</p>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-primary">
                  {item.cadence}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Release gates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {PLAY_RELEASE_CHECKS.map((check) => (
                <div key={check.label} className="rounded-2xl border border-border p-4">
                  <p className="font-semibold">{check.label}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{check.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" /> Build sequence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {PLAY_ROADMAP_ITEMS.map((item) => (
                <div key={item.name} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{item.name}</p>
                    <Badge variant="secondary">{item.stage}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.note}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="rounded-3xl border border-primary/25 bg-primary/5 p-6">
          <p className="font-semibold">Foundation boundary</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This release board is intentionally read-only. Persistent editing, scheduling, and
            publishing will be connected after the Knowledge Engine production record template is
            approved, preventing temporary fields from becoming conflicting sources of truth.
          </p>
        </div>
      </div>
    </AdminPermissionGuard>
  );
}

function SummaryCard({
  label,
  value,
  note,
}: {
  label: string;
  value: number | string;
  note: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
