import { supabase } from "@/integrations/supabase/client";
import type {
  TrackProductionStage,
  TrackWorkspaceCategory,
} from "@/features/music/workflow";

export interface TrackWorkflowUpdate {
  workspace_category: TrackWorkspaceCategory;
  production_stage: TrackProductionStage;
}

export const trackWorkflowService = {
  async update(
    userId: string,
    trackId: string,
    patch: Partial<TrackWorkflowUpdate>,
  ): Promise<TrackWorkflowUpdate & { id: string; updated_at: string }> {
    if (!Object.keys(patch).length) {
      throw new Error("Choose a category or production stage.");
    }

    const { data, error } = await supabase
      .from("tracks")
      .update(patch)
      .eq("id", trackId)
      .eq("creator_id", userId)
      .select("id, workspace_category, production_stage, updated_at")
      .single();

    if (error) throw error;
    return data as TrackWorkflowUpdate & {
      id: string;
      updated_at: string;
    };
  },
};
