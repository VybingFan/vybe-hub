-- VYBE V24.64B
-- Protected Playlist RLS Hardening
--
-- Goal:
-- Prevent password/approved-listener/membership-only playlists and their
-- playlist-track membership/media from being readable merely because a
-- playlist is marked is_published=true.
--
-- Protected playlist delivery continues through /api/secure-playlist, which
-- verifies password/sign-in/grants server-side and signs authorized media using
-- the server admin client.

begin;

drop policy if exists "Published playlists are link-viewable" on public.playlists;

create policy "Public and unlisted playlists are link-viewable"
on public.playlists
for select
to anon, authenticated
using (
  is_published = true
  and access_mode in ('public', 'unlisted')
  and (access_expires_at is null or access_expires_at > now())
);

drop policy if exists "Published playlist tracks are link-viewable" on public.playlist_tracks;

create policy "Public and unlisted playlist tracks are link-viewable"
on public.playlist_tracks
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.playlists p
    where p.id = playlist_tracks.playlist_id
      and p.is_published = true
      and p.access_mode in ('public', 'unlisted')
      and (p.access_expires_at is null or p.access_expires_at > now())
  )
);

drop policy if exists "playlists_membership_continuity_select" on public.playlists;

create policy "playlists_membership_continuity_select"
on public.playlists
for select
to public
using (
  is_published = true
  and access_mode in ('public', 'unlisted')
  and (access_expires_at is null or access_expires_at > now())
  and creator_entity_is_publicly_available(creator_id, 'playlist'::text, id)
);

create or replace function public.public_playlist_media_is_visible_v24_50c(
  p_bucket_id text,
  p_object_name text
)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select exists (
    select 1
    from public.playlists p
    where p.is_published = true
      and p.access_mode in ('public', 'unlisted')
      and (p.access_expires_at is null or p.access_expires_at > now())
      and public.creator_entity_is_publicly_available(p.creator_id, 'playlist', p.id)
      and p_bucket_id = 'music-covers'
      and p.cover_path = p_object_name
  )
  or exists (
    select 1
    from public.playlist_tracks pt
    join public.playlists p on p.id = pt.playlist_id
    join public.tracks t on t.id = pt.track_id
    where p.is_published = true
      and p.access_mode in ('public', 'unlisted')
      and (p.access_expires_at is null or p.access_expires_at > now())
      and t.status = 'published'
      and public.creator_entity_is_publicly_available(p.creator_id, 'playlist', p.id)
      and public.creator_entity_is_publicly_available(t.creator_id, 'track', t.id)
      and (
        (p_bucket_id = 'music-audio' and t.audio_url = p_object_name)
        or (p_bucket_id = 'music-previews' and t.preview_audio_path = p_object_name)
        or (p_bucket_id = 'music-covers' and t.cover_url = p_object_name)
      )
  );
$function$;

commit;
