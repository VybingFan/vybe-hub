begin;

create or replace function public.enforce_native_video_publish_visibility_v24_46f2r1()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.provider = 'cloudflare_stream'
     and new.status = 'published'
     and new.visibility = 'private'
     and coalesce(new.stream_require_signed_urls, false) = false then
    new.visibility := 'public';
  end if;
  return new;
end;
$$;

drop trigger if exists native_video_publish_visibility_v24_46f2r1 on public.creator_videos;

create trigger native_video_publish_visibility_v24_46f2r1
before insert or update of status, visibility, stream_require_signed_urls
on public.creator_videos
for each row
execute function public.enforce_native_video_publish_visibility_v24_46f2r1();

commit;
