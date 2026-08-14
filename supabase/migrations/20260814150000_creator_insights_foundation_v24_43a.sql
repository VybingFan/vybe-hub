CREATE OR REPLACE FUNCTION public.get_my_creator_playlist_insights(p_days integer DEFAULT 365)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH eligible AS (
    SELECT pa.*
    FROM public.playlist_activity pa
    WHERE pa.creator_id = auth.uid()
      AND pa.created_at >= now() - make_interval(days => LEAST(GREATEST(COALESCE(p_days, 365), 1), 3650))
  ), by_playlist AS (
    SELECT
      p.id AS playlist_id,
      p.title,
      count(*) FILTER (WHERE e.event_type = 'link_opened')::integer AS opens,
      count(*) FILTER (WHERE e.event_type = 'playback_started')::integer AS plays,
      count(DISTINCT e.session_id)::integer AS unique_visitors
    FROM eligible e
    JOIN public.playlists p ON p.id = e.playlist_id
    GROUP BY p.id, p.title
  )
  SELECT jsonb_build_object(
    'opens', COALESCE((SELECT count(*) FROM eligible WHERE event_type = 'link_opened'), 0),
    'plays', COALESCE((SELECT count(*) FROM eligible WHERE event_type = 'playback_started'), 0),
    'unique_visitors', COALESCE((SELECT count(DISTINCT session_id) FROM eligible), 0),
    'playlists', COALESCE((SELECT jsonb_agg(to_jsonb(bp) ORDER BY bp.opens DESC, bp.plays DESC, bp.title) FROM by_playlist bp), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.get_my_creator_playlist_insights(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_creator_playlist_insights(integer) TO authenticated;
