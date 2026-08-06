import { supabase } from "@/integrations/supabase/client";
import type {
  TrackProductionStage,
  TrackWorkspaceCategory,
} from "@/features/music/workflow";

export interface TrackWorkflowUpdate {
  workspace_category: TrackWorkspaceCategory;
  production_stage: TrackProductionStage;
}

export type TrackWorkflowResult = TrackWorkflowUpdate & {
  id: string;
  updated_at: string;
};

function validatePatch(patch: Partial<TrackWorkflowUpdate>) {
  if (!Object.keys(patch).length) {
    throw new Error("Choose a category or production stage.");
  }
}

export const trackWorkflowService = {
  async update(
    userId: string,
    trackId: string,
    patch: Partial<TrackWorkflowUpdate>,
  ): Promise<TrackWorkflowResult> {
    validatePatch(patch);

    const { data, error } = await supabase
      .from("tracks")
      .update(patch)
      .eq("id", trackId)
      .eq("creator_id", userId)
      .select("id, workspace_category, production_stage, updated_at")
      .single();

    if (error) throw error;
    return data as TrackWorkflowResult;
  },

  async updateMany(
    userId: string,
    trackIds: string[],
    patch: Partial<TrackWorkflowUpdate>,
  ): Promise<TrackWorkflowResult[]> {
    validatePatch(patch);

    const uniqueIds = Array.from(new Set(trackIds)).filter(Boolean);
    if (!uniqueIds.length) {
      throw new Error("Select at least one song.");
    }

    const { data, error } = await supabase
      .from("tracks")
      .update(patch)
      .eq("creator_id", userId)
      .in("id", uniqueIds)
      .select("id, workspace_category, production_stage, updated_at");

    if (error) throw error;
    return (data ?? []) as TrackWorkflowResult[];
  },
};
