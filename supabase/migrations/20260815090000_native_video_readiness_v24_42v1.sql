-- VYBE V24.42V1 - native video processing readiness and publish safety.
begin;
alter table public.creator_videos
  add column if not exists processing_progress integer not null default 0 check(processing_progress between 0 and 100),
  add column if not exists processing_error text,
  add column if not exists ready_at timestamptz,
  add column if not exists stream_require_signed_urls boolean not null default false;

create or replace function public.prevent_unready_native_video_publish()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.provider='cloudflare_stream' and new.status='published' and new.ready_at is null then
    raise exception 'This native video is still processing and cannot be published yet';
  end if;
  return new;
end; $$;
drop trigger if exists prevent_unready_native_video_publish_trigger on public.creator_videos;
create trigger prevent_unready_native_video_publish_trigger before insert or update of status,ready_at on public.creator_videos
for each row execute function public.prevent_unready_native_video_publish();

comment on column public.creator_videos.processing_progress is 'Cloudflare Stream encoding progress. Server status synchronization is authoritative.';
comment on column public.creator_videos.ready_at is 'Set only after the video provider confirms playback readiness.';
commit;
