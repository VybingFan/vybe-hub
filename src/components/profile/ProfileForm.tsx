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
import type { CreatorPlanCode } from "@/features/membership/catalog";
import { getCreatorEntitlements } from "@/features/membership/entitlements";
import { hasCreatorCapability } from "@/features/membership/access";
import { LockedFeatureCard } from "@/components/membership/LockedFeatureCard";

interface Props {
  initial: CreatorProfile | null;
  onSubmit: (input: CreatorProfileInput) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  userId: string;
  planCode?: CreatorPlanCode;
}

export function ProfileForm({ initial, onSubmit, onCancel, submitting, userId, planCode }: Props) {
  const entitlements = getCreatorEntitlements(planCode);
  const customCover = hasCreatorCapability(planCode, "profile.custom_cover");
  const multipleGenres = hasCreatorCapability(planCode, "profile.multiple_genres");
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
  const bio = watch("bio") ?? "";
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

  const submit = handleSubmit(
    async (values) => {
      try {
        await onSubmit(values);
        toast.success("Profile saved");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save profile");
      }
    },
    (validationErrors) => {
      const firstError = Object.values(validationErrors).find((error) => error?.message);
      toast.error(
        typeof firstError?.message === "string"
          ? firstError.message
          : "Check the highlighted profile fields before saving.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">
            Creator profile
          </p>
          <h1 className="mt-1 text-3xl font-semibold">Edit your public profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Changes appear publicly after you select Save profile.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>

      <ProfileCard
        title="Profile and cover images"
        description="Click either image to upload. Cover: 1600 × 400 px recommended. Profile: 800 × 800 px recommended. JPG, PNG, or WebP up to 8MB. Keep important details centered for mobile cropping."
      >
        {customCover ? <label className="group relative block h-52 cursor-pointer overflow-hidden rounded-2xl border border-border bg-muted">
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
        </label> : <LockedFeatureCard compact title="Custom cover begins with Creator Plus" description="Creator Free uses the standard VYBE profile header." requiredPlan="creator_plus" />}
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

      <ProfileCard title="Basics" description="Your public identity on VYBE.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="VYBE username (your unique link)" error={errors.username?.message}>
            <div>
              <Input placeholder="jordanbanks" {...register("username")} />
              <p className="mt-1 text-xs text-muted-foreground">
                Lowercase and unique. Your public link will be /artist/your-username.
              </p>
            </div>
          </Field>
          <Field label="Artist name" error={errors.artist_name?.message}>
            <div>
              <Input placeholder="e.g. Night Wolf" {...register("artist_name")} />
              <p className="mt-1 text-xs text-muted-foreground">
                Your primary public artist, band, creator, or business name.
              </p>
            </div>
          </Field>
          <Field label="Secondary public name" error={errors.display_name?.message}>
            <div>
              <Input
                placeholder="e.g. Jordan Banks or Night Wolf Music"
                {...register("display_name")}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Shown beneath the artist name. Use your name, group, or team name—not private legal
                information.
              </p>
            </div>
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
                  max={multipleGenres ? 5 : 1}
                />
              )}
            />
          </Field>
          <Field label="Location" error={errors.location?.message}>
            <Input placeholder="City, Country" {...register("location")} />
          </Field>
        </div>
        <Field label="Bio" error={errors.bio?.message}>
          <Textarea
            rows={5}
            maxLength={1000}
            placeholder="Tell supporters your story…"
            {...register("bio")}
          />
          <p className="text-right text-xs text-muted-foreground">
            {bio.length.toLocaleString()} / 1,000 characters
          </p>
        </Field>
      </ProfileCard>

      <ProfileCard
        title="Links & socials"
        description={`Website, social platforms, and custom links. Your membership displays up to ${entitlements.limits.publicLinks} public link${entitlements.limits.publicLinks === 1 ? "" : "s"}.`}
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
