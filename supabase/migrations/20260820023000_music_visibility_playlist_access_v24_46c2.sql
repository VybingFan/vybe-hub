-- VYBE V24.46C2 - Music Visibility + Playlist Access
-- Adds an intentional RLS path for published UNLISTED tracks when they are
-- contained in a currently shareable published playlist.
-- PRIVATE tracks remain private.

begin;

create or replace function public.track_is_in_shareable_playlist(p_track_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.playlist_tracks pt
    join public.playlists p on p.id = pt.playlist_id
    where pt.track_id = p_track_id
      and p.is_published = true
      and p.access_mode in ('public', 'unlisted')
      and (p.access_expires_at is null or p.access_expires_at > now())
  );
$$;

revoke all on function public.track_is_in_shareable_playlist(uuid) from public;
grant execute on function public.track_is_in_shareable_playlist(uuid) to anon, authenticated, service_role;

drop policy if exists "Unlisted tracks can play through shareable playlists" on public.tracks;
create policy "Unlisted tracks can play through shareable playlists"
  on public.tracks
  for select
  to anon, authenticated
  using (
    status = 'published'
    and visibility = 'unlisted'
    and public.track_is_in_shareable_playlist(id)
  );

commit;
