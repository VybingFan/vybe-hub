-- V23.6: exactly one optional profile lead track per creator.

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY creator_id ORDER BY updated_at DESC, created_at DESC) AS position
  FROM public.tracks
  WHERE is_featured = true
)
UPDATE public.tracks t
SET is_featured = false
FROM ranked r
WHERE t.id = r.id AND r.position > 1;

CREATE UNIQUE INDEX tracks_one_profile_lead_per_creator
  ON public.tracks (creator_id)
  WHERE is_featured = true;

CREATE OR REPLACE FUNCTION public.set_profile_lead_track(_track_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'creator') THEN
    RAISE EXCEPTION 'Creator access required';
  END IF;

  IF _track_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.tracks WHERE id = _track_id AND creator_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Track not found or not owned by this creator';
  END IF;

  UPDATE public.tracks SET is_featured = false
  WHERE creator_id = auth.uid() AND is_featured = true;

  IF _track_id IS NOT NULL THEN
    UPDATE public.tracks SET is_featured = true
    WHERE id = _track_id AND creator_id = auth.uid();
  END IF;

  RETURN _track_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_profile_lead_track(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_profile_lead_track(UUID) TO authenticated;
