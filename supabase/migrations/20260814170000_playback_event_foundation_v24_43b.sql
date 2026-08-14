CREATE TABLE public.creator_playback_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playback_id uuid NOT NULL UNIQUE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  listener_session_id text NOT NULL CHECK (char_length(listener_session_id) BETWEEN 8 AND 80),
  is_creator_self_play boolean NOT NULL DEFAULT false,
  duration_sec numeric(10,2) NOT NULL CHECK (duration_sec > 0 AND duration_sec <= 7200),
  listened_sec numeric(10,2) NOT NULL DEFAULT 0 CHECK (listened_sec >= 0),
  max_position_sec numeric(10,2) NOT NULL DEFAULT 0 CHECK (max_position_sec >= 0),
  reached_25 boolean NOT NULL DEFAULT false,
  reached_50 boolean NOT NULL DEFAULT false,
  reached_75 boolean NOT NULL DEFAULT false,
  reached_90 boolean NOT NULL DEFAULT false,
  qualified_at timestamptz,
  completed_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_progress_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX creator_playback_sessions_creator_time_idx
  ON public.creator_playback_sessions (creator_id, started_at DESC);
CREATE INDEX creator_playback_sessions_track_time_idx
  ON public.creator_playback_sessions (track_id, started_at DESC);
CREATE INDEX creator_playback_sessions_listener_idx
  ON public.creator_playback_sessions (creator_id, listener_session_id, started_at DESC);

ALTER TABLE public.creator_playback_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.creator_playback_sessions FROM anon, authenticated;
GRANT ALL ON public.creator_playback_sessions TO service_role;

CREATE OR REPLACE FUNCTION public.record_shared_playback_progress(
  p_slug text,
  p_track_id uuid,
  p_listener_session_id text,
  p_playback_id uuid,
  p_position_sec numeric,
  p_duration_sec numeric,
  p_listened_delta_sec numeric,
  p_completed boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_playlist public.playlists%ROWTYPE;
  safe_duration numeric(10,2);
  safe_position numeric(10,2);
  safe_delta numeric(10,2);
  updated_session public.creator_playback_sessions%ROWTYPE;
BEGIN
  IF char_length(COALESCE(p_listener_session_id, '')) NOT BETWEEN 8 AND 80 THEN
    RETURN;
  END IF;

  SELECT * INTO target_playlist
  FROM public.playlists
  WHERE slug = p_slug AND is_published = true;
  IF NOT FOUND THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.playlist_tracks
    WHERE playlist_id = target_playlist.id AND track_id = p_track_id
  ) THEN RETURN; END IF;

  safe_duration := LEAST(GREATEST(COALESCE(p_duration_sec, 0), 1), 7200);
  safe_position := LEAST(GREATEST(COALESCE(p_position_sec, 0), 0), safe_duration);
  -- Progress is sent about every five seconds. The cap prevents a client from
  -- claiming large blocks of listening time in a single request.
  safe_delta := LEAST(GREATEST(COALESCE(p_listened_delta_sec, 0), 0), 15);

  INSERT INTO public.creator_playback_sessions (
    playback_id, creator_id, playlist_id, track_id, listener_session_id,
    duration_sec, listened_sec, max_position_sec, is_creator_self_play
  ) VALUES (
    p_playback_id, target_playlist.creator_id, target_playlist.id, p_track_id,
    p_listener_session_id, safe_duration, safe_delta, safe_position,
    COALESCE(auth.uid() = target_playlist.creator_id, false)
  )
  ON CONFLICT (playback_id) DO UPDATE SET
    listened_sec = LEAST(
      creator_playback_sessions.duration_sec,
      creator_playback_sessions.listened_sec + safe_delta
    ),
    max_position_sec = GREATEST(creator_playback_sessions.max_position_sec, safe_position),
    last_progress_at = now()
  WHERE creator_playback_sessions.creator_id = target_playlist.creator_id
    AND creator_playback_sessions.playlist_id = target_playlist.id
    AND creator_playback_sessions.track_id = p_track_id
    AND creator_playback_sessions.listener_session_id = p_listener_session_id
  RETURNING * INTO updated_session;

  IF NOT FOUND THEN RETURN; END IF;

  UPDATE public.creator_playback_sessions
  SET
    reached_25 = reached_25 OR updated_session.listened_sec >= updated_session.duration_sec * 0.25,
    reached_50 = reached_50 OR updated_session.listened_sec >= updated_session.duration_sec * 0.50,
    reached_75 = reached_75 OR updated_session.listened_sec >= updated_session.duration_sec * 0.75,
    reached_90 = reached_90 OR updated_session.listened_sec >= updated_session.duration_sec * 0.90,
    qualified_at = CASE
      WHEN qualified_at IS NULL
        AND updated_session.listened_sec >= LEAST(30, updated_session.duration_sec * 0.50)
      THEN now() ELSE qualified_at END,
    completed_at = CASE
      WHEN completed_at IS NULL
        AND COALESCE(p_completed, false)
        AND updated_session.listened_sec >= updated_session.duration_sec * 0.85
        AND updated_session.max_position_sec >= updated_session.duration_sec * 0.90
      THEN now() ELSE completed_at END
  WHERE playback_id = p_playback_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_shared_playback_progress(text, uuid, text, uuid, numeric, numeric, numeric, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_shared_playback_progress(text, uuid, text, uuid, numeric, numeric, numeric, boolean)
  TO anon, authenticated;
