import { Badge } from "@/components/ui/badge";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { SocialLinksDisplay } from "@/components/socialLinks/SocialLinksDisplay";
import type { SupporterProfile } from "@/features/supporter/schema";

interface Props {
  profile: Partial<SupporterProfile> | null;
}

export function SupporterProfileView({ profile }: Props) {
  const bio = profile?.bio?.trim();
  const genres = Array.isArray(profile?.favorite_genres) ? profile.favorite_genres : [];
  const artists = Array.isArray(profile?.favorite_artists) ? profile.favorite_artists : [];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <ProfileCard title="About">
          {bio ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{bio}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Add a short bio so creators know who's tuning in.</p>
          )}
        </ProfileCard>
        <ProfileCard title="Music taste">
          <TagList label="Favorite genres" tags={genres} />
          <TagList label="Favorite artists" tags={artists} />
        </ProfileCard>
        <ProfileCard title="Links">
          <SocialLinksDisplay profile={profile as never} />
        </ProfileCard>
      </div>
      <div className="space-y-6">
        <ProfileCard title="Details">
          <dl className="space-y-3 text-sm">
            <Row label="Display name" value={profile?.display_name} />
            <Row label="Username" value={profile?.username ? `@${profile.username}` : undefined} />
            <Row label="Location" value={profile?.location} />
          </dl>
        </ProfileCard>
      </div>
    </div>
  );
}

function TagList({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {tags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Not set yet.</p>
      )}
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
