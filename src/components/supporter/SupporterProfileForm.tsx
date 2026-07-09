import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { SocialLinksForm } from "@/components/socialLinks/SocialLinksForm";
import { TagInput } from "@/components/supporter/TagInput";
import {
  supporterProfileSchema,
  emptySupporterProfile,
  SUPPORTER_SOCIAL_FIELDS,
  type SupporterProfile,
  type SupporterProfileInput,
} from "@/features/supporter/schema";
import type { CreatorProfileInput } from "@/features/profile/schema";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";

interface Props {
  initial: SupporterProfile | null;
  onSubmit: (input: SupporterProfileInput) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function SupporterProfileForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const defaults: SupporterProfileInput = initial
    ? { ...emptySupporterProfile, ...initial }
    : emptySupporterProfile;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SupporterProfileInput>({
    resolver: zodResolver(supporterProfileSchema),
    defaultValues: defaults,
  });

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
      <ProfileCard title="Basics" description="How you show up on VYBE.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Display name" error={errors.display_name?.message}>
            <Input placeholder="e.g. Alex Rivera" {...register("display_name")} />
          </Field>
          <Field label="Username" error={errors.username?.message}>
            <Input placeholder="unique_handle" {...register("username")} />
          </Field>
          <Field label="Location" error={errors.location?.message}>
            <Input placeholder="City, Country" {...register("location")} />
          </Field>
          <Field label="Profile photo URL" error={errors.avatar_url?.message}>
            <Input placeholder="https://…" {...register("avatar_url")} />
          </Field>
        </div>
        <Field label="Bio" error={errors.bio?.message}>
          <Textarea rows={4} placeholder="Tell creators what you're into…" {...register("bio")} />
        </Field>
      </ProfileCard>

      <ProfileCard title="Music taste" description="Help us surface artists you'll love.">
        <Field label="Favorite genres" error={errors.favorite_genres?.message}>
          <Controller
            control={control}
            name="favorite_genres"
            render={({ field }) => (
              <TagInput value={field.value} onChange={field.onChange} placeholder="Add a genre and press Enter" />
            )}
          />
        </Field>
        <Field label="Favorite artists" error={errors.favorite_artists?.message}>
          <Controller
            control={control}
            name="favorite_artists"
            render={({ field }) => (
              <TagInput value={field.value} onChange={field.onChange} placeholder="Add an artist and press Enter" />
            )}
          />
        </Field>
      </ProfileCard>

      <ProfileCard title="Links & socials" description="Optional — connect your accounts.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Website" error={errors.website?.message}>
            <Input placeholder="https://your-site.com" {...register("website")} />
          </Field>
          {SUPPORTER_SOCIAL_FIELDS.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              error={errors[f.key as keyof SupporterProfileInput]?.message as string | undefined}
            >
              <Input placeholder={f.placeholder} {...register(f.key)} />
            </Field>
          ))}
        </div>
        {/* Reuse creator personal links UI by casting; both schemas share the shape */}
        <SocialLinksForm
          control={control as unknown as Control<CreatorProfileInput>}
          register={register as unknown as UseFormRegister<CreatorProfileInput>}
          errors={errors as unknown as FieldErrors<CreatorProfileInput>}
        />
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
