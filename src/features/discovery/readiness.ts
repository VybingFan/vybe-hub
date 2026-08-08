export interface DiscoveryReadyProfile {
  username?: string | null;
  artist_name?: string | null;
  display_name?: string | null;
  bio?: string | null;
  avatar_path?: string | null;
  avatar_url?: string | null;
  genre?: string | null;
  genres?: string[] | null;
  location?: string | null;
}

export function creatorDiscoveryRequirements(
  profile: DiscoveryReadyProfile | null | undefined,
  hasPublicMusic: boolean,
) {
  return [
    {
      key: "username",
      label: "Choose a VYBE username",
      complete: Boolean(profile?.username?.trim()),
    },
    {
      key: "name",
      label: "Add an artist or display name",
      complete: Boolean(
        profile?.artist_name?.trim() || profile?.display_name?.trim(),
      ),
    },
    {
      key: "bio",
      label: "Add an artist bio",
      complete: (profile?.bio?.trim().length ?? 0) >= 40,
    },
    {
      key: "image",
      label: "Add a profile image",
      complete: Boolean(profile?.avatar_path || profile?.avatar_url),
    },
    {
      key: "genre",
      label: "Select at least one genre",
      complete: Boolean(profile?.genres?.length || profile?.genre?.trim()),
    },
    {
      key: "location",
      label: "Add a city or location",
      complete: Boolean(profile?.location?.trim()),
    },
    {
      key: "music",
      label: "Publish at least one public song",
      complete: hasPublicMusic,
    },
  ];
}

export function isCreatorDiscoveryReady(
  profile: DiscoveryReadyProfile | null | undefined,
  hasPublicMusic: boolean,
) {
  return creatorDiscoveryRequirements(profile, hasPublicMusic).every(
    (requirement) => requirement.complete,
  );
}
