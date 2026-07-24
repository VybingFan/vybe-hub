import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { videoService } from "@/services/video/videoService";
import type { CreateVideoInput } from "@/features/video/schema";

export function useMyVideos(creatorId?: string) {
  return useQuery({
    queryKey: ["creator-videos", creatorId],
    queryFn: () => videoService.listMine(creatorId!),
    enabled: !!creatorId,
  });
}

export function useCreateVideo(creatorId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVideoInput) => videoService.create(creatorId!, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["creator-videos", creatorId] }),
  });
}

export function useCreateNativeVideo(creatorId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof videoService.createNative>[1]) =>
      videoService.createNative(creatorId!, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["creator-videos", creatorId] }),
  });
}

export function useSetVideoPublished(creatorId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      videoService.setPublished(id, published),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["creator-videos", creatorId] }),
  });
}

export function useDeleteVideo(creatorId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: videoService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["creator-videos", creatorId] }),
  });
}

export function usePublicVideo(id: string) {
  return useQuery({
    queryKey: ["public-video", id],
    queryFn: () => videoService.getPublic(id),
  });
}

export function usePublishedVideos(creatorId?: string) {
  return useQuery({
    queryKey: ["published-videos", creatorId || "all"],
    queryFn: () => videoService.listPublished(creatorId),
  });
}
