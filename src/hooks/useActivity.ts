import { useQuery } from "@tanstack/react-query";
import { activityService } from "@/services/activity/activityService";

export function useMyActivity(creatorId?: string) {
  return useQuery({
    queryKey: ["playlist-activity", creatorId],
    queryFn: () => activityService.listMine(creatorId!),
    enabled: !!creatorId,
    refetchInterval: 30_000,
  });
}
