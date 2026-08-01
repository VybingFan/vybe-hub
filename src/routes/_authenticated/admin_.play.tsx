import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  Edit3,
  Gamepad2,
  Loader2,
  PauseCircle,
  Plus,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PLAY_GENRES, PLAY_RELEASE_CHECKS } from "@/features/play/content";
import { adminTeamService, type AdminAccess } from "@/services/admin/adminTeamService";
import {
  playContentAdminService,
  type PlayContentDraft,
  type PlayContentItem,
  type PlayContentStatus,
  type PlayDifficulty,
  type PlayExperienceType,
  type PlayRightsStatus,
} from "@/services/play/playContentAdminService";

export const Route = createFileRoute("/_authenticated/admin_/play")({
  component: PlayAdministrationPage,
});

const EXPERIENCE_LABELS: Record<PlayExperienceType, string> = {
  beat_blitz: "Beat Blitz",
  vybe_match: "VYBE Match",
  hidden_gems: "Hidden Gems",
  daily_vybe: "Daily VYBE",
  creator_spotlight: "Creator Spotlight",
  poll: "Poll",
};

const STATUS_LABELS: Record<PlayContentStatus, string> = {
  draft: "Draft",
  review_needed: "Review needed",
  rights_review: "Rights review",
  approved: "Approved",
  scheduled: "Scheduled",
  active: "Active",
  paused: "Paused",
  retired: "Retired",
  rejected: "Rejected",
};

const emptyDraft: PlayContentDraft = {
  content_key: "",
  experience_type: "beat_blitz",
  title: "",
  prompt: "",
  payload: { choices: [], answer: "" },
  explanation: "",
  genre: "Mixed VYBE",
  difficulty: "intro",
  visibility: "public",
  rights_status: "not_required",
  source_title: null,
  source_url: null,
  verification_notes: "",
  discovery_url: null,
  scheduled_start_at: null,
  scheduled_end_at: null,
};

function PlayAdministrationPage() {
  return (
    <AdminPermissionGuard anyOf={["admin.content.read"]}>
      <PlayContentWorkspace />
    </AdminPermissionGuard>
  );
}

function PlayContentWorkspace() {
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [items, setItems] = useState<PlayContentItem[]>([]);
  const [draft, setDraft] = useState<PlayContentDraft>(emptyDraft);
  const [choicesText, setChoicesText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const canEdit = access?.permissions.includes("admin.content.moderate") ?? false;
  const canPublish = access?.permissions.includes("admin.content.publish") ?? false;
  const canRightsReview = access?.permissions.includes("admin.rights.review") ?? false;

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [nextAccess, nextItems] = await Promise.all([
        adminTeamService.getMyAccess(),
        playContentAdminService.list(),
      ]);
      setAccess(nextAccess);
      setItems(nextItems);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Play content could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      active: items.filter((item) => item.status === "active").length,
      review: items.filter((item) => ["review_needed", "rights_review"].includes(item.status))
        .length,
      scheduled: items.filter((item) => item.status === "scheduled").length,
    }),
    [items],
  );

  function startNew() {
    setDraft(emptyDraft);
    setChoicesText("");
    setAnswerText("");
  }

  function edit(item: PlayContentItem) {
    setDraft({
      id: item.id,
      content_key: item.content_key,
      experience_type: item.experience_type,
      title: item.title,
      prompt: item.prompt,
      payload: item.payload,
      explanation: item.explanation,
      genre: item.genre,
      difficulty: item.difficulty,
      visibility: item.visibility,
      rights_status: item.rights_status,
      source_title: item.source_title,
      source_url: item.source_url,
      verification_notes: item.verification_notes,
      discovery_url: item.discovery_url,
      scheduled_start_at: item.scheduled_start_at,
      scheduled_end_at: item.scheduled_end_at,
    });
    setChoicesText(item.payload.choices?.join("\n") ?? "");
    setAnswerText(item.payload.answer ?? "");
    document.getElementById("play-editor")?.scrollIntoView({ behavior: "smooth" });
  }

  async function save() {
    if (!canEdit) return;
    if (!draft.content_key.trim() || !draft.title.trim() || !draft.prompt.trim()) {
      toast.error("Content key, title, and prompt are required.");
      return;
    }
    setSaving(true);
    try {
      const saved = await playContentAdminService.save({
        ...draft,
        content_key: draft.content_key
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        payload: {
          ...draft.payload,
          choices: choicesText
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
          answer: answerText.trim(),
        },
      });
      setItems((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      edit(saved);
      toast.success(draft.id ? "Play content updated." : "Play content created as a draft.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Play content could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(item: PlayContentItem, status: PlayContentStatus) {
    setSaving(true);
    try {
      const saved = await playContentAdminService.setStatus(item.id, status);
      setItems((current) => current.map((entry) => (entry.id === saved.id ? saved : entry)));
      if (draft.id === saved.id) edit(saved);
      toast.success(`Status changed to ${STATUS_LABELS[status]}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status could not be changed.");
    } finally {
      setSaving(false);
    }
  }

  async function changeRightsStatus(item: PlayContentItem, status: PlayRightsStatus) {
    setSaving(true);
    try {
      const saved = await playContentAdminService.setRightsStatus(
        item.id,
        status,
        item.verification_notes,
      );
      setItems((current) => current.map((entry) => (entry.id === saved.id ? saved : entry)));
      if (draft.id === saved.id) edit(saved);
      toast.success(`Rights status changed to ${status.replaceAll("_", " ")}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rights status could not be changed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <Button asChild variant="ghost" className="-ml-3 mb-4">
          <Link to="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to administration
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" /> Permission-controlled Play operations
        </div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Play content library
            </h1>
            <p className="mt-2 max-w-3xl leading-7 text-muted-foreground">
              Create, review, schedule, publish, pause, and revise reusable game content without
              changing application code.
            </p>
          </div>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-4">
        <SummaryCard
          label="All content"
          value={items.length}
          note="Retained across editorial states"
        />
        <SummaryCard label="Active" value={counts.active} note="Currently eligible for Play" />
        <SummaryCard label="Needs review" value={counts.review} note="Editorial or rights review" />
        <SummaryCard label="Scheduled" value={counts.scheduled} note="Waiting for release window" />
      </div>

      {loadError ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-6">
            <p className="font-semibold">Content database is not available yet</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{loadError}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Apply the V24.32 Supabase migration before testing editor actions. Existing public
              Play remains unchanged.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" /> Inventory
            </CardTitle>
            {canEdit ? (
              <Button size="sm" onClick={startNew}>
                <Plus className="mr-2 h-4 w-4" /> New item
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex min-h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : items.length ? (
              items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{item.title}</p>
                        <Badge variant={item.status === "active" ? "default" : "outline"}>
                          {STATUS_LABELS[item.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {EXPERIENCE_LABELS[item.experience_type]} · {item.genre} · v{item.version}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {item.prompt}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => edit(item)}>
                      <Edit3 className="mr-2 h-4 w-4" /> Edit
                    </Button>
                  </div>
                  {canEdit || canPublish ? (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                      {canEdit && item.status === "draft" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void changeStatus(item, "review_needed")}
                          disabled={saving}
                        >
                          <Send className="mr-2 h-4 w-4" /> Send to review
                        </Button>
                      ) : null}
                      {canEdit &&
                      item.rights_status === "review_needed" &&
                      item.status !== "rights_review" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void changeStatus(item, "rights_review")}
                          disabled={saving}
                        >
                          Send to rights review
                        </Button>
                      ) : null}
                      {canRightsReview && item.status === "rights_review" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void changeRightsStatus(item, "creator_approved")}
                          disabled={saving}
                        >
                          Creator approved
                        </Button>
                      ) : null}
                      {canRightsReview && item.status === "rights_review" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void changeRightsStatus(item, "licensed")}
                          disabled={saving}
                        >
                          Licensed
                        </Button>
                      ) : null}
                      {canPublish && ["review_needed", "rights_review"].includes(item.status) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void changeStatus(item, "approved")}
                          disabled={saving}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                        </Button>
                      ) : null}
                      {canPublish && ["approved", "scheduled", "paused"].includes(item.status) ? (
                        <Button
                          size="sm"
                          onClick={() => void changeStatus(item, "active")}
                          disabled={saving}
                        >
                          <Gamepad2 className="mr-2 h-4 w-4" /> Publish
                        </Button>
                      ) : null}
                      {canPublish && item.status === "approved" && item.scheduled_start_at ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void changeStatus(item, "scheduled")}
                          disabled={saving}
                        >
                          Schedule
                        </Button>
                      ) : null}
                      {canPublish && item.status === "active" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void changeStatus(item, "paused")}
                          disabled={saving}
                        >
                          <PauseCircle className="mr-2 h-4 w-4" /> Pause
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <Gamepad2 className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-semibold">No managed Play content yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create the first item after the migration is applied.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card id="play-editor">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" /> {draft.id ? "Edit content" : "New content"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field label="Content key" required>
              <Input
                value={draft.content_key}
                onChange={(event) => setDraft({ ...draft, content_key: event.target.value })}
                disabled={!canEdit}
                placeholder="hip-hop-history-001"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Experience"
                value={draft.experience_type}
                disabled={!canEdit}
                onChange={(value) =>
                  setDraft({ ...draft, experience_type: value as PlayExperienceType })
                }
                options={Object.entries(EXPERIENCE_LABELS)}
              />
              <SelectField
                label="Genre"
                value={draft.genre}
                disabled={!canEdit}
                onChange={(value) => setDraft({ ...draft, genre: value })}
                options={PLAY_GENRES.map((genre) => [genre, genre])}
              />
            </div>
            <Field label="Title" required>
              <Input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                disabled={!canEdit}
              />
            </Field>
            <Field label="Question, clue, or prompt" required>
              <Textarea
                rows={4}
                value={draft.prompt}
                onChange={(event) => setDraft({ ...draft, prompt: event.target.value })}
                disabled={!canEdit}
              />
            </Field>
            <Field label="Choices or match entries" hint="Enter one choice per line.">
              <Textarea
                rows={4}
                value={choicesText}
                onChange={(event) => setChoicesText(event.target.value)}
                disabled={!canEdit}
              />
            </Field>
            <Field label="Correct answer">
              <Input
                value={answerText}
                onChange={(event) => setAnswerText(event.target.value)}
                disabled={!canEdit}
              />
            </Field>
            <Field label="Player explanation">
              <Textarea
                rows={3}
                value={draft.explanation}
                onChange={(event) => setDraft({ ...draft, explanation: event.target.value })}
                disabled={!canEdit}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Difficulty"
                value={draft.difficulty}
                disabled={!canEdit}
                onChange={(value) => setDraft({ ...draft, difficulty: value as PlayDifficulty })}
                options={["intro", "easy", "medium", "hard", "expert"].map((value) => [
                  value,
                  value,
                ])}
              />
              <SelectField
                label="Rights status"
                value={draft.rights_status}
                disabled={!canEdit}
                onChange={(value) =>
                  setDraft({ ...draft, rights_status: value as PlayRightsStatus })
                }
                options={[
                  "not_required",
                  "review_needed",
                  "creator_approved",
                  "licensed",
                  "restricted",
                  "rejected",
                ].map((value) => [value, value.replaceAll("_", " ")])}
              />
            </div>
            <Field label="Source title">
              <Input
                value={draft.source_title ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, source_title: event.target.value || null })
                }
                disabled={!canEdit}
              />
            </Field>
            <Field label="Source URL">
              <Input
                type="url"
                value={draft.source_url ?? ""}
                onChange={(event) => setDraft({ ...draft, source_url: event.target.value || null })}
                disabled={!canEdit}
                placeholder="https://"
              />
            </Field>
            <Field label="Verification notes">
              <Textarea
                rows={3}
                value={draft.verification_notes}
                onChange={(event) => setDraft({ ...draft, verification_notes: event.target.value })}
                disabled={!canEdit}
              />
            </Field>
            <Field
              label="Discovery destination"
              hint="A VYBE path such as /creator/name or an approved web URL."
            >
              <Input
                value={draft.discovery_url ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, discovery_url: event.target.value || null })
                }
                disabled={!canEdit}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Release start">
                <Input
                  type="datetime-local"
                  value={toLocalDateTime(draft.scheduled_start_at)}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      scheduled_start_at: fromLocalDateTime(event.target.value),
                    })
                  }
                  disabled={!canEdit}
                />
              </Field>
              <Field label="Release end">
                <Input
                  type="datetime-local"
                  value={toLocalDateTime(draft.scheduled_end_at)}
                  onChange={(event) =>
                    setDraft({ ...draft, scheduled_end_at: fromLocalDateTime(event.target.value) })
                  }
                  disabled={!canEdit}
                />
              </Field>
            </div>
            {canEdit ? (
              <Button className="w-full" onClick={() => void save()} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}{" "}
                Save draft
              </Button>
            ) : (
              <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                Your role can review this library but cannot edit content.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Release gates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {PLAY_RELEASE_CHECKS.map((check) => (
            <div key={check.label} className="rounded-2xl border border-border p-4">
              <p className="font-semibold">{check.label}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{check.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromLocalDateTime(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<readonly [string, string]>;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </Field>
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
