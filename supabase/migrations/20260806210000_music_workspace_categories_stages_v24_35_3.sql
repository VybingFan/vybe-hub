-- VYBE V24.35.3A — Music workspace categories and production stages
BEGIN;

ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS workspace_category text NOT NULL DEFAULT 'work_in_progress',
  ADD COLUMN IF NOT EXISTS production_stage text NOT NULL DEFAULT 'idea';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tracks_workspace_category_check'
  ) THEN
    ALTER TABLE public.tracks
      ADD CONSTRAINT tracks_workspace_category_check
      CHECK (workspace_category IN (
        'released',
        'upcoming',
        'work_in_progress',
        'collaboration',
        'rights_pending',
        'commercial_preview',
        'archived'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tracks_production_stage_check'
  ) THEN
    ALTER TABLE public.tracks
      ADD CONSTRAINT tracks_production_stage_check
      CHECK (production_stage IN (
        'idea',
        'writing',
        'recording',
        'editing',
        'mixing',
        'mastering',
        'ready',
        'scheduled',
        'released',
        'archived'
      ));
  END IF;
END
$$;

UPDATE public.tracks
SET workspace_category = 'archived',
    production_stage = 'archived'
WHERE visibility = 'archived';

CREATE INDEX IF NOT EXISTS tracks_creator_workspace_category_idx
ON public.tracks (creator_id, workspace_category, updated_at DESC);

CREATE INDEX IF NOT EXISTS tracks_creator_production_stage_idx
ON public.tracks (creator_id, production_stage, updated_at DESC);

COMMIT;
