import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { SocialLinksForm } from "@/components/socialLinks/SocialLinksForm";
import { TagInput } from "@/components/supporter/TagInput";
import { supporterProfileService } from "@/services/supporter/supporterProfileService";
import {
  supporterProfileSchema, emptySupporterProfile, SUPPORTER_SOCIAL_FIELDS,
  type SupporterProfile, type SupporterProfileInput,
} from "@/features/supporter/schema";
import type { CreatorProfileInput } from "@/features/profile/schema";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";

interface Props {
  initial: SupporterProfile | null;
  userId: string;
  onSubmit: (input: SupporterProfileInput) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function SupporterProfileForm({ initial, userId, onSubmit, onCancel, submitting }: Props) {
  const defaults: SupporterProfileInput = initial ? { ...emptySupporterProfile, ...initial } : emptySupporterProfile;
  const { register, control, watch, setValue, handleSubmit, formState: { errors } } =
    useForm<SupporterProfileInput>({ resolver: zodResolver(supporterProfileSchema), defaultValues: defaults });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarPreview = watch("avatar_url");
  const bio = watch("bio") ?? "";

  const uploadAvatar = async (file?: File) => {
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const result = await supporterProfileService.uploadAvatar(userId, file);
      setValue("avatar_path", result.path, { shouldDirty: true, shouldValidate: true });
      setValue("avatar_url", result.url, { shouldDirty: true, shouldValidate: true });
      toast.success("Profile photo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const submit = handleSubmit(async (values) => {
    try { await onSubmit(values); toast.success("Profile saved"); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed to save profile"); }
  });

  return (
    <form onSubmit={submit} className="space-y-6">
      <ProfileCard
        title="Your supporter identity"
        description="This is how you show up across VYBE when you follow, comment, save, and join communities."
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <label className="group relative block h-28 w-28 shrink-0 cursor-pointer overflow-hidden rounded-3xl border-4 border-card bg-muted shadow-elevated">
            <img
              src={avatarPreview || "/avatars/default-avatar.png"}
              alt="Supporter profile preview"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
              {uploadingAvatar ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploadingAvatar}
              onChange={(event) => void uploadAvatar(event.target.files?.[0])}
            />
          </label>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Profile picture</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Click the image to upload a JPG, PNG, or WebP up to 8MB.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Display name" error={errors.display_name?.message}>
            <Input placeholder="e.g. Kay VYBE" {...register("display_name")} />
          </Field>
          <Field label="VYBE tag" error={errors.username?.message}>
            <div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input className="pl-7" placeholder="kayevybe" {...register("username")} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Your unique supporter tag across VYBE.</p>
            </div>
          </Field>
          <Field label="Location" error={errors.location?.message}>
            <Input placeholder="City, Country" {...register("location")} />
          </Field>
        </div>

        <Field label="Short bio" error={errors.bio?.message}>
          <Textarea rows={3} maxLength={1000} placeholder="Tell the VYBE community what you're into..." {...register("bio")} />
          <p className="text-right text-xs text-muted-foreground">{bio.length.toLocaleString()} / 1,000 characters</p>
        </Field>
      </ProfileCard>

      <ProfileCard title="Your interests" description="Help VYBE understand what you enjoy so discovery can get better over time.">
        <Field label="Favorite genres" error={errors.favorite_genres?.message}>
          <Controller control={control} name="favorite_genres" render={({ field }) => (
            <TagInput value={field.value} onChange={field.onChange} placeholder="Add a genre and press Enter" />
          )} />
        </Field>
        <Field label="Favorite artists" error={errors.favorite_artists?.message}>
          <Controller control={control} name="favorite_artists" render={({ field }) => (
            <TagInput value={field.value} onChange={field.onChange} placeholder="Add an artist and press Enter" />
          )} />
        </Field>
      </ProfileCard>

      <ProfileCard title="Links & socials" description="Optional — connect your accounts.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Website" error={errors.website?.message}>
            <Input placeholder="https://your-site.com" {...register("website")} />
          </Field>
          {SUPPORTER_SOCIAL_FIELDS.map((f) => (
            <Field key={f.key} label={f.label} error={errors[f.key as keyof SupporterProfileInput]?.message as string | undefined}>
              <Input placeholder={f.placeholder} {...register(f.key)} />
            </Field>
          ))}
        </div>
        <SocialLinksForm
          control={control as unknown as Control<CreatorProfileInput>}
          register={register as unknown as UseFormRegister<CreatorProfileInput>}
          errors={errors as unknown as FieldErrors<CreatorProfileInput>}
        />
      </ProfileCard>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting || uploadingAvatar}>Cancel</Button>
        <SubmitButton loading={submitting} disabled={uploadingAvatar} className="w-auto px-8">Save profile</SubmitButton>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
