-- V23.7.1: restore supported Storage insert authorization.
-- Bucket settings enforce MP3/image MIME types and absolute file ceilings.
-- The app enforces the lower plan-specific audio size before upload; track counts,
-- published counts, and duration remain enforced by Postgres triggers.

DROP POLICY IF EXISTS "Users write own folder in music/avatar buckets" ON storage.objects;
CREATE POLICY "Users write own folder in music/avatar buckets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('music-audio', 'music-covers', 'avatars')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
