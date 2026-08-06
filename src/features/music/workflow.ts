export const TRACK_WORKSPACE_CATEGORIES = [
  "released",
  "upcoming",
  "work_in_progress",
  "collaboration",
  "rights_pending",
  "commercial_preview",
  "archived",
] as const;

export const TRACK_PRODUCTION_STAGES = [
  "idea",
  "writing",
  "recording",
  "editing",
  "mixing",
  "mastering",
  "ready",
  "scheduled",
  "released",
  "archived",
] as const;

export type TrackWorkspaceCategory =
  (typeof TRACK_WORKSPACE_CATEGORIES)[number];

export type TrackProductionStage =
  (typeof TRACK_PRODUCTION_STAGES)[number];

export const TRACK_WORKSPACE_CATEGORY_LABELS:
  Record<TrackWorkspaceCategory, string> = {
    released: "Released",
    upcoming: "Upcoming",
    work_in_progress: "Work in progress",
    collaboration: "Looking for collaborators",
    rights_pending: "Rights pending",
    commercial_preview: "Commercial preview",
    archived: "Archived",
  };

export const TRACK_PRODUCTION_STAGE_LABELS:
  Record<TrackProductionStage, string> = {
    idea: "Idea",
    writing: "Writing",
    recording: "Recording",
    editing: "Editing",
    mixing: "Mixing",
    mastering: "Mastering",
    ready: "Ready",
    scheduled: "Scheduled",
    released: "Released",
    archived: "Archived",
  };
