import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creatorUpdateService } from "@/services/creator/creatorUpdateService";
import type { CreatorUpdate, CreatorUpdateInput } from "@/features/creatorUpdates/schema";

function refresh(qc: ReturnType<typeof useQueryClient>, creatorId?: string) {
  qc.invalidateQueries({ queryKey: ["creator-updates", creatorId] });
  qc.invalidateQueries({ queryKey: ["published-creator-updates", creatorId] });
}
export function useCreatorUpdates(creatorId?: string) {
  return useQuery({ queryKey: ["creator-updates", creatorId], queryFn: () => creatorUpdateService.listMine(creatorId!), enabled: !!creatorId });
}
export function usePublishedCreatorUpdates(creatorId?: string) {
  return useQuery({ queryKey: ["published-creator-updates", creatorId], queryFn: () => creatorUpdateService.listPublished(creatorId!), enabled: !!creatorId });
}
export function useCreateCreatorUpdate(creatorId?: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ input, image }: { input: CreatorUpdateInput; image?: File | null }) => creatorUpdateService.create(creatorId!, input, image), onSuccess: () => refresh(qc, creatorId) });
}
export function useSetCreatorUpdatePublished(creatorId?: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, published }: { id: string; published: boolean }) => creatorUpdateService.setPublished(id, creatorId!, published), onSuccess: () => refresh(qc, creatorId) });
}
export function useDeleteCreatorUpdate(creatorId?: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (item: CreatorUpdate) => creatorUpdateService.remove(item, creatorId!), onSuccess: () => refresh(qc, creatorId) });
}
