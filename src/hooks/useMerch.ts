import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { merchService } from "@/services/merch/merchService";
import type { MerchProduct } from "@/features/merch/schema";

export function useMerch(creatorId?: string) { return useQuery({ queryKey: ["merch", creatorId], queryFn: () => merchService.list(creatorId!), enabled: !!creatorId }); }
export function useCreateMerch(creatorId?: string) { const qc = useQueryClient(); return useMutation({ mutationFn: ({ input, image }: { input: Omit<MerchProduct, "id" | "creator_id" | "created_at" | "updated_at">; image?: File | null }) => merchService.create(creatorId!, input, image), onSuccess: () => qc.invalidateQueries({ queryKey: ["merch", creatorId] }) }); }
export function useUpdateMerch(creatorId?: string) { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, input, image }: { id: string; input: Parameters<typeof merchService.update>[2]; image?: File | null }) => merchService.update(id, creatorId!, input, image), onSuccess: () => qc.invalidateQueries({ queryKey: ["merch", creatorId] }) }); }
export function useArchiveMerch(creatorId?: string) { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, active }: { id: string; active: boolean }) => merchService.setActive(id, active), onSuccess: () => qc.invalidateQueries({ queryKey: ["merch", creatorId] }) }); }
export function useDeleteMerch(creatorId?: string) { const qc = useQueryClient(); return useMutation({ mutationFn: merchService.remove, onSuccess: () => qc.invalidateQueries({ queryKey: ["merch", creatorId] }) }); }
