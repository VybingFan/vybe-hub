-- VYBE V24.50C - Public Media Access Alignment
-- Allows both logged-out visitors and signed-in VYBE members to sign URLs for
-- media that is already eligible for public display. Private media stays private.

begin;

create or replace function public.public_creator_image_is_visible_v24_50c(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.creator_profiles cp
    where cp.username is not null
      and (
        cp.avatar_path = p_object_name
        or cp.cover_path = p_object_name
        or cp.profile_background_path = p_object_name
      )
  );
$$;

create or replace function public.public_track_media_is_visible_v24_50c(
  p_bucket_id text,
  p_object_name text
) returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.tracks t
    join public.creator_profiles cp on cp.user_id = t.creator_id
    where cp.username is not null
      and t.status = 'published'
      and public.creator_entity_is_publicly_available(t.creator_id, 'track', t.id)
      and (
        (p_bucket_id = 'music-audio' and t.audio_url = p_object_name)
        or (p_bucket_id = 'music-previews' and t.preview_audio_path = p_object_name)
        or (p_bucket_id = 'music-covers' and t.cover_url = p_object_name)
      )
  );
$$;

create or replace function public.public_playlist_media_is_visible_v24_50c(
  p_bucket_id text,
  p_object_name text
) returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.playlists p
    where p.is_published
      and public.creator_entity_is_publicly_available(p.creator_id, 'playlist', p.id)
      and p_bucket_id = 'music-covers'
      and p.cover_path = p_object_name
  )
  or exists (
    select 1
    from public.playlist_tracks pt
    join public.playlists p on p.id = pt.playlist_id
    join public.tracks t on t.id = pt.track_id
    where p.is_published
      and t.status = 'published'
      and public.creator_entity_is_publicly_available(p.creator_id, 'playlist', p.id)
      and public.creator_entity_is_publicly_available(t.creator_id, 'track', t.id)
      and (
        (p_bucket_id = 'music-audio' and t.audio_url = p_object_name)
        or (p_bucket_id = 'music-previews' and t.preview_audio_path = p_object_name)
        or (p_bucket_id = 'music-covers' and t.cover_url = p_object_name)
      )
  );
$$;

create or replace function public.public_merch_image_is_visible_v24_50c(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.merch_products product
    join public.creator_profiles creator on creator.user_id = product.creator_id
    where product.image_path = p_object_name
      and product.is_active
      and creator.username is not null
      and public.creator_entity_is_publicly_available(product.creator_id, 'merch', product.id)
  );
$$;

create or replace function public.public_video_thumbnail_is_visible_v24_50c(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.creator_videos video
    join public.creator_profiles creator on creator.user_id = video.creator_id
    where video.thumbnail_path = p_object_name
      and video.status = 'published'
      and video.visibility = 'public'
      and creator.username is not null
  );
$$;

revoke all on function public.public_creator_image_is_visible_v24_50c(text) from public;
revoke all on function public.public_track_media_is_visible_v24_50c(text,text) from public;
revoke all on function public.public_playlist_media_is_visible_v24_50c(text,text) from public;
revoke all on function public.public_merch_image_is_visible_v24_50c(text) from public;
revoke all on function public.public_video_thumbnail_is_visible_v24_50c(text) from public;

grant execute on function public.public_creator_image_is_visible_v24_50c(text) to anon, authenticated, service_role;
grant execute on function public.public_track_media_is_visible_v24_50c(text,text) to anon, authenticated, service_role;
grant execute on function public.public_playlist_media_is_visible_v24_50c(text,text) to anon, authenticated, service_role;
grant execute on function public.public_merch_image_is_visible_v24_50c(text) to anon, authenticated, service_role;
grant execute on function public.public_video_thumbnail_is_visible_v24_50c(text) to anon, authenticated, service_role;

drop policy if exists "Named creator profile images can be signed" on storage.objects;
create policy "Named creator profile images can be signed"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'avatars'
    and public.public_creator_image_is_visible_v24_50c(name)
  );

drop policy if exists "Published creator media can be signed" on storage.objects;
create policy "Published creator media can be signed"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id in ('music-audio', 'music-previews', 'music-covers')
    and public.public_track_media_is_visible_v24_50c(bucket_id, name)
  );

drop policy if exists "Published playlist media can be signed" on storage.objects;
create policy "Published playlist media can be signed"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id in ('music-audio', 'music-previews', 'music-covers')
    and public.public_playlist_media_is_visible_v24_50c(bucket_id, name)
  );

drop policy if exists "Published playlist covers can be signed" on storage.objects;
create policy "Published playlist covers can be signed"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'music-covers'
    and public.public_playlist_media_is_visible_v24_50c(bucket_id, name)
  );

drop policy if exists "Visible merch images can be signed" on storage.objects;
create policy "Visible merch images can be signed"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'music-covers'
    and public.public_merch_image_is_visible_v24_50c(name)
  );

drop policy if exists "Published video thumbnails can be signed" on storage.objects;
create policy "Published video thumbnails can be signed"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'music-covers'
    and public.public_video_thumbnail_is_visible_v24_50c(name)
  );

commit;
