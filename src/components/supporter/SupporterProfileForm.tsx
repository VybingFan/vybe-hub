import { useState } from "react";
import { useForm, Controller, useFieldArray, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { TagInput } from "@/components/supporter/TagInput";
import { supporterProfileService } from "@/services/supporter/supporterProfileService";
import {
  supporterProfileSchema, normalizeSupporterProfileInput, SUPPORTER_SOCIAL_FIELDS,
  type SupporterProfile, type SupporterProfileInput,
} from "@/features/supporter/schema";

interface Props {
  initial: SupporterProfile | null;
  userId: string;
  onSubmit: (input: SupporterProfileInput) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function SupporterProfileForm({ initial, userId, onSubmit, onCancel, submitting }: Props) {
  const defaults = normalizeSupporterProfileInput(initial);
  const { register, control, watch, setValue, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<SupporterProfileInput>({ resolver: zodResolver(supporterProfileSchema), defaultValues: defaults });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const { fields: personalLinks, append: appendLink, remove: removeLink } = useFieldArray({ control, name: "personal_links" });
  const avatarPreview = watch("avatar_url");
  const bio = watch("bio") ?? "";

  const uploadAvatar = async (file?: File) => {
    if (!file) return;
    setUploadingAvatar(true);
    setPhotoNotice(null);
    try {
      const result = await supporterProfileService.uploadAvatar(userId, file);
      setValue("avatar_path", result.path, { shouldDirty: true, shouldValidate: true });
      setValue("avatar_url", result.url, { shouldDirty: true, shouldValidate: true });
      setPhotoNotice("New photo ready. Select Save changes to apply it to your profile.");
      toast.success("Profile photo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
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
      const message = firstValidationMessage(validationErrors) ?? "Check the highlighted supporter profile fields before saving.";
      toast.error(`Profile wasn't saved: ${message}`);
      window.requestAnimationFrame(() => {
        const invalid = document.querySelector<HTMLElement>("[aria-invalid='true']");
        invalid?.scrollIntoView({ behavior: "smooth", block: "center" });
        invalid?.focus();
      });
    },
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="sticky top-20 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-background/95 p-3 shadow-elevated backdrop-blur">
        <div>
          <p className="font-semibold">Editing your supporter profile</p>
          <p className="text-xs text-muted-foreground">Make your changes, then select Save changes.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting || isSubmitting || uploadingAvatar}>Cancel</Button>
          <SubmitButton loading={submitting || isSubmitting} disabled={uploadingAvatar} className="w-auto px-6">Save changes</SubmitButton>
        </div>
      </div>
      <ProfileCard
        title="Your supporter identity"
        description="This is how you show up across VYBE when you follow, comment, save, and join communities."
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative block h-32 w-32 shrink-0 overflow-hidden rounded-3xl border-4 border-card bg-muted shadow-elevated">
            <img
              src={avatarPreview || "/avatars/default-avatar.png"}
              alt="Supporter profile preview"
              className="h-full w-full object-cover"
            />
            <span className="pointer-events-none absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/65 shadow-md">
              {uploadingAvatar ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Profile picture</p>
            <p className="mt-1 text-sm text-muted-foreground">
              JPG, PNG, or WebP up to 8MB.
            </p>
            <label htmlFor="supporter-avatar-upload" className="mt-3 inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90">
              {uploadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
              {uploadingAvatar ? "Uploading photo…" : avatarPreview ? "Change photo" : "Upload photo"}
            </label>
            <input id="supporter-avatar-upload" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadingAvatar} onChange={(event) => void uploadAvatar(event.target.files?.[0])} />
            {photoNotice && <p className="mt-3 flex items-start gap-2 text-sm font-medium text-emerald-500"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{photoNotice}</p>}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Display name" error={errors.display_name?.message}>
            <Input aria-invalid={!!errors.display_name} placeholder="e.g. Kay VYBE" {...register("display_name")} />
          </Field>
          <Field label="VYBE tag" error={errors.username?.message}>
            <div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input aria-invalid={!!errors.username} className="pl-7" placeholder="kayevybe" {...register("username")} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Your unique supporter tag across VYBE.</p>
            </div>
          </Field>
          <Field label="Location" error={errors.location?.message}>
            <Input aria-invalid={!!errors.location} placeholder="City, Country" {...register("location")} />
          </Field>
        </div>

        <Field label="Short bio" error={errors.bio?.message}>
          <Textarea aria-invalid={!!errors.bio} rows={3} maxLength={1000} placeholder="Tell the VYBE community what you're into..." {...register("bio")} />
          <p className="text-right text-xs text-muted-foreground">{bio.length.toLocaleString()} / 1,000 characters</p>
        </Field>
      </ProfileCard>

      <ProfileCard title="Your interests" description="Help VYBE understand what you enjoy so discovery can get better over time.">
        <Field label="Favorite genres" error={errors.favorite_genres?.message}>
          <Controller control={control} name="favorite_genres" render={({ field }) => (
            <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Add a genre and press Enter" />
          )} />
        </Field>
        <Field label="Favorite artists" error={errors.favorite_artists?.message}>
          <Controller control={control} name="favorite_artists" render={({ field }) => (
            <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Add an artist and press Enter" />
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
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div><Label>Personal links</Label><p className="text-xs text-muted-foreground">Add up to 10 optional links.</p></div>
            <Button type="button" variant="outline" size="sm" onClick={() => appendLink({ label: "", url: "" })} disabled={personalLinks.length >= 10}><Plus className="mr-1 h-4 w-4" />Add link</Button>
          </div>
          {personalLinks.map((field, index) => <div key={field.id} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
            <Input placeholder="Label" {...register(`personal_links.${index}.label`)} />
            <Input placeholder="https://…" {...register(`personal_links.${index}.url`)} />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(index)} aria-label={`Remove link ${index + 1}`}><Trash2 className="h-4 w-4" /></Button>
          </div>)}
        </div>
      </ProfileCard>

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

function firstValidationMessage(errors: FieldErrors<SupporterProfileInput>): string | undefined {
  for (const [key, error] of Object.entries(errors)) {
    if (!error) continue;
    if (typeof error.message === "string") return error.message;
    if (key !== "ref" && typeof error === "object") {
      const nested = firstValidationMessage(error as FieldErrors<SupporterProfileInput>);
      if (nested) return nested;
    }
  }
  return undefined;
}
