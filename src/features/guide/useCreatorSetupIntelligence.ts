import { useQuery } from "@tanstack/react-query";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { useCreatorTracks } from "@/hooks/useMusic";
import { useMyPlaylists } from "@/hooks/usePlaylists";
import { copyrightComplianceService } from "@/services/compliance/copyrightComplianceService";

export const CREATOR_SETUP_REQUIRED_IDS = ["rules", "profile", "music", "visibility", "playlist"] as const;
export type CreatorSetupRequiredId = (typeof CREATOR_SETUP_REQUIRED_IDS)[number];

export function useCreatorSetupIntelligence(userId?: string) {
  const profile = useCreatorProfile(userId);
  const tracks = useCreatorTracks(userId);
  const playlists = useMyPlaylists(userId);
  const rules = useQuery({
    queryKey: ["creator-compliance-ready", userId],
    queryFn: () => copyrightComplianceService.acceptanceReady(userId!),
    enabled: !!userId,
    staleTime: 15_000,
  });

  const p = profile.data;
  const creatorTracks = tracks.data ?? [];
  const creatorPlaylists = playlists.data ?? [];
  const profileReady = Boolean(
    p?.artist_name?.trim() &&
    p?.bio?.trim() &&
    p?.genres?.length &&
    (p?.avatar_path || p?.avatar_url)
  );

  const complete: Record<CreatorSetupRequiredId, boolean> = {
    rules: rules.data === true,
    profile: profileReady,
    music: creatorTracks.length > 0,
    visibility: creatorTracks.some((track) => ["public", "unlisted", "private"].includes(track.visibility ?? "")),
    playlist: creatorPlaylists.length > 0,
  };

  const completedCount = CREATOR_SETUP_REQUIRED_IDS.filter((id) => complete[id]).length;
  const nextRequiredId = CREATOR_SETUP_REQUIRED_IDS.find((id) => !complete[id]) ?? null;
  const nextStepIndexById: Record<CreatorSetupRequiredId, number> = {
    rules: 0,
    profile: 1,
    music: 2,
    visibility: 3,
    playlist: 4,
  };

  return {
    complete,
    completedCount,
    totalRequired: CREATOR_SETUP_REQUIRED_IDS.length,
    nextRequiredId,
    nextStepIndex: nextRequiredId ? nextStepIndexById[nextRequiredId] : 6,
    isReady: completedCount === CREATOR_SETUP_REQUIRED_IDS.length,
    isLoading: profile.isLoading || tracks.isLoading || playlists.isLoading || rules.isLoading,
  };
}
