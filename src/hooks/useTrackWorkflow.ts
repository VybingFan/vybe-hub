import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Track } from "@/features/music/schema";
import type {
  TrackProductionStage,
  TrackWorkspaceCategory,
} from "@/features/music/workflow";
import { creatorTracksKey } from "@/hooks/useMusic";
import { trackWorkflowService } from "@/services/music/trackWorkflowService";

type WorkflowTrack = Track & {
  workspace_category?: TrackWorkspaceCategory;
  production_stage?: TrackProductionStage;
};

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
        (current) =>
          current?.map((track) =>
            track.id === updated.id
              ? {
                  ...track,
                  workspace_category: updated.workspace_category,
                  production_stage: updated.production_stage,
                  updated_at: updated.updated_at,
                }
              : track,
          ),
      );
    },
  });
}
