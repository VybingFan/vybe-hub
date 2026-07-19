import { ProfileCard } from "@/components/profile/ProfileCard";
import { SocialLinksDisplay } from "@/components/socialLinks/SocialLinksDisplay";
import type { CreatorProfile } from "@/features/profile/schema";

interface Props {
  profile: Partial<CreatorProfile> | null;
}

export function ProfileView({ profile }: Props) {
  const bio = profile?.bio?.trim();
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <ProfileCard title="About">
          {bio ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {bio}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No bio yet. Click "Edit profile" to tell supporters your story.
            </p>
          )}
        </ProfileCard>
        <ProfileCard title="Links">
          <SocialLinksDisplay profile={profile ?? {}} />
        </ProfileCard>
      </div>
      <div className="space-y-6">
        <ProfileCard title="Details">
          <dl className="space-y-3 text-sm">
            <Row label="Artist name" value={profile?.artist_name} />
            <Row
              label="VYBE username"
              value={profile?.username ? `@${profile.username}` : undefined}
            />
            <Row label="Display name" value={profile?.display_name} />
            <Row label="Genre" value={profile?.genre} />
            <Row label="Location" value={profile?.location} />
            <Row label="Merch store" value={profile?.merch_url ? "Connected" : undefined} />
          </dl>
        </ProfileCard>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value || "—"}</dd>
    </div>
  );
}
