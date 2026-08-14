CREATE OR REPLACE FUNCTION public.get_my_creator_retention_insights(p_days integer DEFAULT 365)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH eligible AS (
    SELECT s.*
    FROM public.creator_playback_sessions s
    WHERE s.creator_id = auth.uid()
      AND NOT s.is_creator_self_play
      AND s.started_at >= now() - make_interval(days => LEAST(GREATEST(COALESCE(p_days, 365), 1), 3650))
  ), listener_repeats AS (
    SELECT listener_session_id
    FROM eligible
    WHERE qualified_at IS NOT NULL
    GROUP BY listener_session_id
    HAVING count(*) >= 2
  ), track_listener_repeats AS (
    SELECT track_id, listener_session_id
    FROM eligible
    WHERE qualified_at IS NOT NULL
    GROUP BY track_id, listener_session_id
    HAVING count(*) >= 2
  ), by_track AS (
    SELECT
      t.id AS track_id,
      t.title,
      count(e.id)::integer AS starts,
      count(e.id) FILTER (WHERE e.qualified_at IS NOT NULL)::integer AS qualified_plays,
      count(DISTINCT e.listener_session_id) FILTER (WHERE e.qualified_at IS NOT NULL)::integer AS unique_listeners,
      COALESCE(round(sum(e.listened_sec)), 0)::integer AS listening_seconds,
      COALESCE(round(avg(e.listened_sec)), 0)::integer AS average_listening_seconds,
      count(e.id) FILTER (WHERE e.completed_at IS NOT NULL)::integer AS completions,
      CASE WHEN count(e.id) FILTER (WHERE e.qualified_at IS NOT NULL) = 0 THEN 0
        ELSE round(100.0 * count(e.id) FILTER (WHERE e.completed_at IS NOT NULL)
          / count(e.id) FILTER (WHERE e.qualified_at IS NOT NULL), 1) END AS completion_rate,
      (SELECT count(*) FROM track_listener_repeats r WHERE r.track_id = t.id)::integer AS repeat_listeners,
      count(e.id) FILTER (WHERE e.reached_25)::integer AS reached_25,
      count(e.id) FILTER (WHERE e.reached_50)::integer AS reached_50,
      count(e.id) FILTER (WHERE e.reached_75)::integer AS reached_75,
      count(e.id) FILTER (WHERE e.reached_90)::integer AS reached_90
    FROM eligible e
    JOIN public.tracks t ON t.id = e.track_id
    GROUP BY t.id, t.title
  )
  SELECT jsonb_build_object(
    'starts', count(e.id),
    'qualified_plays', count(e.id) FILTER (WHERE e.qualified_at IS NOT NULL),
    'unique_listeners', count(DISTINCT e.listener_session_id) FILTER (WHERE e.qualified_at IS NOT NULL),
    'listening_seconds', COALESCE(round(sum(e.listened_sec)), 0),
    'average_listening_seconds', COALESCE(round(avg(e.listened_sec)), 0),
    'completions', count(e.id) FILTER (WHERE e.completed_at IS NOT NULL),
    'completion_rate', CASE WHEN count(e.id) FILTER (WHERE e.qualified_at IS NOT NULL) = 0 THEN 0
      ELSE round(100.0 * count(e.id) FILTER (WHERE e.completed_at IS NOT NULL)
        / count(e.id) FILTER (WHERE e.qualified_at IS NOT NULL), 1) END,
    'repeat_listeners', (SELECT count(*) FROM listener_repeats),
    'reached_25', count(e.id) FILTER (WHERE e.reached_25),
    'reached_50', count(e.id) FILTER (WHERE e.reached_50),
    'reached_75', count(e.id) FILTER (WHERE e.reached_75),
    'reached_90', count(e.id) FILTER (WHERE e.reached_90),
    'tracks', COALESCE((SELECT jsonb_agg(to_jsonb(bt) ORDER BY bt.qualified_plays DESC, bt.listening_seconds DESC, bt.title) FROM by_track bt), '[]'::jsonb)
  )
  FROM eligible e;
$$;

REVOKE ALL ON FUNCTION public.get_my_creator_retention_insights(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_creator_retention_insights(integer) TO authenticated;
