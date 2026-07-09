import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supporterProfileService } from "@/services/supporter/supporterProfileService";
import type { SupporterProfileInput } from "@/features/supporter/schema";

export const supporterProfileKey = (userId: string | undefined) =>
  ["supporter-profile", userId] as const;

export function useSupporterProfile(userId: string | undefined) {
  return useQuery({
    queryKey: supporterProfileKey(userId),
    queryFn: () => supporterProfileService.fetch(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useSaveSupporterProfile(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SupporterProfileInput) => {
      if (!userId) throw new Error("Not authenticated");
      return supporterProfileService.upsert(userId, input);
    },
    onSuccess: (data) => qc.setQueryData(supporterProfileKey(userId), data),
  });
}
