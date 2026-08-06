import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Track } from "@/features/music/schema";
import type {
  TrackProductionStage,
  TrackWorkspaceCategory,
} from "@/features/music/workflow";
import { creatorTracksKey } from "@/hooks/useMusic";
import {
  trackWorkflowService,
  type TrackWorkflowResult,
} from "@/services/music/trackWorkflowService";

type WorkflowTrack = Track & {
  workspace_category?: TrackWorkspaceCategory;
  production_stage?: TrackProductionStage;
};

function mergeUpdates(
  current: WorkflowTrack[] | undefined,
  updates: TrackWorkflowResult[],
) {
  if (!current) return current;

  const byId = new Map(updates.map((update) => [update.id, update]));

  return current.map((track) => {
    const updated = byId.get(track.id);
    if (!updated) return track;

    return {
      ...track,
      workspace_category: updated.workspace_category,
      production_stage: updated.production_stage,
      updated_at: updated.updated_at,
    };
  });
}

export function useUpdateTrackWorkflow(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      trackId,
      category,
      stage,
    }: {
      trackId: string;
      category?: TrackWorkspaceCategory;
      stage?: TrackProductionStage;
    }) => {
      if (!userId) throw new Error("Sign in to organize your music.");

      return trackWorkflowService.update(userId, trackId, {
        ...(category ? { workspace_category: category } : {}),
        ...(stage ? { production_stage: stage } : {}),
      });
    },

    onSuccess: (updated) => {
      queryClient.setQueryData<WorkflowTrack[]>(
        creatorTracksKey(userId),
        (current) => mergeUpdates(current, [updated]),
      );
    },
  });
}

export function useBulkUpdateTrackWorkflow(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      trackIds,
      category,
      stage,
    }: {
      trackIds: string[];
      category?: TrackWorkspaceCategory;
      stage?: TrackProductionStage;
    }) => {
      if (!userId) throw new Error("Sign in to organize your music.");

      return trackWorkflowService.updateMany(userId, trackIds, {
        ...(category ? { workspace_category: category } : {}),
        ...(stage ? { production_stage: stage } : {}),
      });
    },

    onSuccess: (updated) => {
      queryClient.setQueryData<WorkflowTrack[]>(
        creatorTracksKey(userId),
        (current) => mergeUpdates(current, updated),
      );
    },
  });
}
