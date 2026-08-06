import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  accessGrantService,
  type CreatePlaylistAccessGrantInput,
} from "@/services/access/accessGrantService";

function queryKey(playlistId?: string) {
  return ["playlist-access-grants", playlistId];
}

export function usePlaylistAccessGrants(
  playlistId?: string,
) {
  return useQuery({
    queryKey: queryKey(playlistId),
    queryFn: () =>
      accessGrantService.listForPlaylist(
        playlistId!,
      ),
    enabled: !!playlistId,
  });
}

export function useCreatePlaylistAccessGrant(
  playlistId?: string,
  userId?: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      input: Omit<
        CreatePlaylistAccessGrantInput,
        "playlistId"
      >,
    ) => {
      if (!playlistId || !userId) {
        throw new Error(
          "Sign in to manage playlist access.",
        );
      }

      return accessGrantService.create(userId, {
        ...input,
        playlistId,
      });
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKey(playlistId),
      });
    },
  });
}

export function useRevokePlaylistAccessGrant(
  playlistId?: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (grantId: string) =>
      accessGrantService.revoke(grantId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKey(playlistId),
      });
    },
  });
}

export function useRestorePlaylistAccessGrant(
  playlistId?: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (grantId: string) =>
      accessGrantService.restore(grantId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKey(playlistId),
      });
    },
  });
}

export function useRemovePlaylistAccessGrant(
  playlistId?: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (grantId: string) =>
      accessGrantService.remove(grantId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKey(playlistId),
      });
    },
  });
}