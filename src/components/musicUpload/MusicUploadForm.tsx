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
import {
  ACCEPTED_AUDIO,
  ACCEPTED_IMAGE,
  CONTENT_STATUSES,
  formatDuration,
  type ContentStatus,
} from "@/features/music/schema";
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
}

interface Props {
  onSubmit: (values: SingleUploadValues) => Promise<void>;
  submitting?: boolean;
}

const empty: SingleUploadValues = {
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
};

export function MusicUploadForm({ onSubmit, submitting }: Props) {
  const [values, setValues] = useState<SingleUploadValues>(empty);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const update = <K extends keyof SingleUploadValues>(key: K, val: SingleUploadValues[K]) =>
    setValues((v) => ({ ...v, [key]: val }));

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
    if (!values.primary_artist_name.trim()) return toast.error("Primary artist is required");
    try {
      await onSubmit(values);
      setValues(empty);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
      toast.success("Track uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <ProfileCard title="Files" description="Upload the audio and cover art.">
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
                : "MP3, WAV, FLAC — up to 50MB"
            }
          />
          <FilePicker
            label="Cover art"
            accept={ACCEPTED_IMAGE}
            file={values.cover}
            onChange={handleCover}
            icon={<ImageIcon className="h-5 w-5" />}
            preview={coverPreview}
            hint="JPG, PNG or WebP — up to 8MB"
          />
        </div>
      </ProfileCard>

      <ProfileCard title="Details">
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
          <Field label="Additional / featured artists">
            <Input
              value={values.featured_artists}
              onChange={(e) => update("featured_artists", e.target.value)}
              placeholder="Jerzo, Calliope Slim"
            />
          </Field>
          <Field label="Genre">
            <Input
              value={values.genre}
              onChange={(e) => update("genre", e.target.value)}
              placeholder="e.g. Indie"
            />
          </Field>
          <Field label="Release date">
            <Input
              type="date"
              value={values.release_date}
              onChange={(e) => update("release_date", e.target.value)}
            />
          </Field>
          <Field label="Status">
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
          <Switch checked={values.is_featured} onCheckedChange={(c) => update("is_featured", c)} />
        </div>
      </ProfileCard>

      <div className="flex justify-end">
        <SubmitButton loading={submitting} className="w-auto px-8">
          <Upload className="mr-2 h-4 w-4" /> Upload track
        </SubmitButton>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
    <label className="flex cursor-pointer flex-col gap-2 rounded-md border border-dashed border-border/70 p-4 transition hover:border-primary/60">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </div>
      {preview && <img src={preview} alt="" className="h-24 w-24 rounded-md object-cover" />}
      <p className="text-xs text-muted-foreground">{file ? file.name : hint}</p>
      <Input type="file" accept={accept} onChange={onChange} className="hidden" />
      <Button type="button" variant="outline" size="sm" asChild>
        <span>{file ? "Replace file" : "Choose file"}</span>
      </Button>
    </label>
  );
}
