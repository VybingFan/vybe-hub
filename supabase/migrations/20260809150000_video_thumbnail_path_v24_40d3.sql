alter table public.creator_videos
  add column if not exists thumbnail_path text;

comment on column public.creator_videos.thumbnail_path is
  'Private storage path for a creator-uploaded video thumbnail.';
