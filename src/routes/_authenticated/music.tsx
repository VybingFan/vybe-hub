import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  CheckSquare2,
  ChevronRight,
  Clock3,
  Disc3,
  Handshake,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Scale,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Section } from "@/components/common/Section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDuration, type Track } from "@/features/music/schema";
import {
  TRACK_PRODUCTION_STAGE_LABELS,
  TRACK_PRODUCTION_STAGES,
  TRACK_WORKSPACE_CATEGORIES,
  TRACK_WORKSPACE_CATEGORY_LABELS,
  type TrackProductionStage,
  type TrackWorkspaceCategory,
} from "@/features/music/workflow";
import { useCreatorTracks } from "@/hooks/useMusic";
import {
  useBulkUpdateTrackWorkflow,
  useUpdateTrackWorkflow,
} from "@/hooks/useTrackWorkflow";
import { useUser } from "@/hooks/useUser";

type WorkflowTrack = Track & {
  workspace_category?: TrackWorkspaceCategory;
  production_stage?: TrackProductionStage;
};

type LibraryView = "overview" | "all" | TrackWorkspaceCategory;

const categoryIcons = {
  released: Disc3,
  upcoming: Clock3,
  work_in_progress: Wrench,
  collaboration: Handshake,
  rights_pending: Scale,
  commercial_preview: Sparkles,
  archived: Archive,
} satisfies Record<TrackWorkspaceCategory, typeof Disc3>;

const categoryDescriptions: Record<TrackWorkspaceCategory, string> = {
  released: "Finished music already available to listeners.",
  upcoming: "Music being prepared for a future release.",
  work_in_progress: "Ideas, drafts, recordings, mixes, and unfinished songs.",
  collaboration: "Songs that need artists, writers, producers, or musicians.",
  rights_pending:
    "Music waiting for a license, agreement, clearance, or purchase.",
  commercial_preview:
    "Released music promoted through a limited public preview.",
  archived: "Music kept for your records but removed from active work.",
};

const visibilityLabels: Record<string, string> = {
  public: "Public",
  unlisted: "Shareable",
  private: "Private",
  scheduled: "Scheduled",
  archived: "Archived",
};

const playbackLabels: Record<string, string> = {
  full: "Full song",
  preview: "Preview",
  none: "No playback",
  membership_only: "Members",
  approved_listeners: "Approved listeners",
};

export const Route = createFileRoute("/_authenticated/music")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <MusicLibrary />
    </RoleGuard>
  ),
});

function MusicLibrary() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { data = [], isLoading, error } = useCreatorTracks(user?.id);
  const tracks = data as WorkflowTrack[];
  const workflow = useUpdateTrackWorkflow(user?.id);
  const bulkWorkflow = useBulkUpdateTrackWorkflow(user?.id);

  const [view, setView] = useState<LibraryView>("overview");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<"all" | TrackProductionStage>("all");
  const [limit, setLimit] = useState(20);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState<TrackWorkspaceCategory | "">(
    "",
  );
  const [bulkStage, setBulkStage] = useState<TrackProductionStage | "">("");

  useEffect(() => {
    setSelectedIds([]);
    setBulkCategory("");
    setBulkStage("");
  }, [view, query, stage]);

  const counts = useMemo(() => {
    const value = Object.fromEntries(
      TRACK_WORKSPACE_CATEGORIES.map((category) => [category, 0]),
    ) as Record<TrackWorkspaceCategory, number>;

    tracks.forEach((track) => {
      value[track.workspace_category ?? "work_in_progress"] += 1;
    });

    return value;
  }, [tracks]);

  const recent = useMemo(
    () =>
      [...tracks]
        .sort((a, b) => (b.updated_at > a.updated_at ? 1 : -1))
        .slice(0, 5),
    [tracks],
  );

  const filtered = useMemo(() => {
    let value = tracks;

    if (view !== "overview" && view !== "all") {
      value = value.filter(
        (track) => (track.workspace_category ?? "work_in_progress") === view,
      );
    }

    if (stage !== "all") {
      value = value.filter(
        (track) => (track.production_stage ?? "idea") === stage,
      );
    }

    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      value = value.filter(
        (track) =>
          track.title.toLowerCase().includes(needle) ||
          (track.primary_artist_name || "").toLowerCase().includes(needle) ||
          (track.genre || "").toLowerCase().includes(needle),
      );
    }

    return [...value].sort((a, b) => (b.updated_at > a.updated_at ? 1 : -1));
  }, [query, stage, tracks, view]);

  const visibleTracks = filtered.slice(0, limit);
  const visibleIds = visibleTracks.map((track) => track.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const updateCategory = async (
    track: WorkflowTrack,
    category: TrackWorkspaceCategory,
  ) => {
    try {
      await workflow.mutateAsync({
        trackId: track.id,
        category,
        ...(category === "archived" ? { stage: "archived" as const } : {}),
      });
      toast.success(`Moved to ${TRACK_WORKSPACE_CATEGORY_LABELS[category]}.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Update failed.");
    }
  };

  const updateStage = async (
    track: WorkflowTrack,
    nextStage: TrackProductionStage,
  ) => {
    try {
      await workflow.mutateAsync({
        trackId: track.id,
        stage: nextStage,
        ...(nextStage === "released" &&
        track.workspace_category === "work_in_progress"
          ? { category: "released" as const }
          : {}),
      });
      toast.success(
        `Stage changed to ${TRACK_PRODUCTION_STAGE_LABELS[nextStage]}.`,
      );
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Update failed.");
    }
  };

  const applyBulkUpdate = async () => {
    if (!selectedIds.length) {
      toast.error("Select at least one song.");
      return;
    }

    if (!bulkCategory && !bulkStage) {
      toast.error("Choose a category or production stage.");
      return;
    }

    try {
      await bulkWorkflow.mutateAsync({
        trackIds: selectedIds,
        ...(bulkCategory ? { category: bulkCategory } : {}),
        ...(bulkStage ? { stage: bulkStage } : {}),
      });

      toast.success(
        `${selectedIds.length} song${selectedIds.length === 1 ? "" : "s"} updated.`,
      );
      setSelectedIds([]);
      setBulkCategory("");
      setBulkStage("");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Bulk update failed.",
      );
    }
  };

  const toggleSelected = (trackId: string) => {
    setSelectedIds((current) =>
      current.includes(trackId)
        ? current.filter((id) => id !== trackId)
        : [...current, trackId],
    );
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn't load your music workspace"
        message={(error as Error).message}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Section
        title="Music library"
        description="Organize music by purpose and production stage instead of scrolling through one long catalog."
        action={
          <Button
            onClick={() => window.location.assign("/music/upload")}
            className="bg-gradient-brand text-primary-foreground shadow-glow"
          >
            <Plus className="mr-2 h-4 w-4" />
            Upload
          </Button>
        }
      >
        {view === "overview" ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <CategoryCard
                label="All music"
                count={tracks.length}
                description="Open the complete catalog only when you need it."
                icon={Disc3}
                onClick={() => setView("all")}
              />

              {TRACK_WORKSPACE_CATEGORIES.map((category) => (
                <CategoryCard
                  key={category}
                  label={TRACK_WORKSPACE_CATEGORY_LABELS[category]}
                  count={counts[category]}
                  description={categoryDescriptions[category]}
                  icon={categoryIcons[category]}
                  onClick={() => setView(category)}
                />
              ))}
            </div>

            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Recently updated</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your five most recently changed songs.
                  </p>
                </div>

                {!!tracks.length && (
                  <Button variant="ghost" onClick={() => setView("all")}>
                    View all
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {!recent.length ? (
                  <EmptyState
                    title="No music yet"
                    description="Upload your first song to begin organizing your workspace."
                    action={{
                      label: "Upload your first song",
                      onClick: () => window.location.assign("/music/upload"),
                    }}
                  />
                ) : (
                  recent.map((track) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      busy={workflow.isPending}
                      selectable={false}
                      selected={false}
                      onSelectedChange={() => undefined}
                      onEdit={() =>
                        navigate({
                          to: "/music/$trackId",
                          params: { trackId: track.id },
                        })
                      }
                      onCategory={(category) =>
                        void updateCategory(track, category)
                      }
                      onStage={(nextStage) =>
                        void updateStage(track, nextStage)
                      }
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <Button
              variant="ghost"
              className="-ml-3"
              onClick={() => {
                setView("overview");
                setQuery("");
                setStage("all");
              }}
            >
              ← Workspace overview
            </Button>

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">
                  {view === "all"
                    ? "All music"
                    : TRACK_WORKSPACE_CATEGORY_LABELS[view]}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {view === "all"
                    ? "Search the complete catalog."
                    : categoryDescriptions[view]}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="secondary">{filtered.length} songs</Badge>
                <p className="mt-1 text-xs text-muted-foreground">
                  Category and stage changes save immediately.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_13rem]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setLimit(20);
                  }}
                  placeholder="Search title, artist, or genre"
                  className="pl-9"
                />
              </div>

              <Select
                value={stage}
                onValueChange={(value) => {
                  setStage(value as "all" | TrackProductionStage);
                  setLimit(20);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {TRACK_PRODUCTION_STAGES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {TRACK_PRODUCTION_STAGE_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!!filtered.length && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    className="h-4 w-4 accent-primary"
                  />
                  Select visible
                </label>

                <span className="text-sm text-muted-foreground">
                  {selectedIds.length} selected
                </span>
              </div>
            )}

            {!!selectedIds.length && (
              <Card className="border-primary/30">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="flex items-center gap-2 font-medium">
                      <CheckSquare2 className="h-4 w-4 text-primary" />
                      Bulk update {selectedIds.length} song
                      {selectedIds.length === 1 ? "" : "s"}
                    </div>

                    <div className="grid flex-1 gap-2 sm:grid-cols-2">
                      <Select
                        value={bulkCategory}
                        onValueChange={(value) =>
                          setBulkCategory(value as TrackWorkspaceCategory)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Move to category" />
                        </SelectTrigger>
                        <SelectContent>
                          {TRACK_WORKSPACE_CATEGORIES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {TRACK_WORKSPACE_CATEGORY_LABELS[item]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={bulkStage}
                        onValueChange={(value) =>
                          setBulkStage(value as TrackProductionStage)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Change production stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {TRACK_PRODUCTION_STAGES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {TRACK_PRODUCTION_STAGE_LABELS[item]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => void applyBulkUpdate()}
                        disabled={bulkWorkflow.isPending}
                      >
                        {bulkWorkflow.isPending ? "Updating…" : "Apply"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedIds([])}
                        aria-label="Clear selection"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!filtered.length ? (
              <EmptyState
                title="No matching songs"
                description="Try another search, stage, or category."
              />
            ) : (
              <div className="space-y-2">
                {visibleTracks.map((track) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    busy={workflow.isPending || bulkWorkflow.isPending}
                    selectable
                    selected={selectedIds.includes(track.id)}
                    onSelectedChange={() => toggleSelected(track.id)}
                    onEdit={() =>
                      navigate({
                        to: "/music/$trackId",
                        params: { trackId: track.id },
                      })
                    }
                    onCategory={(category) =>
                      void updateCategory(track, category)
                    }
                    onStage={(nextStage) => void updateStage(track, nextStage)}
                  />
                ))}
              </div>
            )}

            {limit < filtered.length && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setLimit((current) => current + 20)}
                >
                  Load 20 more songs
                </Button>
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}

function CategoryCard({
  label,
  count,
  description,
  icon: Icon,
  onClick,
}: {
  label: string;
  count: number;
  description: string;
  icon: typeof Disc3;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-border bg-card p-3 text-left transition hover:border-primary/50"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-primary" />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{label}</p>
        <span className="text-lg font-semibold">{count}</span>
      </div>
      <p className="sr-only">{description}</p>
    </button>
  );
}

function TrackRow({
  track,
  busy,
  selectable,
  selected,
  onSelectedChange,
  onEdit,
  onCategory,
  onStage,
}: {
  track: WorkflowTrack;
  busy: boolean;
  selectable: boolean;
  selected: boolean;
  onSelectedChange: () => void;
  onEdit: () => void;
  onCategory: (category: TrackWorkspaceCategory) => void;
  onStage: (stage: TrackProductionStage) => void;
}) {
  const category = track.workspace_category ?? "work_in_progress";
  const stage = track.production_stage ?? "idea";
  const visibility = track.visibility ?? "public";
  const publishingStatus = track.status ?? "draft";
  const playbackMode = track.playback_mode ?? "full";

  return (
    <Card className={selected ? "border-primary/50 bg-primary/5" : undefined}>
      <CardContent className="p-2.5 sm:p-3">
        <div className="flex items-center gap-3">
          {selectable && (
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelectedChange}
              aria-label={`Select ${track.title}`}
              className="h-4 w-4 shrink-0 accent-primary"
            />
          )}

          <img
            src={track.cover_url || "/banners/default-creator-banner.png"}
            alt=""
            className="h-11 w-11 shrink-0 rounded-lg object-cover"
          />

          <button
            type="button"
            onClick={onEdit}
            className="min-w-0 flex-1 text-left"
          >
            <p className="truncate font-semibold">{track.title}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {track.primary_artist_name || "Independent artist"} ·{" "}
              {formatDuration(track.duration_sec)}
            </p>
            <span className="mt-1.5 flex flex-wrap gap-1">
              <Badge
                variant={visibility === "public" ? "default" : "outline"}
                className="h-5 px-1.5 text-[10px] font-medium"
              >
                {visibilityLabels[visibility] ?? visibility}
              </Badge>
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-medium"
              >
                {publishingStatus === "published" ? "Published" : "Draft"}
              </Badge>
              <Badge
                variant="outline"
                className="h-5 px-1.5 text-[10px] font-medium"
              >
                {playbackLabels[playbackMode] ?? playbackMode}
              </Badge>
            </span>
          </button>

          <div className="hidden min-w-48 sm:block">
            <Select
              value={category}
              disabled={busy}
              onValueChange={(value) =>
                onCategory(value as TrackWorkspaceCategory)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRACK_WORKSPACE_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {TRACK_WORKSPACE_CATEGORY_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden min-w-40 sm:block">
            <Select
              value={stage}
              disabled={busy}
              onValueChange={(value) => onStage(value as TrackProductionStage)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRACK_PRODUCTION_STAGES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {TRACK_PRODUCTION_STAGE_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="ghost" size="sm" onClick={onEdit}>
            Manage
          </Button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 sm:hidden">
          <Select
            value={category}
            disabled={busy}
            onValueChange={(value) =>
              onCategory(value as TrackWorkspaceCategory)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRACK_WORKSPACE_CATEGORIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {TRACK_WORKSPACE_CATEGORY_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={stage}
            disabled={busy}
            onValueChange={(value) => onStage(value as TrackProductionStage)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRACK_PRODUCTION_STAGES.map((item) => (
                <SelectItem key={item} value={item}>
                  {TRACK_PRODUCTION_STAGE_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
