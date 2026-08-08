-- VYBE V24.39 Phase 1
-- Creator-controlled public music and playlist presentation.

begin;

alter table public.tracks
  add column if not exists show_on_public_profile boolean not null default true,
  add column if not exists profile_feature_rank smallint,
  add column if not exists subgenres text[] not null default '{}',
  add column if not exists activity_tags text[] not null default '{}';

alter table public.tracks
  drop constraint if exists tracks_profile_feature_rank_check;

alter table public.tracks
  add constraint tracks_profile_feature_rank_check
  check (profile_feature_rank is null or profile_feature_rank between 1 and 5);

create unique index if not exists tracks_creator_profile_feature_rank_unique
  on public.tracks (creator_id, profile_feature_rank)
  where profile_feature_rank is not null;

create index if not exists tracks_public_profile_presentation_idx
  on public.tracks (creator_id, show_on_public_profile, profile_feature_rank, release_date desc)
  where status = 'published' and visibility = 'public';

with featured as (
  select id,
         row_number() over (partition by creator_id order by updated_at desc, created_at desc) as rank
  from public.tracks
  where is_featured = true
)
update public.tracks t
set profile_feature_rank = 1
from featured f
where t.id = f.id
  and f.rank = 1
  and t.profile_feature_rank is null;

alter table public.playlists
  add column if not exists show_on_public_profile boolean not null default false,
  add column if not exists profile_display_order integer not null default 0;

create index if not exists playlists_public_profile_presentation_idx
  on public.playlists (creator_id, profile_display_order, updated_at desc)
  where is_published = true
    and access_mode = 'public'
    and show_on_public_profile = true;

create or replace function public.set_track_profile_feature_v24_39(
  _track_id uuid,
  _rank smallint default null
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if _rank is not null and (_rank < 1 or _rank > 5) then
    raise exception 'Top 5 position must be between 1 and 5';
  end if;

  if not exists (
    select 1
    from public.tracks
    where id = _track_id
      and creator_id = actor_id
      and status = 'published'
  ) then
    raise exception 'Published song not found';
  end if;

  if _rank is not null then
    update public.tracks
    set profile_feature_rank = null,
        updated_at = now()
    where creator_id = actor_id
      and profile_feature_rank = _rank
      and id <> _track_id;
  end if;

  update public.tracks
  set profile_feature_rank = _rank,
      show_on_public_profile = case when _rank is null then show_on_public_profile else true end,
      updated_at = now()
  where id = _track_id
    and creator_id = actor_id;
end;
$function$;

revoke all on function public.set_track_profile_feature_v24_39(uuid, smallint) from public;
grant execute on function public.set_track_profile_feature_v24_39(uuid, smallint)
  to authenticated, service_role;

comment on column public.tracks.show_on_public_profile is
  'Controls placement on the creator website. Access remains governed by status, visibility, and playback_mode.';

comment on column public.tracks.profile_feature_rank is
  'Creator-selected Artist Top 5 position from 1 through 5.';

comment on column public.playlists.show_on_public_profile is
  'Public placement control. Unlisted and protected playlists remain link-only regardless of this value.';

commit;
