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
  description: string;
  genre: string;
  release_date: string;
  status: ContentStatus;
  cover: File | null;
  tracks: AlbumTrackDraft[];
}

interface Props {
  onSubmit: (values: AlbumUploadValues) => Promise<void>;
  submitting?: boolean;
}

const empty: AlbumUploadValues = {
  title: "",
  description: "",
  genre: "",
  release_date: "",
  status: "draft",
  cover: null,
  tracks: [],
};

export function AlbumUploadForm({ onSubmit, submitting }: Props) {
  const [values, setValues] = useState<AlbumUploadValues>(empty);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const update = <K extends keyof AlbumUploadValues>(key: K, val: AlbumUploadValues[K]) =>
    setValues((v) => ({ ...v, [key]: val }));

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
      drafts.push({ title: f.name.replace(/\.[^.]+$/, ""), audio: f, duration_sec: dur });
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
    setValues((v) => ({ ...v, tracks: v.tracks.filter((_, idx) => idx !== i) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) return toast.error("Album title is required");
    if (values.tracks.length === 0) return toast.error("Add at least one track");
    try {
      await onSubmit(values);
      setValues(empty);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
      toast.success("Album uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <ProfileCard title="Album details">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={values.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Genre</Label>
            <Input value={values.genre} onChange={(e) => update("genre", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Release date</Label>
            <Input type="date" value={values.release_date} onChange={(e) => update("release_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={values.status} onValueChange={(v) => update("status", v as ContentStatus)}>
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
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea rows={4} value={values.description} onChange={(e) => update("description", e.target.value)} />
        </div>
        <label className="flex cursor-pointer flex-col gap-2 rounded-md border border-dashed border-border/70 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ImageIcon className="h-5 w-5" /> Cover art
          </div>
          {coverPreview && <img src={coverPreview} alt="" className="h-24 w-24 rounded-md object-cover" />}
          <p className="text-xs text-muted-foreground">{values.cover?.name || "JPG, PNG or WebP"}</p>
          <Input type="file" accept={ACCEPTED_IMAGE} onChange={handleCover} className="hidden" />
          <Button type="button" variant="outline" size="sm" asChild>
            <span>{values.cover ? "Replace" : "Choose file"}</span>
          </Button>
        </label>
      </ProfileCard>

      <ProfileCard
        title="Track list"
        description="Add audio files in the order they should play."
        action={
          <Button type="button" variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              <Plus className="mr-1 h-4 w-4" /> Add tracks
              <input type="file" accept={ACCEPTED_AUDIO} multiple onChange={addTracks} className="hidden" />
            </label>
          </Button>
        }
      >
        {values.tracks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tracks added yet.</p>
        ) : (
          <ol className="space-y-2">
            {values.tracks.map((t, i) => (
              <li key={i} className="flex items-center gap-3 rounded-md border border-border/50 p-3">
                <span className="w-6 text-sm tabular-nums text-muted-foreground">{i + 1}.</span>
                <Input
                  value={t.title}
                  onChange={(e) => updateTrack(i, { title: e.target.value })}
                  className="flex-1"
                />
                <span className="text-xs tabular-nums text-muted-foreground">{formatDuration(t.duration_sec)}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeTrack(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ol>
        )}
      </ProfileCard>

      <div className="flex justify-end">
        <SubmitButton loading={submitting} className="w-auto px-8">
          <Upload className="mr-2 h-4 w-4" /> Upload album
        </SubmitButton>
      </div>
    </form>
  );
}
