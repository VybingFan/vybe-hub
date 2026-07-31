import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  businessAdminService,
  type BusinessRecord,
} from "@/services/business/businessAdminService";
import {
  businessPilotService,
  pilotStages,
  type PilotActivity,
  type PilotDashboard,
  type PilotRecord,
  type ProgressStatus,
} from "@/services/business/businessPilotService";

export const Route = createFileRoute("/_authenticated/admin_/business-pilot")({
  component: BusinessPilotPage,
});

const progressOptions: ProgressStatus[] = ["not_started", "in_progress", "complete", "blocked"];

function BusinessPilotPage() {
  const [dashboard, setDashboard] = useState<PilotDashboard | null>(null);
  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activities, setActivities] = useState<PilotActivity[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextDashboard, nextBusinesses] = await Promise.all([
        businessPilotService.dashboard(),
        businessAdminService.listBusinesses(),
      ]);
      setDashboard(nextDashboard);
      setBusinesses(nextBusinesses);
      setSelectedId((current) =>
        current && nextDashboard.records.some((record) => record.id === current)
          ? current
          : (nextDashboard.records[0]?.id ?? null),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load business pilot");
    }
  }, []);

  useEffect(() => void load(), [load]);

  const selected = dashboard?.records.find((record) => record.id === selectedId) ?? null;
  useEffect(() => {
    if (!selectedId) {
      setActivities([]);
      return;
    }
    void businessPilotService
      .activities(selectedId)
      .then(setActivities)
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Could not load activity history"),
      );
  }, [selectedId, dashboard]);

  const availableBusinesses = useMemo(() => {
    const activeIds = new Set(dashboard?.records.map((record) => record.business_id));
    return businesses.filter((business) => !activeIds.has(business.id));
  }, [businesses, dashboard]);

  async function startPilot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await businessPilotService.start(String(form.get("businessId")));
      toast.success("Business added to the pilot");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add pilot business");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RoleGuard allow={["admin"]}>
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <Button asChild variant="ghost" className="-ml-3 mb-4">
            <Link to="/admin/businesses">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Business Operations
            </Link>
          </Button>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <BriefcaseBusiness className="h-5 w-5" /> Controlled 3-5 business pilot
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                Business Pilot Operations
              </h1>
              <p className="mt-2 max-w-3xl leading-7 text-muted-foreground">
                Keep ownership, next actions, onboarding, campaign readiness, blockers, decisions,
                and outcomes in one audited operating view.
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {dashboard ? <PilotMetrics dashboard={dashboard} /> : null}

        <Card>
          <CardHeader>
            <CardTitle>Add an existing business to the pilot</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={startPilot}>
              <select
                name="businessId"
                required
                defaultValue=""
                className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Choose a business record
                </option>
                {availableBusinesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.public_name} · {business.verification_status}
                  </option>
                ))}
              </select>
              <Button disabled={saving || availableBusinesses.length === 0}>
                {saving ? "Adding…" : "Add to pilot"}
              </Button>
            </form>
            {availableBusinesses.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Create another business record in Business Operations to expand the pilot.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.5fr]">
          <Card>
            <CardHeader>
              <CardTitle>Pilot pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard?.records.length ? (
                dashboard.records.map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => setSelectedId(record.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedId === record.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold">{record.business_name}</p>
                      <Badge variant="outline">{label(record.stage)}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {record.next_action || "Next action not assigned"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary">{record.document_completion_percent}% docs</Badge>
                      <Badge variant="secondary">{record.campaign_readiness_score}% ready</Badge>
                      {isOverdue(record.follow_up_at) ? (
                        <Badge variant="destructive">Follow-up overdue</Badge>
                      ) : null}
                    </div>
                  </button>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No businesses are in the pilot yet.
                </p>
              )}
            </CardContent>
          </Card>

          {selected ? (
            <PilotWorkspace
              key={`${selected.id}-${selected.updated_at}`}
              record={selected}
              activities={activities}
              onSaved={load}
            />
          ) : (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                Select or add a pilot business to open its operating workspace.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}

function PilotMetrics({ dashboard }: { dashboard: PilotDashboard }) {
  const metrics = [
    ["Pilot businesses", dashboard.pilot_count, "Target: 3-5 controlled partners"],
    ["Active workflow", dashboard.active_count, "Excludes paused, declined, completed"],
    ["Overdue follow-up", dashboard.overdue_count, "Also routed to Work Queue"],
    ["Blocked", dashboard.blocked_count, "Document the blocker and decision"],
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(([name, value, note]) => (
        <Card key={String(name)}>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{name}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PilotWorkspace({
  record,
  activities,
  onSaved,
}: {
  record: PilotRecord;
  activities: PilotActivity[];
  onSaved: () => Promise<void>;
}) {
  async function saveControls(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await businessPilotService.update(record.id, {
        stage: String(form.get("stage")) as PilotRecord["stage"],
        next_action: textOrNull(form, "nextAction"),
        follow_up_at: dateOrNull(form, "followUpAt"),
        qualification_status: String(form.get("qualificationStatus")) as ProgressStatus,
        onboarding_status: String(form.get("onboardingStatus")) as ProgressStatus,
        pilot_notes: textOrNull(form, "pilotNotes"),
        blockers: textOrNull(form, "blockers"),
        decisions: textOrNull(form, "decisions"),
        outcomes: textOrNull(form, "outcomes"),
        paused_declined_reason: textOrNull(form, "pausedDeclinedReason"),
      });
      toast.success("Pilot controls saved");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save pilot controls");
    }
  }

  async function addActivity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    try {
      await businessPilotService.addActivity({
        pilotId: record.id,
        businessId: record.business_id,
        activityType: String(form.get("activityType")),
        summary: String(form.get("summary")),
        nextAction: String(form.get("activityNextAction") || ""),
        followUpAt: String(form.get("activityFollowUpAt") || ""),
      });
      element.reset();
      toast.success("Activity added");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add activity");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{record.business_name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {record.contact_name || "Contact not named"} · {record.contact_email}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pilot owner</p>
              <p className="mt-1 font-medium">{record.assigned_name || "Unassigned"}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await businessPilotService.assignToMe(record.id);
                  toast.success("Pilot assigned to you");
                  await onSaved();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not assign pilot");
                }
              }}
            >
              Assign to me
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Score label="Partner documents" value={record.document_completion_percent} />
            <Score label="Campaign readiness" value={record.campaign_readiness_score} />
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Readiness uses verified business status, package assignment, approved campaign, approved
            creative, approved placement, and approved tracking plan. It is not a forecast.
          </p>
          <form className="space-y-4" onSubmit={saveControls}>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                name="stage"
                label="Pipeline stage"
                defaultValue={record.stage}
                options={pilotStages}
              />
              <Field
                name="followUpAt"
                label="Follow-up date"
                type="datetime-local"
                defaultValue={localDate(record.follow_up_at)}
              />
              <SelectField
                name="qualificationStatus"
                label="Qualification"
                defaultValue={record.qualification_status}
                options={progressOptions}
              />
              <SelectField
                name="onboardingStatus"
                label="Onboarding"
                defaultValue={record.onboarding_status}
                options={progressOptions}
              />
            </div>
            <TextField
              name="nextAction"
              label="Next action"
              defaultValue={record.next_action ?? ""}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="pilotNotes"
                label="Pilot notes"
                defaultValue={record.pilot_notes ?? ""}
              />
              <TextField name="blockers" label="Blockers" defaultValue={record.blockers ?? ""} />
              <TextField name="decisions" label="Decisions" defaultValue={record.decisions ?? ""} />
              <TextField
                name="outcomes"
                label="Outcomes / lessons"
                defaultValue={record.outcomes ?? ""}
              />
            </div>
            <TextField
              name="pausedDeclinedReason"
              label="Paused / declined reason"
              defaultValue={record.paused_declined_reason ?? ""}
            />
            <Button>Save pilot controls</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact and activity history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="space-y-4 rounded-2xl border p-4" onSubmit={addActivity}>
            <SelectField
              name="activityType"
              label="Activity"
              defaultValue="note"
              options={[
                "call",
                "email",
                "meeting",
                "note",
                "application",
                "qualification",
                "document",
                "campaign",
                "decision",
                "outcome",
                "follow_up",
              ]}
            />
            <TextField name="summary" label="What happened" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="activityNextAction" label="Next action" />
              <Field name="activityFollowUpAt" label="Follow-up" type="datetime-local" />
            </div>
            <Button variant="outline">Add activity</Button>
          </form>
          {activities.length ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="rounded-2xl border p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <Badge variant="outline">{label(activity.activity_type)}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.occurred_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-3 text-sm">{activity.summary}</p>
                  {activity.next_action ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Next: {activity.next_action}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Score({ label: name, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{name}</p>
        <p className="font-semibold">{value}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Field(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string },
) {
  const { label: name, ...inputProps } = props;
  return (
    <div className="space-y-2">
      <Label htmlFor={inputProps.name}>{name}</Label>
      <Input id={inputProps.name} {...inputProps} />
    </div>
  );
}

function TextField({
  label: name,
  defaultValue,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.name}>{name}</Label>
      <Textarea id={props.name} defaultValue={defaultValue ?? ""} {...props} />
    </div>
  );
}

function SelectField({
  label: name,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  options: readonly string[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.name}>{name}</Label>
      <select
        id={props.name}
        {...props}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {label(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function localDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function dateOrNull(form: FormData, name: string) {
  const value = String(form.get(name) || "");
  return value ? new Date(value).toISOString() : null;
}

function textOrNull(form: FormData, name: string) {
  const value = String(form.get(name) || "").trim();
  return value || null;
}

function isOverdue(value: string | null) {
  return value ? new Date(value).getTime() < Date.now() : false;
}
