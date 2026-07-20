CREATE TABLE public.playlist_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id uuid REFERENCES public.tracks(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('link_opened', 'playback_started')),
  session_id text NOT NULL CHECK (char_length(session_id) BETWEEN 8 AND 80),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX playlist_activity_creator_time_idx
  ON public.playlist_activity (creator_id, created_at DESC);
CREATE UNIQUE INDEX playlist_activity_session_event_idx
  ON public.playlist_activity (
    playlist_id,
    event_type,
    session_id,
    COALESCE(track_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

ALTER TABLE public.playlist_activity ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.playlist_activity TO authenticated;
GRANT ALL ON public.playlist_activity TO service_role;

CREATE POLICY "Creators read own playlist activity"
  ON public.playlist_activity FOR SELECT TO authenticated
  USING (creator_id = auth.uid());

CREATE OR REPLACE FUNCTION public.record_shared_playlist_event(
  p_slug text,
  p_event_type text,
  p_session_id text,
  p_track_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.playlists%ROWTYPE;
BEGIN
  IF p_event_type NOT IN ('link_opened', 'playback_started')
    OR char_length(p_session_id) NOT BETWEEN 8 AND 80 THEN
    RETURN;
  END IF;

  SELECT * INTO target FROM public.playlists
  WHERE slug = p_slug AND is_published = true;
  IF NOT FOUND THEN RETURN; END IF;

  IF p_track_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.playlist_tracks
    WHERE playlist_id = target.id AND track_id = p_track_id
  ) THEN RETURN; END IF;

  INSERT INTO public.playlist_activity
    (creator_id, playlist_id, track_id, event_type, session_id)
  VALUES
    (target.creator_id, target.id, p_track_id, p_event_type, p_session_id)
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.record_shared_playlist_event(text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_shared_playlist_event(text, text, text, uuid)
  TO anon, authenticated;
