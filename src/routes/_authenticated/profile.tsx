import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileView } from "@/components/profile/ProfileView";
import { SupporterProfileForm } from "@/components/supporter/SupporterProfileForm";
import { SupporterProfileView } from "@/components/supporter/SupporterProfileView";
import { ErrorState } from "@/components/common/ErrorState";
import { CreatorDiscoveryReadiness } from "@/components/discovery/CreatorDiscoveryReadiness";
import { useUser } from "@/hooks/useUser";
import {
  useCreatorProfile,
  useSaveCreatorProfile,
} from "@/hooks/useCreatorProfile";
import { useCreatorTracks } from "@/hooks/useMusic";
import {
  useSupporterProfile,
  useSaveSupporterProfile,
} from "@/hooks/useSupporterProfile";
import type { CreatorProfileInput } from "@/features/profile/schema";
import type { SupporterProfileInput } from "@/features/supporter/schema";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <RoleGuard allow={["creator", "supporter", "admin"]}>
      <ProfileContent />
    </RoleGuard>
  );
}

function ProfileContent() {
  const { user, primaryRole } = useUser();
  if (primaryRole === "supporter")
    return <SupporterProfileContent userId={user?.id} email={user?.email} />;
  return (
    <CreatorProfileContent userId={user?.id} email={user?.email} canEdit />
  );
}

function CreatorProfileContent({
  userId,
  email,
  canEdit,
}: {
  userId?: string;
  email?: string | null;
  canEdit: boolean;
}) {
  const { data: profile, isLoading, error } = useCreatorProfile(userId);
  const { data: tracks = [] } = useCreatorTracks(userId);
  const save = useSaveCreatorProfile(userId);
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) return <Center />;
  if (error)
    return (
      <ErrorState
        title="Couldn't load profile"
        message={(error as Error).message}
      />
    );

  const handleSave = async (values: CreatorProfileInput) => {
    await save.mutateAsync(values);
    setIsEditing(false);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {isEditing && canEdit ? (
        <ProfileForm
          initial={profile ?? null}
          userId={userId!}
          onSubmit={handleSave}
          onCancel={() => setIsEditing(false)}
          submitting={save.isPending}
        />
      ) : (
        <>
          <CreatorDiscoveryReadiness
            profile={profile ?? null}
            tracks={tracks}
            onEditProfile={() => setIsEditing(true)}
          />
          <ProfileHeader
            profile={profile ?? {}}
            email={email}
            isEditing={false}
            onEditToggle={() => canEdit && setIsEditing(true)}
          />
          <ProfileView profile={profile ?? null} />
        </>
      )}
    </div>
  );
}

function SupporterProfileContent({
  userId,
  email,
}: {
  userId?: string;
  email?: string | null;
}) {
  const { data: profile, isLoading, error } = useSupporterProfile(userId);
  const save = useSaveSupporterProfile(userId);
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) return <Center />;
  if (error)
    return (
      <ErrorState
        title="Couldn't load profile"
        message={(error as Error).message}
      />
    );

  const handleSave = async (values: SupporterProfileInput) => {
    await save.mutateAsync(values);
    setIsEditing(false);
  };

  const headerProfile = {
    artist_name: profile?.display_name,
    display_name: profile?.username ? `@${profile.username}` : undefined,
    avatar_url: profile?.avatar_url,
    location: profile?.location,
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <ProfileHeader
        profile={headerProfile as never}
        email={email}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing((v) => !v)}
      />
      {isEditing ? (
        <SupporterProfileForm
          initial={profile ?? null}
          onSubmit={handleSave}
          onCancel={() => setIsEditing(false)}
          submitting={save.isPending}
        />
      ) : (
        <SupporterProfileView profile={profile ?? null} />
      )}
    </div>
  );
}

function Center() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
