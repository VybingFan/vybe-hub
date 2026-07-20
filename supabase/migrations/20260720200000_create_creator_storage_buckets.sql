-- The object policies existed before the physical buckets. Create the buckets
-- idempotently so fresh and existing projects can upload creator media.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'avatars',
    'avatars',
    false,
    8388608,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'music-covers',
    'music-covers',
    false,
    8388608,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'music-audio',
    'music-audio',
    false,
    52428800,
    ARRAY[
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/mp4',
      'audio/aac',
      'audio/ogg',
      'audio/flac'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
