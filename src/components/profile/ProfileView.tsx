import { ProfileCard } from "@/components/profile/ProfileCard";
import { SocialLinksDisplay } from "@/components/socialLinks/SocialLinksDisplay";
import type { CreatorProfile } from "@/features/profile/schema";

interface Props {
  profile: Partial<CreatorProfile> | null;
}

export function ProfileView({ profile }: Props) {
  const bio = profile?.bio?.trim();
  return (
    <div className="space-y-4">
      <ProfileCard title="About">
        {bio ? (
          <p className="max-w-3xl whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {bio}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No bio yet. Click "Edit profile" to tell supporters your story.
          </p>
        )}
      </ProfileCard>
      <ProfileCard title="Public links">
        <SocialLinksDisplay profile={profile ?? {}} />
      </ProfileCard>
    </div>
  );
}
