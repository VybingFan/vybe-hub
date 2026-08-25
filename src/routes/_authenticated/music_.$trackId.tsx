import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileAudio,
  FileText,
  ImagePlus,
  LockKeyhole,
  Loader2,
  Save,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUser } from "@/hooks/useUser";
import {
  useCreatorTracks,
  useDeleteTrack,
  useReplaceTrackAudio,
  useReplaceTrackCover,
  useSetProfileLead,
  useUpdateTrack,
} from "@/hooks/useMusic";
import {
  EMPTY_TRACK_DISCOVERY_METADATA,
  formatDuration,
  MAX_COVER_BYTES,
  type ContentStatus,
  type TrackDiscoveryMetadata,
  type TrackVisibility,
  type TrackPlaybackMode,
} from "@/features/music/schema";
import {
  TRACK_PRODUCTION_STAGE_LABELS,
  TRACK_PRODUCTION_STAGES,
  TRACK_WORKSPACE_CATEGORIES,
  TRACK_WORKSPACE_CATEGORY_LABELS,
  type TrackProductionStage,
  type TrackWorkspaceCategory,
} from "@/features/music/workflow";
import { readAudioDuration } from "@/services/music/musicService";
import { useMembership } from "@/hooks/useMembership";
import {
  effectivePublicPlan,
  hasCreatorCapability,
} from "@/features/membership/access";
import { CREATOR_PLAN_CATALOG } from "@/features/membership/catalog";
import { LockedFeatureLearnMoreDialog } from "@/components/membership/LockedFeatureLearnMoreDialog";

export const Route = createFileRoute("/_authenticated/music_/$trackId")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <SongEditor />
    </RoleGuard>
  ),
});

const VISIBILITY_LABELS: Record<TrackVisibility, string> = {
  public: "Public",
  unlisted: "Unlisted",
  private: "Private",
  scheduled: "Scheduled",
  archived: "Archived",
};

const PLAYBACK_LABELS: Record<TrackPlaybackMode, string> = {
  full: "Full song",
  preview: "Preview only",
  none: "No playback",
  membership_only: "Membership only",
  approved_listeners: "Approved listeners",
};

function SongEditor() {
  const { trackId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { data: membership } = useMembership(Boolean(user?.id));
  const canUseWorkflow = hasCreatorCapability(
    membership?.plan_code,
    "music.workflow",
  );
  const currentPlanCode = effectivePublicPlan(membership?.plan_code);
  const currentPlanName =
    CREATOR_PLAN_CATALOG.find((plan) => plan.code === currentPlanCode)?.name ??
    "Creator Free";
  const { data: tracks = [], isLoading } = useCreatorTracks(user?.id);
  const track = tracks.find((item) => item.id === trackId);
  const update = useUpdateTrack(user?.id);
  const replaceCover = useReplaceTrackCover(user?.id);
  const replaceAudio = useReplaceTrackAudio(user?.id);
  const setLead = useSetProfileLead(user?.id);
  const remove = useDeleteTrack(user?.id);
  const [title, setTitle] = useState("");
  const [primaryArtist, setPrimaryArtist] = useState("");
  const [featuredArtists, setFeaturedArtists] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [status, setStatus] = useState<ContentStatus>("draft");
  const [workspaceCategory, setWorkspaceCategory] =
    useState<TrackWorkspaceCategory>("work_in_progress");
  const [productionStage, setProductionStage] =
    useState<TrackProductionStage>("idea");
  const [visibility, setVisibility] = useState<TrackVisibility>("public");
  const [playbackMode, setPlaybackMode] = useState<TrackPlaybackMode>("full");
  const [previewDuration, setPreviewDuration] = useState<15 | 30 | 45 | 60>(30);
  const [previewStart, setPreviewStart] = useState(0);
  const [allowDownload, setAllowDownload] = useState(false);
  const [discovery, setDiscovery] = useState<TrackDiscoveryMetadata>(
    EMPTY_TRACK_DISCOVERY_METADATA,
  );
  const [replacementAudio, setReplacementAudio] = useState<{
    file: File;
    durationSec: number;
  } | null>(null);
  const [replacementDetailsReviewed, setReplacementDetailsReviewed] =
    useState(false);

  useEffect(() => {
    if (!track) return;
    setTitle(track.title);
    setPrimaryArtist(track.primary_artist_name || "");
    setFeaturedArtists((track.featured_artist_names || []).join(", "));
    setGenre(track.genre || "");
    setDescription(track.description || "");
    setReleaseDate(track.release_date || "");
    setStatus(track.status);
    setWorkspaceCategory(track.workspace_category ?? "work_in_progress");
    setProductionStage(track.production_stage || "idea");
    setVisibility(track.visibility ?? "public");
    setPlaybackMode(track.playback_mode ?? "full");
    setPreviewDuration(track.preview_duration_sec ?? 30);
    setPreviewStart(track.preview_start_sec ?? 0);
    setAllowDownload(track.allow_download ?? false);
    setDiscovery(track.discovery_metadata || EMPTY_TRACK_DISCOVERY_METADATA);
    setReplacementAudio(null);
    setReplacementDetailsReviewed(false);
  }, [track]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !primaryArtist.trim()) {
      return toast.error("Song title and primary artist are required.");
    }
    if (replacementAudio && !replacementDetailsReviewed) {
      return toast.error(
        "Review and confirm the retained song details before replacing the audio.",
      );
    }
    try {
      await update.mutateAsync({
        id: trackId,
        patch: {
          title: title.trim(),
          primary_artist_name: primaryArtist.trim(),
          featured_artist_names: featuredArtists
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean),
          genre: genre.trim(),
          description: description.trim(),
          release_date: releaseDate,
          status,
          ...(canUseWorkflow
            ? {
                workspace_category: workspaceCategory,
                production_stage: productionStage,
              }
            : {}),
          visibility,
          playback_mode: playbackMode,
          preview_duration_sec: previewDuration,
          preview_start_sec: previewStart,
          allow_download: allowDownload,
          discovery_metadata: discovery,
        },
      });
      if (replacementAudio) {
        await replaceAudio.mutateAsync({
          id: trackId,
          file: replacementAudio.file,
          durationSec: replacementAudio.durationSec,
        });
        setReplacementAudio(null);
        setReplacementDetailsReviewed(false);
        toast.success("Audio and reviewed song details updated everywhere.");
      } else {
        toast.success("Song details saved.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : typeof error === "object" && error !== null && "message" in error ? String(error.message) : "Could not save the song. Check the required fields and try again.",
      );
    }
  };

  const uploadCover = async (file?: File) => {
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      return toast.error("Choose a JPG, PNG, or WebP cover image.");
    }
    if (file.size > MAX_COVER_BYTES) return toast.error("Cover exceeds 2MB");
    try {
      await replaceCover.mutateAsync({ id: trackId, file });
      toast.success("Cover art updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update cover art",
      );
    }
  };

  const selectReplacementAudio = async (file?: File) => {
    if (!file) return;
    try {
      const durationSec = await readAudioDuration(file);
      if (!durationSec)
        throw new Error("VYBE could not read the replacement audio duration.");
      setReplacementAudio({ file, durationSec });
      setReplacementDetailsReviewed(false);
      toast.info(
        "Replacement selected. Review the highlighted song details, then save.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not read the replacement audio",
      );
    }
  };

  const deleteSong = async () => {
    try {
      await remove.mutateAsync(trackId);
      toast.success("Song deleted.");
      navigate({ to: "/music" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete the song",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }
  if (!track) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border p-10 text-center">
        <h1 className="text-lg font-semibold">Song not found</h1>
        <Button asChild className="mt-6">
          <Link to="/music">Return to Music Library</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <Button asChild variant="ghost" className="-ml-3 mb-3">
          <Link to="/music">
            <ArrowLeft className="mr-2 h-4 w-4" /> Music Library
          </Link>
        </Button>
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">
          Edit song
        </p>
        <h1 className="mt-1 text-lg font-semibold sm:text-3xl">
          {track.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage its audio, artwork, credits, publishing status, and profile
          placement.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/music/$trackId/lyrics" params={{ trackId }}>
              <FileText className="mr-2 h-4 w-4" /> Add or refine lyrics
            </Link>
          </Button>
          <LockedFeatureLearnMoreDialog
            triggerLabel="Learn about locked features"
            title="Organize every song from idea to release"
            description="Music categories and production stages give creators a working catalog—not just a list of uploaded files."
            howItWorks={[
              "Music category explains why a song is in your workspace, such as work in progress, upcoming, released, or archived.",
              "Production stage records where the song is in the creative process, from an early idea through recording, mixing, mastering, and release readiness.",
              "These organization choices do not change who can discover or hear the song. Visibility and playback remain separate controls.",
            ]}
            benefits={[
              "Find the right song faster as your catalog grows.",
              "See which songs need attention and what should happen next.",
              "Plan releases without confusing unfinished, upcoming, and published work.",
              "Prepare a cleaner catalog for collaborators, teams, opportunities, and future VYBE tools.",
            ]}
            requiredPlanLabel="Creator Plus or higher"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">
              Your membership
            </p>
            <p className="mt-1 font-semibold">{currentPlanName}</p>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            Included tools remain editable. Locked tools stay visible so you can
            understand what another plan adds before deciding whether to upgrade.
          </p>
        </div>
      </header>

      <form
        id="manage-song-form"
        onSubmit={save}
        className="grid gap-4 min-[900px]:grid-cols-[12.5rem_minmax(0,1fr)] min-[1280px]:grid-cols-[13rem_minmax(0,1fr)]"
      >
        <Button
          form="manage-song-form"
          type="submit"
          disabled={update.isPending || replaceAudio.isPending}
          className="fixed bottom-20 right-4 z-40 bg-gradient-brand text-primary-foreground shadow-elevated md:hidden"
        >
          {update.isPending || replaceAudio.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {replacementAudio ? "Save and replace audio" : "Save song"}
        </Button>
        <aside className="space-y-5 min-[900px]:space-y-3">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <img
              src={track.cover_url || "/banners/default-creator-banner.png"}
              alt=""
              className="aspect-square w-full object-cover"
            />
            <div className="space-y-2.5 p-5 min-[900px]:p-3.5">
              <Label className="flex cursor-pointer items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-medium hover:border-primary/60 min-[900px]:px-3 min-[900px]:py-2.5 min-[900px]:text-sm">
                {replaceCover.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="mr-2 h-4 w-4" />
                )}
                Replace cover art
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={replaceCover.isPending}
                  onChange={(event) => {
                    void uploadCover(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </Label>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, or WebP up to 2MB.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 min-[900px]:p-3.5">
            <p className="text-sm font-medium">Current audio</p>
            <audio
              controls
              preload="metadata"
              src={track.audio_url}
              className="mt-3 w-full"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Duration: {formatDuration(track.duration_sec)}
            </p>
          </div>
        </aside>

        <div className="space-y-4 min-[900px]:space-y-3">
          <section
            className={
              canUseWorkflow
                ? "rounded-2xl border border-border bg-card p-4 sm:p-5 min-[900px]:p-4"
                : "rounded-2xl border border-primary/25 bg-primary/[0.03] p-4 sm:p-5 min-[900px]:p-4"
            }
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Workspace & production</h2>
              {!canUseWorkflow ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <LockKeyhole className="h-3.5 w-3.5" /> Creator Plus feature
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Organize where this song is in your workflow. Visibility and playback remain separate.
            </p>

            {!canUseWorkflow ? (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-primary/20 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-muted-foreground">
                  Your song can still be saved. Creator Plus unlocks categories
                  and production stages for organizing a growing music catalog.
                </p>
                <LockedFeatureLearnMoreDialog
                  compact
                  triggerLabel="Learn how this helps"
                  title="Turn your uploads into an organized music catalog"
                  description="Use music categories and production stages to understand what every song is for, where it stands, and what needs to happen next."
                  howItWorks={[
                    "Choose a music category to separate work in progress, upcoming music, released songs, and archived material.",
                    "Choose a production stage to track the song from idea through recording, mixing, mastering, and release readiness.",
                    "Keep visibility and playback separate so organizing a song never publishes it accidentally.",
                  ]}
                  benefits={[
                    "Prioritize unfinished work.",
                    "Prepare releases more confidently.",
                    "Keep a growing catalog understandable.",
                    "Make future collaboration and team workflows easier.",
                  ]}
                  requiredPlanLabel="Creator Plus or higher"
                />
              </div>
            ) : null}

            <div
              className={`mt-3 grid gap-3 sm:grid-cols-2 ${
                canUseWorkflow ? "" : "opacity-60"
              }`}
              aria-disabled={!canUseWorkflow}
            >
              <div>
                <Label>Music category</Label>
                <Select
                  value={workspaceCategory}
                  disabled={!canUseWorkflow}
                  onValueChange={(value) =>
                    setWorkspaceCategory(value as TrackWorkspaceCategory)
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACK_WORKSPACE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {TRACK_WORKSPACE_CATEGORY_LABELS[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Production stage</Label>
                <Select
                  value={productionStage}
                  disabled={!canUseWorkflow}
                  onValueChange={(value) =>
                    setProductionStage(value as TrackProductionStage)
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACK_PRODUCTION_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {TRACK_PRODUCTION_STAGE_LABELS[stage]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 min-[900px]:p-4">
            <h2 className="text-lg font-semibold">
              Visibility & listening access
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Control discovery, playback, previews, and downloads.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Visibility</Label>
                <Select
                  key={`visibility-${track.id}-${visibility}`}
                  value={visibility}
                  onValueChange={(value) =>
                    setVisibility(value as TrackVisibility)
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose visibility">
                      {VISIBILITY_LABELS[visibility]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Playback</Label>
                <Select
                  key={`playback-${track.id}-${playbackMode}`}
                  value={playbackMode}
                  onValueChange={(value) =>
                    setPlaybackMode(value as TrackPlaybackMode)
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose playback">
                      {PLAYBACK_LABELS[playbackMode]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full song</SelectItem>
                    <SelectItem value="preview">Preview only</SelectItem>
                    <SelectItem value="none">No playback</SelectItem>
                    <SelectItem value="membership_only">
                      Membership only
                    </SelectItem>
                    <SelectItem value="approved_listeners">
                      Approved listeners
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {playbackMode === "preview" ? (
                <>
                  <div>
                    <Label>Preview length</Label>
                    <Select
                      value={String(previewDuration)}
                      onValueChange={(value) =>
                        setPreviewDuration(Number(value) as 15 | 30 | 45 | 60)
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[15, 30, 45, 60].map((seconds) => (
                          <SelectItem key={seconds} value={String(seconds)}>
                            {seconds} seconds
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Preview starts at</Label>
                    <Input
                      className="mt-2"
                      type="number"
                      min={0}
                      max={Math.max(0, track.duration_sec - 1)}
                      value={previewStart}
                      onChange={(event) =>
                        setPreviewStart(
                          Math.max(0, Number(event.target.value) || 0),
                        )
                      }
                    />
                  </div>
                </>
              ) : null}
              <label className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={allowDownload}
                  onChange={(event) => setAllowDownload(event.target.checked)}
                />{" "}
                Allow authorized download
              </label>
            </div>
          </section>
        </div>

        <div className="space-y-3 min-[900px]:col-span-2 min-[900px]:space-y-2.5">
          <section
            className={
              replacementAudio
                ? "rounded-2xl border-2 border-amber-400 bg-amber-500/5 p-6 shadow-[0_0_0_4px_rgba(251,191,36,0.08)] md:p-6 min-[900px]:p-5"
                : "rounded-2xl border border-border bg-card p-4 sm:p-5 min-[900px]:p-4"
            }
          >
            <h2 className="text-lg font-semibold">Song details</h2>
            {replacementAudio ? (
              <div className="mt-4 rounded-2xl border border-amber-400/60 bg-amber-400/10 p-4">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Review these retained details before replacing the audio
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  VYBE does not overwrite these fields from the MP3. Update
                  anything that changed, or clear optional details such as
                  featured artists.
                </p>
              </div>
            ) : null}
            <div className="mt-3 grid gap-3">
              <div>
                <Label htmlFor="song-title">Song title</Label>
                <Input
                  id="song-title"
                  className="mt-2"
                  value={title}
                  maxLength={120}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="primary-artist">Primary artist</Label>
                  <Input
                    id="primary-artist"
                    className="mt-2"
                    value={primaryArtist}
                    onChange={(event) => setPrimaryArtist(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="featured-artists">Featured artists</Label>
                  <Input
                    id="featured-artists"
                    className="mt-2"
                    value={featuredArtists}
                    placeholder="Separate names with commas"
                    onChange={(event) => setFeaturedArtists(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="song-genre">Genre</Label>
                  <Input
                    id="song-genre"
                    className="mt-2"
                    value={genre}
                    maxLength={60}
                    onChange={(event) => setGenre(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="release-date">Release date</Label>
                  <Input
                    id="release-date"
                    className="mt-2"
                    type="date"
                    value={releaseDate}
                    onChange={(event) => setReleaseDate(event.target.value)}
                  />
                </div>
                <div>
                  <Label>Publishing status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as ContentStatus)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="song-description">Description</Label>
                <Textarea
                  id="song-description"
                  className="mt-2 min-h-20 min-[900px]:min-h-16"
                  value={description}
                  maxLength={1000}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 min-[900px]:p-4">
            <h2 className="text-lg font-semibold">Discovery information</h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Optional details that help listeners rediscover a song by mood, location, project, or scene.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 min-[1100px]:grid-cols-4">
              <div>
                <Label htmlFor="song-moods">Mood tags</Label>
                <Input
                  id="song-moods"
                  className="mt-2"
                  value={discovery.mood_tags.join(", ")}
                  placeholder="Reflective, energetic, late night"
                  onChange={(event) =>
                    setDiscovery((current) => ({
                      ...current,
                      mood_tags: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean)
                        .slice(0, 12),
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="song-location">Artist or song location</Label>
                <Input
                  id="song-location"
                  className="mt-2"
                  value={discovery.location}
                  placeholder="Philadelphia, PA"
                  onChange={(event) =>
                    setDiscovery((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="placement-platform">
                  Where the song appeared
                </Label>
                <Input
                  id="placement-platform"
                  className="mt-2"
                  value={discovery.placement_platform}
                  placeholder="Tubi, YouTube, podcast, advertisement"
                  onChange={(event) =>
                    setDiscovery((current) => ({
                      ...current,
                      placement_platform: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="placement-title">
                  Movie, show, video, or project title
                </Label>
                <Input
                  id="placement-title"
                  className="mt-2"
                  value={discovery.placement_title}
                  onChange={(event) =>
                    setDiscovery((current) => ({
                      ...current,
                      placement_title: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="sm:col-span-2 min-[1100px]:col-span-4">
                <Label htmlFor="placement-details">
                  Scene, episode, or placement details
                </Label>
                <Textarea
                  id="placement-details"
                  className="mt-2 min-h-20 min-[900px]:min-h-16"
                  value={discovery.placement_details}
                  placeholder="Episode, scene, timestamp, or anything a listener may remember"
                  onChange={(event) =>
                    setDiscovery((current) => ({
                      ...current,
                      placement_details: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-primary/25 bg-primary/5 p-4 min-[900px]:p-4">
            <div className="flex items-start gap-3">
              <FileAudio className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Replace audio file</h2>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Upload a corrected MP3 while keeping this song's identity, artwork, credits, playlists, and links.
                </p>
              </div>
            </div>
            <p className="mt-3 rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
              The new file updates this song everywhere after replacement succeeds.
            </p>
            {replacementAudio ? (
              <div className="mt-3 rounded-xl border border-amber-400/60 bg-amber-400/10 p-3">
                <p className="font-semibold">{replacementAudio.file.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Replacement duration:{" "}
                  {formatDuration(replacementAudio.durationSec)}
                </p>
                <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-primary"
                    checked={replacementDetailsReviewed}
                    onChange={(event) =>
                      setReplacementDetailsReviewed(event.target.checked)
                    }
                  />
                  <span>
                    I reviewed the title, artist credits, genre, release date,
                    status, and description above.
                  </span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setReplacementAudio(null);
                    setReplacementDetailsReviewed(false);
                  }}
                >
                  Cancel replacement
                </Button>
              </div>
            ) : null}
            <Label className="mt-3 inline-flex cursor-pointer items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
              {replaceAudio.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileAudio className="mr-2 h-4 w-4" />
              )}
              Choose replacement MP3
              <input
                type="file"
                accept="audio/mpeg,audio/mp3"
                className="hidden"
                disabled={replaceAudio.isPending}
                onChange={(event) => {
                  void selectReplacementAudio(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </Label>
          </section>

          <div className="flex flex-col-reverse justify-between gap-3 rounded-2xl border border-border/80 bg-background/95 p-3 sm:flex-row sm:items-center min-[900px]:sticky min-[900px]:bottom-3 min-[900px]:z-30 min-[900px]:shadow-xl min-[900px]:backdrop-blur">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete song
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete &quot;{track.title}&quot;?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the audio, cover art, and song from
                    every playlist containing it. Use Replace audio when
                    correcting an existing song.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground"
                    onClick={() => void deleteSong()}
                  >
                    Delete song
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={setLead.isPending}
                onClick={async () => {
                  try {
                    await setLead.mutateAsync(
                      track.is_featured ? null : track.id,
                    );
                    toast.success(
                      track.is_featured
                        ? "Profile lead cleared."
                        : "Profile lead updated.",
                    );
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Could not update lead",
                    );
                  }
                }}
              >
                <Star className="mr-2 h-4 w-4" />
                {track.is_featured
                  ? "Clear profile lead"
                  : "Set as profile lead"}
              </Button>
              <Button
                size="default"
                disabled={update.isPending || replaceAudio.isPending}
                className="hidden bg-gradient-brand text-primary-foreground md:inline-flex"
              >
                {update.isPending || replaceAudio.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {replacementAudio
                  ? "Save details and replace audio"
                  : "Save song"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
