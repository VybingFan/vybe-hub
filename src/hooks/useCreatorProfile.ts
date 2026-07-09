import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creatorProfileService } from "@/services/profile/creatorProfileService";
import type { CreatorProfileInput } from "@/features/profile/schema";

export const creatorProfileKey = (userId: string | undefined) => ["creator-profile", userId] as const;

export function useCreatorProfile(userId: string | undefined) {
  return useQuery({
    queryKey: creatorProfileKey(userId),
    queryFn: () => creatorProfileService.fetch(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useSaveCreatorProfile(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatorProfileInput) => {
      if (!userId) throw new Error("Not authenticated");
      return creatorProfileService.upsert(userId, input);
    },
    onSuccess: (data) => {
      qc.setQueryData(creatorProfileKey(userId), data);
    },
  });
}
