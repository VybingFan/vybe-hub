-- VYBE V24.42B2A - authorized film project catalog and Watch destinations.
begin;

create or replace function public.creator_has_focus(_creator_id uuid, _focus_code text)
returns boolean language sql stable security definer set search_path=public
as $$
  select exists(select 1 from public.creator_focus_access
    where creator_id=_creator_id and focus_code=_focus_code
      and status in ('active','grace') and (ends_at is null or ends_at>now()));
$$;

create table public.film_projects (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  project_type text not null check (project_type in ('feature','short_film','documentary','series','episode','music_video','trailer','other')),
  production_stage text not null default 'concept' check (production_stage in ('concept','development','pre_production','production','post_production','festival','released','archived')),
  synopsis text not null default '' check (char_length(synopsis)<=5000),
  release_year integer check (release_year between 1888 and 2200),
  poster_url text check (poster_url is null or poster_url ~* '^https://[^[:space:]]+$'),
  visibility text not null default 'draft' check (visibility in ('draft','public','private')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index film_projects_creator_idx on public.film_projects(creator_id,created_at desc);

create table public.film_watch_destinations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.film_projects(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 100),
  destination_url text not null check (destination_url ~* '^https://[^[:space:]]+$'),
  destination_kind text not null default 'official' check (destination_kind in ('official','streaming','rental','purchase','tickets','festival','other')),
  sort_order integer not null default 0, created_at timestamptz not null default now(),
  unique(project_id,destination_url)
);

grant select,insert,update,delete on public.film_projects,public.film_watch_destinations to authenticated;
grant all on public.film_projects,public.film_watch_destinations to service_role;
alter table public.film_projects enable row level security;
alter table public.film_watch_destinations enable row level security;

create policy "Film creators manage own projects" on public.film_projects for all to authenticated
  using (creator_id=auth.uid() and public.creator_has_focus(auth.uid(),'film'))
  with check (creator_id=auth.uid() and public.creator_has_focus(auth.uid(),'film'));
create policy "Public film projects are readable" on public.film_projects for select to anon,authenticated
  using (visibility='public');
create policy "Film creators manage own Watch destinations" on public.film_watch_destinations for all to authenticated
  using (creator_id=auth.uid() and public.creator_has_focus(auth.uid(),'film'))
  with check (creator_id=auth.uid() and public.creator_has_focus(auth.uid(),'film') and exists(
    select 1 from public.film_projects p where p.id=project_id and p.creator_id=auth.uid()));
create policy "Public film Watch destinations are readable" on public.film_watch_destinations for select to anon,authenticated
  using (exists(select 1 from public.film_projects p where p.id=project_id and p.visibility='public'));

create or replace function public.enforce_film_project_allowance()
returns trigger language plpgsql security definer set search_path=public as $$
declare allowed integer; used integer; private_enabled boolean;
begin
  if not public.creator_has_focus(new.creator_id,'film') then raise exception 'Film & Video workspace access is required'; end if;
  select a.project_limit,a.private_media_enabled into allowed,private_enabled
  from public.creator_plan_discipline_allowances a
  where a.plan_code=public.active_creator_plan(new.creator_id) and a.discipline='film';
  if tg_op='INSERT' then
    select count(*) into used from public.film_projects where creator_id=new.creator_id;
    if used>=coalesce(allowed,0) then raise exception 'Your Film project allowance has been reached'; end if;
  end if;
  if new.visibility='private' and not coalesce(private_enabled,false) then
    raise exception 'Private hosted film delivery is not enabled for this membership';
  end if;
  return new;
end; $$;
create trigger enforce_film_project_allowance_trigger before insert or update on public.film_projects
for each row execute function public.enforce_film_project_allowance();

create or replace function public.enforce_film_playlist_focus()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.presentation_type='film' and not public.creator_has_focus(new.creator_id,'film') then
    raise exception 'Film & Video workspace access is required';
  end if;
  return new;
end; $$;
drop trigger if exists enforce_film_playlist_focus_trigger on public.playlists;
create trigger enforce_film_playlist_focus_trigger before insert or update of presentation_type on public.playlists
for each row execute function public.enforce_film_playlist_focus();

revoke all on function public.creator_has_focus(uuid,text) from public;
grant execute on function public.creator_has_focus(uuid,text) to anon,authenticated,service_role;

comment on table public.film_projects is 'Authorized Film & Video workspace projects. Project records do not themselves publish or host media.';
comment on table public.film_watch_destinations is 'Creator-supplied HTTPS destinations showing where an authorized film project can be watched, rented, purchased, ticketed, or screened.';
commit;
