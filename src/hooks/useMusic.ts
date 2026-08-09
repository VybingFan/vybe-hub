import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { musicService, type UploadTrackParams } from "@/services/music/musicService";
import type { AlbumInput, TrackInput } from "@/features/music/schema";

export const creatorTracksKey = (userId: string | undefined) => ["creator-tracks", userId] as const;
export const creatorAlbumsKey = (userId: string | undefined) => ["creator-albums", userId] as const;

export function useCreatorTracks(userId: string | undefined) {
  return useQuery({
    queryKey: creatorTracksKey(userId),
    queryFn: () => musicService.listCreatorTracks(userId!),
    enabled: !!userId,
  });
}

export function useCreatorAlbums(userId: string | undefined) {
  return useQuery({
    queryKey: creatorAlbumsKey(userId),
    queryFn: () => musicService.listCreatorAlbums(userId!),
    enabled: !!userId,
  });
}

export function useUploadTrack(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: Omit<UploadTrackParams, "userId">) => {
      if (!userId) throw new Error("Not authenticated");
      return musicService.createTrack({ ...params, userId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: creatorTracksKey(userId) }),
  });
}

export function useUpdateTrack(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<TrackInput> }) =>
      musicService.updateTrack(id, patch),
    onSuccess: (updated) => {
      qc.setQueryData(
        creatorTracksKey(userId),
        (current: Array<typeof updated> | undefined) =>
          current?.map((track) => (track.id === updated.id ? updated : track)),
      );
      qc.invalidateQueries({ queryKey: creatorTracksKey(userId) });
      qc.invalidateQueries({ queryKey: ["public-creator"] });
      qc.invalidateQueries({ queryKey: ["public-music"] });
    },
  });
}

export function useSetProfileLead(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (trackId: string | null) => musicService.setProfileLead(trackId),
    onSuccess: () => qc.invalidateQueries({ queryKey: creatorTracksKey(userId) }),
  });
}

export function useReplaceTrackCover(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      if (!userId) throw new Error("Not authenticated");
      return musicService.replaceTrackCover(userId, id, file);
    },
    onSuccess: (updated) => {
      qc.setQueryData(creatorTracksKey(userId), (current: Array<typeof updated> | undefined) =>
        current?.map((track) => (track.id === updated.id ? updated : track)),
      );
      qc.invalidateQueries({ queryKey: creatorTracksKey(userId) });
    },
  });
}

export function useReplaceTrackAudio(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file, durationSec }: { id: string; file: File; durationSec: number }) => {
      if (!userId) throw new Error("Not authenticated");
      return musicService.replaceTrackAudio(userId, id, file, durationSec);
    },
    onSuccess: (updated) => {
      qc.setQueryData(creatorTracksKey(userId), (current: Array<typeof updated> | undefined) =>
        current?.map((track) => (track.id === updated.id ? updated : track)),
      );
      qc.invalidateQueries({ queryKey: creatorTracksKey(userId) });
      qc.invalidateQueries({ queryKey: ["playlists", userId] });
      qc.invalidateQueries({ queryKey: ["shared-playlist"] });
    },
  });
}

export function useDeleteTrack(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => musicService.deleteTrack(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: creatorTracksKey(userId) }),
  });
}

export function useCreateAlbum(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, cover }: { input: AlbumInput; cover?: File | null }) => {
      if (!userId) throw new Error("Not authenticated");
      return musicService.createAlbum(userId, input, cover);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: creatorAlbumsKey(userId) }),
  });
}

export function useDeleteAlbum(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => musicService.deleteAlbum(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: creatorAlbumsKey(userId) });
      qc.invalidateQueries({ queryKey: creatorTracksKey(userId) });
    },
  });
}
