import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { SocialLinksForm } from "@/components/socialLinks/SocialLinksForm";
import { GenrePicker } from "@/components/profile/GenrePicker";
import { Camera, Loader2 } from "lucide-react";
import { creatorProfileService } from "@/services/profile/creatorProfileService";
import {
  creatorProfileSchema,
  emptyCreatorProfile,
  type CreatorProfile,
  type CreatorProfileInput,
} from "@/features/profile/schema";

interface Props {
  initial: CreatorProfile | null;
  onSubmit: (input: CreatorProfileInput) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  userId: string;
}

export function ProfileForm({ initial, onSubmit, onCancel, submitting, userId }: Props) {
  const defaults: CreatorProfileInput = initial
    ? {
        username: initial.username ?? "",
        artist_name: initial.artist_name ?? "",
        display_name: initial.display_name ?? "",
        bio: initial.bio ?? "",
        genre: initial.genre ?? "",
        genres: initial.genres?.length ? initial.genres : initial.genre ? [initial.genre] : [],
        location: initial.location ?? "",
        avatar_url: initial.avatar_url ?? "",
        cover_url: initial.cover_url ?? "",
        avatar_path: initial.avatar_path ?? null,
        cover_path: initial.cover_path ?? null,
        website: initial.website ?? "",
        merch_url: initial.merch_url ?? "",
        instagram: initial.instagram ?? "",
        facebook: initial.facebook ?? "",
        tiktok: initial.tiktok ?? "",
        youtube: initial.youtube ?? "",
        spotify: initial.spotify ?? "",
        apple_music: initial.apple_music ?? "",
        x: initial.x ?? "",
        personal_links: initial.personal_links ?? [],
      }
    : emptyCreatorProfile;

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatorProfileInput>({
    resolver: zodResolver(creatorProfileSchema),
    defaultValues: defaults,
  });
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const avatarPreview = watch("avatar_url");
  const coverPreview = watch("cover_url");
  const upload = async (kind: "avatar" | "cover", file?: File) => {
    if (!file) return;
    setUploading(kind);
    try {
      const result = await creatorProfileService.uploadImage(userId, kind, file);
      setValue(`${kind}_path`, result.path, { shouldDirty: true });
      setValue(`${kind}_url`, result.url, { shouldDirty: true });
      toast.success(`${kind === "avatar" ? "Profile photo" : "Cover photo"} uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    }
  });

  return (
    <form onSubmit={submit} className="space-y-6">
      <ProfileCard title="Basics" description="Your public identity on VYBE.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="VYBE username" error={errors.username?.message}>
            <div>
              <Input placeholder="jordanbanks" {...register("username")} />
              <p className="mt-1 text-xs text-muted-foreground">
                Your public page: /artist/your-username
              </p>
            </div>
          </Field>
          <Field label="Artist name" error={errors.artist_name?.message}>
            <Input placeholder="e.g. Night Wolf" {...register("artist_name")} />
          </Field>
          <Field label="Display name" error={errors.display_name?.message}>
            <Input placeholder="Shown alongside your artist name" {...register("display_name")} />
          </Field>
          <Field label="Genres" error={errors.genres?.message}>
            <Controller
              control={control}
              name="genres"
              render={({ field }) => (
                <GenrePicker
                  value={field.value}
                  onChange={(genres) => {
                    field.onChange(genres);
                    setValue("genre", genres[0] ?? "");
                  }}
                />
              )}
            />
          </Field>
          <Field label="Location" error={errors.location?.message}>
            <Input placeholder="City, Country" {...register("location")} />
          </Field>
        </div>
        <Field label="Bio" error={errors.bio?.message}>
          <Textarea rows={5} placeholder="Tell supporters your story…" {...register("bio")} />
        </Field>
      </ProfileCard>

      <ProfileCard
        title="Imagery"
        description="Click either image to upload JPG, PNG, or WebP (up to 8MB)."
      >
        <label className="group relative block h-52 cursor-pointer overflow-hidden rounded-2xl border border-border bg-muted">
          <img
            src={coverPreview || "/banners/default-creator-banner.png"}
            alt="Cover preview"
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
            {uploading === "cover" ? (
              <Loader2 className="animate-spin text-white" />
            ) : (
              <span className="flex items-center gap-2 text-sm font-medium text-white">
                <Camera className="h-5 w-5" /> Change cover
              </span>
            )}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => upload("cover", event.target.files?.[0])}
          />
        </label>
        <label className="group relative -mt-14 ml-6 block h-28 w-28 cursor-pointer overflow-hidden rounded-3xl border-4 border-card bg-muted shadow-elevated">
          <img
            src={avatarPreview || "/avatars/default-avatar.png"}
            alt="Profile preview"
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
            {uploading === "avatar" ? (
              <Loader2 className="animate-spin text-white" />
            ) : (
              <Camera className="text-white" />
            )}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => upload("avatar", event.target.files?.[0])}
          />
        </label>
      </ProfileCard>

      <ProfileCard
        title="Links & socials"
        description="Website, social platforms, and custom links."
      >
        <SocialLinksForm control={control} register={register} errors={errors} />
      </ProfileCard>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <SubmitButton loading={submitting} className="w-auto px-8">
          Save profile
        </SubmitButton>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
