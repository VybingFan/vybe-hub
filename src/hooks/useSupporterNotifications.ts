import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supporterNotificationService } from "@/services/engagement/supporterNotificationService";

export function useSupporterCreatorNotifications(enabled = true) {
  return useQuery({
    queryKey: ["supporter-creator-feed"],
    queryFn: () => supporterNotificationService.list(),
    enabled,
    refetchInterval: 30_000,
    retry: 1,
  });
}

export function useFollowedCreators(enabled = true) {
  return useQuery({
    queryKey: ["supporter-followed-creators"],
    queryFn: () => supporterNotificationService.listFollowing(),
    enabled,
    refetchInterval: 30_000,
    retry: 1,
  });
}

export function useMarkSupporterCreatorNotificationsRead() {
  const queryClient = useQueryClient();
  return async () => {
    await supporterNotificationService.markRead();
    await queryClient.invalidateQueries({ queryKey: ["supporter-creator-feed"] });
  };
}
