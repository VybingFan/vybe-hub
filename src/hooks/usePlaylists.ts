import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { playlistService } from "@/services/playlists/playlistService";
import type { CreatePlaylistInput } from "@/features/playlists/schema";

export function useMyPlaylists(userId?: string) {
  return useQuery({
    queryKey: ["playlists", userId],
    queryFn: () => playlistService.listMine(userId!),
    enabled: !!userId,
  });
}

export function useCreatePlaylist(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlaylistInput) => {
      if (!userId) throw new Error("Sign in to create a playlist.");
      return playlistService.create(userId, input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["playlists", userId] }),
  });
}

export function useSharedPlaylist(slug: string) {
  return useQuery({
    queryKey: ["shared-playlist", slug],
    queryFn: () => playlistService.getShared(slug),
  });
}
