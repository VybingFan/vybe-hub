-- V24.5: creator-managed playlist artwork.
ALTER TABLE public.playlists
  ADD COLUMN IF NOT EXISTS cover_path text;

-- Public playlist visitors may request a short-lived URL only for artwork
-- attached to a published playlist.
DROP POLICY IF EXISTS "Published playlist covers can be signed" ON storage.objects;
CREATE POLICY "Published playlist covers can be signed"
  ON storage.objects FOR SELECT TO anon
  USING (
    bucket_id = 'music-covers'
    AND EXISTS (
      SELECT 1
      FROM public.playlists p
      WHERE p.cover_path = name
        AND p.is_published
    )
  );
