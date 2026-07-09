
CREATE POLICY "Authenticated read music/avatar buckets"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('music-audio', 'music-covers', 'avatars'));

CREATE POLICY "Users write own folder in music/avatar buckets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('music-audio', 'music-covers', 'avatars')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own folder in music/avatar buckets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('music-audio', 'music-covers', 'avatars')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own folder in music/avatar buckets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('music-audio', 'music-covers', 'avatars')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
