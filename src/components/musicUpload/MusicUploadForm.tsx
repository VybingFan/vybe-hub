import { useState, type ChangeEvent } from "react";
import { Upload, Music2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { SubmitButton } from "@/components/auth/SubmitButton";
import type { MusicRightsBasis } from "@/constants/legal";
import { MUSIC_RIGHTS_BASES } from "@/constants/legal";
import {
  ACCEPTED_AUDIO,
  ACCEPTED_IMAGE,
  CONTENT_STATUSES,
  formatDuration,
  EMPTY_TRACK_DISCOVERY_METADATA,
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

export interface SingleUploadValues {
  title: string;
  primary_artist_name: string;
  featured_artists: string;
  description: string;
  genre: string;
  release_date: string;
  is_featured: boolean;
  status: ContentStatus;
  audio: File | null;
  cover: File | null;
  duration_sec: number;
  rights_basis: MusicRightsBasis;
  rights_confirmed: boolean;
  discovery_metadata: TrackDiscoveryMetadata;
  visibility: TrackVisibility;
  playback_mode: TrackPlaybackMode;
  preview_duration_sec: 15 | 30 | 45 | 60;
  preview_start_sec: number;
  allow_download: boolean;
  workspace_category: TrackWorkspaceCategory;
  production_stage: TrackProductionStage;
}

interface Props {
  onSubmit: (values: SingleUploadValues) => Promise<void>;
  submitting?: boolean;
  defaultRightsBasis: MusicRightsBasis;
  advancedWorkflow?: boolean;
}

const empty = (defaultRightsBasis: MusicRightsBasis): SingleUploadValues => ({
  title: "",
  primary_artist_name: "",
  featured_artists: "",
  description: "",
  genre: "",
  release_date: "",
  is_featured: false,
  status: "draft",
  audio: null,
  cover: null,
  duration_sec: 0,
  rights_basis: defaultRightsBasis,
  rights_confirmed: true,
  discovery_metadata: EMPTY_TRACK_DISCOVERY_METADATA,
  visibility: "private",
  playback_mode: "full",
  preview_duration_sec: 30,
  preview_start_sec: 0,
  allow_download: false,
  workspace_category: "work_in_progress",
  production_stage: "idea",
});

export function MusicUploadForm({
  onSubmit,
  submitting,
  defaultRightsBasis,
  advancedWorkflow = false,
}: Props) {
  const [values, setValues] = useState<SingleUploadValues>(() =>
    empty(defaultRightsBasis),
  );
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [optional, setOptional] = useState({
    credits: false,
    discovery: false,
    release: false,
    promotion: false,
    rights: false,
  });

  const update = <K extends keyof SingleUploadValues>(
    key: K,
    val: SingleUploadValues[K],
  ) => setValues((v) => ({ ...v, [key]: val }));

  const handleAudio = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const dur = await readAudioDuration(file);
    setValues((v) => ({
      ...v,
      audio: file,
      duration_sec: dur,
      title: v.title || file.name.replace(/\.[^.]+$/, ""),
    }));
  };

  const handleCover = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    update("cover", file);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.audio) return toast.error("Please select an audio file");
    if (!values.title.trim()) return toast.error("Title is required");
    if (!values.primary_artist_name.trim())
      return toast.error("Primary artist is required");
    try {
      await onSubmit(values);
      setValues(empty(defaultRightsBasis));
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
      toast.success("Track uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <form id="upload-track-form" onSubmit={submit} className="space-y-4 pb-20 min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:items-start min-[900px]:gap-4 min-[900px]:space-y-0">
      <ProfileCard
        title="Start with the essentials"
        description="Only the audio file, song title, and primary artist are required. Add everything else now or return later."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FilePicker
            label="Audio file"
            accept={ACCEPTED_AUDIO}
            file={values.audio}
            onChange={handleAudio}
            icon={<Music2 className="h-5 w-5" />}
            hint={
              values.audio
                ? `${formatDuration(values.duration_sec)} · ${(values.audio.size / (1024 * 1024)).toFixed(1)} MB`
                : "MP3 · your plan limit is checked before upload"
            }
          />
          <FilePicker
            label="Cover art"
            accept={ACCEPTED_IMAGE}
            file={values.cover}
            onChange={handleCover}
            icon={<ImageIcon className="h-5 w-5" />}
            preview={coverPreview}
            hint="JPG, PNG or WebP — up to 2MB"
          />
        </div>
      </ProfileCard>
      {advancedWorkflow ? <ProfileCard
        title="Place this song in your workspace"
        description="Choose where this song belongs in your workflow and how far along it is. You can change either setting later."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Where should this song be organized?">
            <Select
              value={values.workspace_category}
              onValueChange={(value) =>
                update("workspace_category", value as TrackWorkspaceCategory)
              }
            >
              <SelectTrigger>
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
          </Field>

          <Field label="How far along is this song?">
            <Select
              value={values.production_stage}
              onValueChange={(value) =>
                update("production_stage", value as TrackProductionStage)
              }
            >
              <SelectTrigger>
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
          </Field>
        </div>

        <p className="mt-2 text-xs leading-5 text-muted-foreground min-[900px]:leading-4">
          Category, production stage, and listening access are separate settings.
        </p>
      </ProfileCard> : null}

      <ProfileCard
        title="Who can find and hear this song?"
        description="Control who can find this song and whether listeners receive the full recording, a separate preview file, or no playback."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Visibility">
            <Select
              value={values.visibility}
              onValueChange={(value) =>
                update("visibility", value as TrackVisibility)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - shown on your public pages</SelectItem>
                <SelectItem value="unlisted">Shareable - hidden, available by link</SelectItem>
                <SelectItem value="private">Private - only you can manage it</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Playback">
            <Select
              value={values.playback_mode}
              onValueChange={(value) =>
                update("playback_mode", value as TrackPlaybackMode)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full song</SelectItem>
                <SelectItem value="preview">Preview only</SelectItem>
                <SelectItem value="none">Visible, no playback</SelectItem>
                <SelectItem value="membership_only">Membership only</SelectItem>
                <SelectItem value="approved_listeners">
                  Approved listeners
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {values.playback_mode === "preview" ? (
            <>
              <Field label="Preview length">
                <Select
                  value={String(values.preview_duration_sec)}
                  onValueChange={(value) =>
                    update(
                      "preview_duration_sec",
                      Number(value) as 15 | 30 | 45 | 60,
                    )
                  }
                >
                  <SelectTrigger>
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
              </Field>
              <Field label="Preview starts at (seconds)">
                <Input
                  type="number"
                  min={0}
                  max={Math.max(0, values.duration_sec - 1)}
                  value={values.preview_start_sec}
                  onChange={(event) =>
                    update(
                      "preview_start_sec",
                      Math.max(0, Number(event.target.value) || 0),
                    )
                  }
                />
              </Field>
            </>
          ) : null}
          <label className="flex items-center gap-3 rounded-xl border border-border/70 p-3 text-sm">
            <Switch
              checked={values.allow_download}
              onCheckedChange={(checked) => update("allow_download", checked)}
            />
            Allow an authorized download button
          </label>
        </div>
      </ProfileCard>

      <ProfileCard title="Required song information">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <Input
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Song title"
            />
          </Field>
          <Field label="Primary performing artist">
            <Input
              value={values.primary_artist_name}
              onChange={(e) => update("primary_artist_name", e.target.value)}
              placeholder="e.g. Poppa"
            />
          </Field>
          <Field label="Library status">
            <Select
              value={values.status}
              onValueChange={(v) => update("status", v as ContentStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </ProfileCard>

      <div className="min-[900px]:col-span-2">
        <ProfileCard
          title="Optional information"
          description="Choose only the sections you want to complete. Blank sections can be added from your Music Library later."
        >
        <div className="grid gap-3 sm:grid-cols-2 min-[1100px]:grid-cols-3">
          {[
            ["credits", "Credits and collaborators"],
            ["discovery", "Genre and discovery"],
            ["release", "Release information"],
            ["promotion", "Story and profile promotion"],
            ["rights", "Different rights category for this song"],
          ].map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 p-3 text-sm"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={optional[key as keyof typeof optional]}
                onChange={(event) =>
                  setOptional((current) => ({
                    ...current,
                    [key]: event.target.checked,
                  }))
                }
              />
              {label}
            </label>
          ))}
        </div>

        {optional.credits && (
          <Field label="Additional / featured artists">
            <Input
              value={values.featured_artists}
              onChange={(e) => update("featured_artists", e.target.value)}
              placeholder="Jerzo, Calliope Slim"
            />
          </Field>
        )}
        {optional.discovery && (
          <div className="grid gap-4 md:grid-cols-2 min-[1100px]:grid-cols-3">
            <Field label="Genre">
              <Input
                value={values.genre}
                onChange={(e) => update("genre", e.target.value)}
                placeholder="e.g. Indie"
              />
            </Field>
            <Field label="Mood tags">
              <Input
                value={values.discovery_metadata.mood_tags.join(", ")}
                onChange={(event) =>
                  update("discovery_metadata", {
                    ...values.discovery_metadata,
                    mood_tags: event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .slice(0, 12),
                  })
                }
                placeholder="Reflective, energetic, late night"
              />
            </Field>
            <Field label="Artist or song location">
              <Input
                value={values.discovery_metadata.location}
                onChange={(event) =>
                  update("discovery_metadata", {
                    ...values.discovery_metadata,
                    location: event.target.value,
                  })
                }
                placeholder="Philadelphia, PA"
              />
            </Field>
            <Field label="Where the song appeared">
              <Input
                value={values.discovery_metadata.placement_platform}
                onChange={(event) =>
                  update("discovery_metadata", {
                    ...values.discovery_metadata,
                    placement_platform: event.target.value,
                  })
                }
                placeholder="Tubi, YouTube, podcast, advertisement"
              />
            </Field>
            <Field label="Movie, show, video, or project title">
              <Input
                value={values.discovery_metadata.placement_title}
                onChange={(event) =>
                  update("discovery_metadata", {
                    ...values.discovery_metadata,
                    placement_title: event.target.value,
                  })
                }
                placeholder="Title of the production"
              />
            </Field>
            <div className="md:col-span-2 min-[1100px]:col-span-3">
              <Field label="Scene, episode, or placement details">
              <Textarea
                rows={3}
                value={values.discovery_metadata.placement_details}
                onChange={(event) =>
                  update("discovery_metadata", {
                    ...values.discovery_metadata,
                    placement_details: event.target.value,
                  })
                }
                placeholder="Episode, scene, timestamp, or anything a listener may remember"
              />
              </Field>
            </div>
          </div>
        )}
        {optional.release && (
          <Field label="Release date">
            <Input
              type="date"
              value={values.release_date}
              onChange={(e) => update("release_date", e.target.value)}
            />
          </Field>
        )}
        {optional.promotion && (
          <>
            <Field label="Description">
              <Textarea
                rows={4}
                value={values.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Tell listeners about this song…"
              />
            </Field>
            <div className="flex items-center justify-between rounded-md border border-border/50 p-3">
              <div>
                <Label className="text-sm">Make this my profile lead</Label>
                <p className="text-xs text-muted-foreground">
                  It will replace the current lead song on your public page.
                </p>
              </div>
              <Switch
                checked={values.is_featured}
                onCheckedChange={(c) => update("is_featured", c)}
              />
            </div>
          </>
        )}
        {optional.rights && (
          <Field label="Rights category for this song">
            <Select
              value={values.rights_basis}
              onValueChange={(value) =>
                update("rights_basis", value as MusicRightsBasis)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MUSIC_RIGHTS_BASES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        </ProfileCard>
      </div>

      <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-8">
        <SubmitButton
          loading={submitting}
          className="w-auto bg-gradient-brand px-6 text-primary-foreground shadow-elevated min-[900px]:px-5"
        >
          <Upload className="mr-2 h-4 w-4" /> Upload track
        </SubmitButton>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function FilePicker({
  label,
  accept,
  file,
  onChange,
  icon,
  hint,
  preview,
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  hint?: string;
  preview?: string | null;
}) {
  return (
    <label className="flex cursor-pointer flex-col gap-2 rounded-md border border-dashed border-border/70 p-4 transition hover:border-primary/60 min-[900px]:p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </div>
      {preview && (
        <img
          src={preview}
          alt=""
          className="h-24 w-24 rounded-md object-cover min-[900px]:h-20 min-[900px]:w-20"
        />
      )}
      <p className="text-xs text-muted-foreground">{file ? file.name : hint}</p>
      <Input
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
      />
      <Button type="button" variant="outline" size="sm" asChild>
        <span>{file ? "Replace file" : "Choose file"}</span>
      </Button>
    </label>
  );
}
