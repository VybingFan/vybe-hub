import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { playlistService } from "@/services/playlists/playlistService";
import type { CreatePlaylistInput, UpdatePlaylistInput } from "@/features/playlists/schema";

export function useMyPlaylists(userId?: string) {
  return useQuery({
    queryKey: ["playlists", userId],
    queryFn: () => playlistService.listMine(userId!),
    enabled: !!userId,
  });
}

export function useMyPlaylist(userId?: string, playlistId?: string) {
  return useQuery({
    queryKey: ["playlist-editor", userId, playlistId],
    queryFn: () => playlistService.getMine(userId!, playlistId!),
    enabled: !!userId && !!playlistId,
  });
}

export function useCreatePlaylist(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlaylistInput) => {
      if (!userId) throw new Error("Sign in to create a playlist.");
      return playlistService.create(userId, input);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["playlists", userId] }),
        queryClient.invalidateQueries({ queryKey: ["shared-playlist"] }),
      ]);
    },
  });
}

export function useReplacePlaylistTracks(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, trackIds }: { playlistId: string; trackIds: string[] }) => {
      if (!userId) throw new Error("Sign in to manage a playlist.");
      if (!trackIds.length) throw new Error("Keep at least one published song in the playlist.");
      return playlistService.replaceTracks(playlistId, trackIds);
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["playlists", userId] }),
        queryClient.invalidateQueries({
          queryKey: ["playlist-editor", userId, variables.playlistId],
        }),
        queryClient.invalidateQueries({ queryKey: ["shared-playlist"] }),
      ]);
    },
  });
}

export function useUpdatePlaylist(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, input }: { playlistId: string; input: UpdatePlaylistInput }) => {
      if (!userId) throw new Error("Sign in to manage a playlist.");
      return playlistService.update(playlistId, input);
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["playlists", userId] }),
        queryClient.invalidateQueries({
          queryKey: ["playlist-editor", userId, variables.playlistId],
        }),
        queryClient.invalidateQueries({ queryKey: ["shared-playlist"] }),
      ]);
    },
  });
}

export function useReplacePlaylistCover(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, file }: { playlistId: string; file: File }) => {
      if (!userId) throw new Error("Sign in to manage a playlist.");
      return playlistService.replaceCover(userId, playlistId, file);
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["playlists", userId] }),
        queryClient.invalidateQueries({
          queryKey: ["playlist-editor", userId, variables.playlistId],
        }),
        queryClient.invalidateQueries({ queryKey: ["shared-playlist"] }),
      ]);
    },
  });
}

export function useDeletePlaylist(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playlistId: string) => {
      if (!userId) throw new Error("Sign in to delete a playlist.");
      return playlistService.delete(playlistId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["playlists", userId] }),
        queryClient.invalidateQueries({ queryKey: ["shared-playlist"] }),
      ]);
    },
  });
}

export function useSharedPlaylist(slug: string) {
  return useQuery({
    queryKey: ["shared-playlist", slug],
    queryFn: () => playlistService.getShared(slug),
  });
}
