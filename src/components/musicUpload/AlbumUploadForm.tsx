import { useState, type ChangeEvent } from "react";
import { Plus, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
  type ContentStatus,
} from "@/features/music/schema";
import { readAudioDuration } from "@/services/music/musicService";

export interface AlbumTrackDraft {
  title: string;
  audio: File;
  duration_sec: number;
}

export interface AlbumUploadValues {
  title: string;
  primary_artist_name: string;
  featured_artists: string;
  description: string;
  genre: string;
  release_date: string;
  status: ContentStatus;
  cover: File | null;
  tracks: AlbumTrackDraft[];
  rights_basis: MusicRightsBasis;
  rights_confirmed: boolean;
}

interface Props {
  onSubmit: (values: AlbumUploadValues) => Promise<void>;
  submitting?: boolean;
  defaultRightsBasis: MusicRightsBasis;
}

const empty = (defaultRightsBasis: MusicRightsBasis): AlbumUploadValues => ({
  title: "",
  primary_artist_name: "",
  featured_artists: "",
  description: "",
  genre: "",
  release_date: "",
  status: "draft",
  cover: null,
  tracks: [],
  rights_basis: defaultRightsBasis,
  rights_confirmed: true,
});

export function AlbumUploadForm({
  onSubmit,
  submitting,
  defaultRightsBasis,
}: Props) {
  const [values, setValues] = useState<AlbumUploadValues>(() =>
    empty(defaultRightsBasis),
  );
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);
  const [showRightsCategory, setShowRightsCategory] = useState(false);

  const update = <K extends keyof AlbumUploadValues>(
    key: K,
    val: AlbumUploadValues[K],
  ) => setValues((v) => ({ ...v, [key]: val }));

  const handleCover = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    update("cover", file);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  const addTracks = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const drafts: AlbumTrackDraft[] = [];
    for (const f of files) {
      const dur = await readAudioDuration(f);
      drafts.push({
        title: f.name.replace(/\.[^.]+$/, ""),
        audio: f,
        duration_sec: dur,
      });
    }
    setValues((v) => ({ ...v, tracks: [...v.tracks, ...drafts] }));
    e.target.value = "";
  };

  const updateTrack = (i: number, patch: Partial<AlbumTrackDraft>) =>
    setValues((v) => ({
      ...v,
      tracks: v.tracks.map((t, idx) => (idx === i ? { ...t, ...patch } : t)),
    }));

  const removeTrack = (i: number) =>
    setValues((v) => ({
      ...v,
      tracks: v.tracks.filter((_, idx) => idx !== i),
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) return toast.error("Album title is required");
    if (!values.primary_artist_name.trim())
      return toast.error("Primary artist is required");
    if (values.tracks.length === 0)
      return toast.error("Add at least one track");
    try {
      await onSubmit(values);
      setValues(empty(defaultRightsBasis));
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
      toast.success("Album uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <form id="upload-album-form" onSubmit={submit} className="space-y-4 pb-20">
      <ProfileCard
        title="Album essentials"
        description="Start with the album title, primary artist, and audio files. Complete other information now or later."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Primary performing artist</Label>
            <Input
              value={values.primary_artist_name}
              onChange={(e) => update("primary_artist_name", e.target.value)}
              placeholder="Artist or group name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
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
          </div>
        </div>
        <label className="flex cursor-pointer flex-col gap-2 rounded-md border border-dashed border-border/70 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ImageIcon className="h-5 w-5" /> Cover art
          </div>
          {coverPreview && (
            <img
              src={coverPreview}
              alt=""
              className="h-24 w-24 rounded-md object-cover"
            />
          )}
          <p className="text-xs text-muted-foreground">
            {values.cover?.name || "JPG, PNG or WebP"}
          </p>
          <Input
            type="file"
            accept={ACCEPTED_IMAGE}
            onChange={handleCover}
            className="hidden"
          />
          <Button type="button" variant="outline" size="sm" asChild>
            <span>{values.cover ? "Replace" : "Choose file"}</span>
          </Button>
        </label>
      </ProfileCard>

      <ProfileCard
        title="Optional album information"
        description="Open only the sections you want to complete."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 p-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={showOptional}
              onChange={(event) => setShowOptional(event.target.checked)}
            />
            Credits, genre, date, and description
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 p-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={showRightsCategory}
              onChange={(event) => setShowRightsCategory(event.target.checked)}
            />
            Different rights category for this album
          </label>
        </div>
        {showOptional && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Additional / featured artists</Label>
              <Input
                value={values.featured_artists}
                onChange={(e) => update("featured_artists", e.target.value)}
                placeholder="Separate names with commas"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Genre</Label>
              <Input
                value={values.genre}
                onChange={(e) => update("genre", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Release date</Label>
              <Input
                type="date"
                value={values.release_date}
                onChange={(e) => update("release_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={values.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
          </div>
        )}
        {showRightsCategory && (
          <div className="space-y-1.5">
            <Label>Rights category for this album</Label>
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
          </div>
        )}
      </ProfileCard>

      <ProfileCard
        title="Track list"
        description="Add audio files in the order they should play."
        action={
          <Button type="button" variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              <Plus className="mr-1 h-4 w-4" /> Add tracks
              <input
                type="file"
                accept={ACCEPTED_AUDIO}
                multiple
                onChange={addTracks}
                className="hidden"
              />
            </label>
          </Button>
        }
      >
        {values.tracks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tracks added yet.</p>
        ) : (
          <ol className="space-y-2">
            {values.tracks.map((t, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-md border border-border/50 p-3"
              >
                <span className="w-6 text-sm tabular-nums text-muted-foreground">
                  {i + 1}.
                </span>
                <Input
                  value={t.title}
                  onChange={(e) => updateTrack(i, { title: e.target.value })}
                  className="flex-1"
                />
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatDuration(t.duration_sec)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTrack(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ol>
        )}
      </ProfileCard>

      <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-8">
        <SubmitButton
          loading={submitting}
          className="w-auto bg-gradient-brand px-6 text-primary-foreground shadow-elevated"
        >
          <Upload className="mr-2 h-4 w-4" /> Upload album
        </SubmitButton>
      </div>
    </form>
  );
}
