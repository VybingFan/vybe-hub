-- VYBE V24.42B2A2B - Public Creator Read Performance Repair
--
-- Purpose:
--   Break expensive anonymous RLS dependency chains used by public creator pages
--   and short-lived public media signing while preserving existing membership
--   continuity rules and Creator Free video restrictions.
--
-- Scope:
--   - creator_profiles public playlist-owner visibility
--   - public creator track/merch profile checks
--   - public storage signing checks for creator/playlist/merch media
--
-- This migration does not broaden public content eligibility. Security-definer
-- helpers reproduce the existing predicates while avoiding nested RLS expansion.

begin;

create or replace function public.creator_is_named_public_v24_42b2a2b(
  p_creator_id uuid
) returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.creator_profiles cp
    where cp.user_id = p_creator_id
      and cp.username is not null
  );
$$;

create or replace function public.creator_has_public_playlist_v24_42b2a2b(
  p_creator_id uuid
) returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.playlists p
    where p.creator_id = p_creator_id
      and p.is_published
      and public.creator_entity_is_publicly_available(
        p.creator_id,
        'playlist',
        p.id
      )
  );
$$;

create or replace function public.creator_profile_image_is_public_v24_42b2a2b(
  p_object_name text
) returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.creator_profiles cp
    where cp.username is not null
      and (cp.avatar_path = p_object_name or cp.cover_path = p_object_name)
  );
$$;

create or replace function public.creator_track_media_is_public_v24_42b2a2b(
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
      and public.creator_entity_is_publicly_available(
        t.creator_id,
        'track',
        t.id
      )
      and (
        (p_bucket_id = 'music-audio' and t.audio_url = p_object_name)
        or
        (p_bucket_id = 'music-covers' and t.cover_url = p_object_name)
      )
  );
$$;

create or replace function public.playlist_media_is_public_v24_42b2a2b(
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
    join public.playlist_tracks pt on pt.track_id = t.id
    join public.playlists p on p.id = pt.playlist_id
    where p.is_published
      and public.creator_entity_is_publicly_available(
        p.creator_id,
        'playlist',
        p.id
      )
      and public.creator_entity_is_publicly_available(
        t.creator_id,
        'track',
        t.id
      )
      and (
        (p_bucket_id = 'music-audio' and t.audio_url = p_object_name)
        or
        (p_bucket_id = 'music-covers' and t.cover_url = p_object_name)
      )
  );
$$;

create or replace function public.playlist_cover_is_public_v24_42b2a2b(
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
    where p.cover_path = p_object_name
      and p.is_published
      and public.creator_entity_is_publicly_available(
        p.creator_id,
        'playlist',
        p.id
      )
  );
$$;

create or replace function public.merch_image_is_public_v24_42b2a2b(
  p_object_name text
) returns boolean
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
      and public.creator_entity_is_publicly_available(
        product.creator_id,
        'merch',
        product.id
      )
  );
$$;

revoke all on function public.creator_is_named_public_v24_42b2a2b(uuid) from public;
revoke all on function public.creator_has_public_playlist_v24_42b2a2b(uuid) from public;
revoke all on function public.creator_profile_image_is_public_v24_42b2a2b(text) from public;
revoke all on function public.creator_track_media_is_public_v24_42b2a2b(text,text) from public;
revoke all on function public.playlist_media_is_public_v24_42b2a2b(text,text) from public;
revoke all on function public.playlist_cover_is_public_v24_42b2a2b(text) from public;
revoke all on function public.merch_image_is_public_v24_42b2a2b(text) from public;

grant execute on function public.creator_is_named_public_v24_42b2a2b(uuid) to anon, authenticated, service_role;
grant execute on function public.creator_has_public_playlist_v24_42b2a2b(uuid) to anon, authenticated, service_role;
grant execute on function public.creator_profile_image_is_public_v24_42b2a2b(text) to anon, authenticated, service_role;
grant execute on function public.creator_track_media_is_public_v24_42b2a2b(text,text) to anon, authenticated, service_role;
grant execute on function public.playlist_media_is_public_v24_42b2a2b(text,text) to anon, authenticated, service_role;
grant execute on function public.playlist_cover_is_public_v24_42b2a2b(text) to anon, authenticated, service_role;
grant execute on function public.merch_image_is_public_v24_42b2a2b(text) to anon, authenticated, service_role;

-- Keep named creator pages public exactly as before. Replace only the playlist
-- fallback with a bounded security-definer check so creator_profiles no longer
-- expands into playlist RLS during a simple anonymous username lookup.
drop policy if exists "Published playlist creators are public" on public.creator_profiles;
create policy "Published playlist creators are public"
  on public.creator_profiles for select to anon
  using (public.creator_has_public_playlist_v24_42b2a2b(user_id));

-- Avoid re-entering creator_profiles RLS from public track eligibility checks.
drop policy if exists "Published creator tracks are public" on public.tracks;
create policy "Published creator tracks are public"
  on public.tracks for select to anon
  using (
    status = 'published'
    and public.creator_is_named_public_v24_42b2a2b(creator_id)
  );

-- Avoid re-entering creator_profiles RLS from public merch eligibility checks.
drop policy if exists "Active merch on named artist pages is public" on public.merch_products;
create policy "Active merch on named artist pages is public"
  on public.merch_products for select to anon, authenticated
  using (
    (is_active and public.creator_is_named_public_v24_42b2a2b(creator_id))
    or creator_id = auth.uid()
  );

-- Replace nested table joins in anonymous storage policies with bounded helper
-- checks. The helpers explicitly preserve content-continuity eligibility.
drop policy if exists "Named creator profile images can be signed" on storage.objects;
create policy "Named creator profile images can be signed"
  on storage.objects for select to anon
  using (
    bucket_id = 'avatars'
    and public.creator_profile_image_is_public_v24_42b2a2b(name)
  );

drop policy if exists "Published creator media can be signed" on storage.objects;
create policy "Published creator media can be signed"
  on storage.objects for select to anon
  using (
    bucket_id in ('music-audio', 'music-covers')
    and public.creator_track_media_is_public_v24_42b2a2b(bucket_id, name)
  );

drop policy if exists "Published playlist media can be signed" on storage.objects;
create policy "Published playlist media can be signed"
  on storage.objects for select to anon
  using (
    bucket_id in ('music-audio', 'music-covers')
    and public.playlist_media_is_public_v24_42b2a2b(bucket_id, name)
  );

drop policy if exists "Published playlist covers can be signed" on storage.objects;
create policy "Published playlist covers can be signed"
  on storage.objects for select to anon
  using (
    bucket_id = 'music-covers'
    and public.playlist_cover_is_public_v24_42b2a2b(name)
  );

drop policy if exists "Visible merch images can be signed" on storage.objects;
create policy "Visible merch images can be signed"
  on storage.objects for select to anon
  using (
    bucket_id = 'music-covers'
    and public.merch_image_is_public_v24_42b2a2b(name)
  );

commit;
