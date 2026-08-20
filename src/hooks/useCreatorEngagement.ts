import { useQuery, useQueryClient } from "@tanstack/react-query";
import { creatorEngagementService } from "@/services/engagement/creatorEngagementService";

export function useCreatorEngagementDetails(days: number) {
  return useQuery({
    queryKey: ["creator-engagement-details", days],
    queryFn: () => creatorEngagementService.details(days),
  });
}

export function useCreatorNotifications(enabled = true) {
  return useQuery({
    queryKey: ["creator-identity-notifications"],
    queryFn: () => creatorEngagementService.notifications(),
    enabled,
    refetchInterval: 30_000,
  });
}

export function useMarkCreatorNotificationsRead() {
  const queryClient = useQueryClient();
  return async () => {
    await creatorEngagementService.markNotificationsRead();
    await queryClient.invalidateQueries({ queryKey: ["creator-identity-notifications"] });
  };
}
