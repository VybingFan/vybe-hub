-- V24.18: casual Play progress synchronized from offline-capable clients.
-- Client-submitted progress is never treated as a verified competition result.

CREATE TABLE public.play_activity_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_version text NOT NULL CHECK (char_length(pack_version) BETWEEN 1 AND 80),
  activity_key text NOT NULL CHECK (char_length(activity_key) BETWEEN 1 AND 80),
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  verification_status text NOT NULL DEFAULT 'casual_unverified'
    CHECK (verification_status = 'casual_unverified'),
  client_updated_at timestamptz NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, pack_version, activity_key)
);

CREATE INDEX play_activity_progress_user_idx
  ON public.play_activity_progress(user_id, updated_at DESC);

ALTER TABLE public.play_activity_progress ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.play_activity_progress TO authenticated;
GRANT ALL ON public.play_activity_progress TO service_role;

CREATE POLICY "Members view own casual Play progress"
  ON public.play_activity_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Members insert own unverified Play progress"
  ON public.play_activity_progress FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND verification_status = 'casual_unverified'
  );

CREATE POLICY "Members update own unverified Play progress"
  ON public.play_activity_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND verification_status = 'casual_unverified'
  );

CREATE TRIGGER play_activity_progress_set_updated_at
  BEFORE UPDATE ON public.play_activity_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
