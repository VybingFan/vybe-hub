import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { SocialLinksForm } from "@/components/socialLinks/SocialLinksForm";
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
}

export function ProfileForm({ initial, onSubmit, onCancel, submitting }: Props) {
  const defaults: CreatorProfileInput = initial
    ? {
        username: initial.username ?? "",
        artist_name: initial.artist_name ?? "",
        display_name: initial.display_name ?? "",
        bio: initial.bio ?? "",
        genre: initial.genre ?? "",
        location: initial.location ?? "",
        avatar_url: initial.avatar_url ?? "",
        cover_url: initial.cover_url ?? "",
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
    handleSubmit,
    formState: { errors },
  } = useForm<CreatorProfileInput>({
    resolver: zodResolver(creatorProfileSchema),
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
          <Field label="Genre" error={errors.genre?.message}>
            <Input placeholder="e.g. Indie Electronic" {...register("genre")} />
          </Field>
          <Field label="Location" error={errors.location?.message}>
            <Input placeholder="City, Country" {...register("location")} />
          </Field>
        </div>
        <Field label="Bio" error={errors.bio?.message}>
          <Textarea rows={5} placeholder="Tell supporters your story…" {...register("bio")} />
        </Field>
      </ProfileCard>

      <ProfileCard title="Imagery" description="Profile photo and cover banner URLs.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Profile photo URL" error={errors.avatar_url?.message}>
            <Input placeholder="https://…" {...register("avatar_url")} />
          </Field>
          <Field label="Cover banner URL" error={errors.cover_url?.message}>
            <Input placeholder="https://…" {...register("cover_url")} />
          </Field>
        </div>
      </ProfileCard>

      <ProfileCard
        title="Links & socials"
        description="Website, social platforms, and custom links."
      >
        <Field label="Merch store URL" error={errors.merch_url?.message}>
          <Input placeholder="https://your-store.com" {...register("merch_url")} />
        </Field>
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
