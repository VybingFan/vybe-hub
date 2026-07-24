-- V24.1: atomically manage songs in creator-owned playlists.
-- Playlist deletion already cascades to playlist_tracks without deleting tracks.

DROP POLICY IF EXISTS "Creators manage own playlist tracks" ON public.playlist_tracks;
CREATE POLICY "Creators manage own playlist tracks"
  ON public.playlist_tracks FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.playlists p
    WHERE p.id = playlist_id
      AND p.creator_id = auth.uid()
  ))
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.playlists p
      WHERE p.id = playlist_id
        AND p.creator_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.tracks t
      WHERE t.id = track_id
        AND t.creator_id = auth.uid()
        AND t.status = 'published'
    )
  );

CREATE OR REPLACE FUNCTION public.replace_playlist_tracks(
  _playlist_id uuid,
  _track_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _playlist_owner uuid;
BEGIN
  SELECT creator_id
  INTO _playlist_owner
  FROM public.playlists
  WHERE id = _playlist_id
    AND creator_id = auth.uid()
  FOR UPDATE;

  IF _playlist_owner IS NULL THEN
    RAISE EXCEPTION 'Playlist not found or access denied';
  END IF;

  IF COALESCE(cardinality(_track_ids), 0) = 0 THEN
    RAISE EXCEPTION 'A published playlist must contain at least one song';
  END IF;

  IF (
    SELECT count(DISTINCT requested.track_id)
    FROM unnest(_track_ids) AS requested(track_id)
  ) <> cardinality(_track_ids) THEN
    RAISE EXCEPTION 'A song can appear only once in a playlist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(_track_ids) AS requested(track_id)
    LEFT JOIN public.tracks t ON t.id = requested.track_id
    WHERE t.id IS NULL
      OR t.creator_id <> auth.uid()
      OR t.status <> 'published'
  ) THEN
    RAISE EXCEPTION 'Playlists can contain only your published songs';
  END IF;

  DELETE FROM public.playlist_tracks
  WHERE playlist_id = _playlist_id;

  INSERT INTO public.playlist_tracks (playlist_id, track_id, position)
  SELECT _playlist_id, requested.track_id, requested.ordinality - 1
  FROM unnest(_track_ids) WITH ORDINALITY AS requested(track_id, ordinality);
END;
$$;

REVOKE ALL ON FUNCTION public.replace_playlist_tracks(uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_playlist_tracks(uuid, uuid[]) TO authenticated;
