-- VYBE V24.42B1A - creator focus authorization foundation.
-- One primary focus is included. Additional focus access is explicit and
-- separate from the base creator membership. No billing is activated here.

begin;

create table public.creator_focus_catalog (
  focus_code text primary key,
  public_name text not null,
  description text not null,
  launch_state text not null default 'planned'
    check (launch_state in ('available', 'foundation', 'planned')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.creator_focus_catalog
  (focus_code, public_name, description, launch_state, sort_order)
values
  ('music', 'Music', 'Songs, releases, music playlists, lyrics, listening analytics, and artist tools.', 'available', 10),
  ('film', 'Film & Video', 'Film projects, trailers, scenes, private review media, Watch links, and video analytics.', 'foundation', 20),
  ('theater', 'Theater & Live Performance', 'Productions, rehearsals, scenes, readings, performance dates, tickets, and promotional media.', 'planned', 30),
  ('writing', 'Writing & Poetry', 'Poems, stories, essays, lyrics, readings, and written creator projects.', 'planned', 40),
  ('visual_art', 'Visual Art', 'Artwork collections, exhibitions, commissions, process media, and portfolio presentation.', 'planned', 50),
  ('podcasting', 'Podcasting & Spoken Word', 'Episodes, serialized audio, interviews, spoken word, and audience analytics.', 'planned', 60),
  ('dance', 'Dance & Performance', 'Performance projects, rehearsals, showcases, bookings, and collaborative media.', 'planned', 70)
on conflict (focus_code) do update set
  public_name = excluded.public_name,
  description = excluded.description,
  launch_state = excluded.launch_state,
  sort_order = excluded.sort_order,
  updated_at = now();

grant select on public.creator_focus_catalog to anon, authenticated;
grant all on public.creator_focus_catalog to service_role;
alter table public.creator_focus_catalog enable row level security;
create policy "Creator focus catalog is publicly readable"
  on public.creator_focus_catalog for select to anon, authenticated using (true);

-- Remove the earlier pseudo-focus. A creator can be authorized for several
-- real focuses, but "multidisciplinary" is not itself a workspace.
update public.creator_profiles
set primary_creator_discipline = 'music'
where primary_creator_discipline = 'multidisciplinary';

alter table public.creator_profiles
  drop constraint if exists creator_profiles_primary_creator_discipline_check;
alter table public.creator_profiles
  add constraint creator_profiles_primary_creator_discipline_check
  check (primary_creator_discipline in ('music', 'film', 'theater', 'writing', 'visual_art', 'podcasting', 'dance'));

create table public.creator_focus_access (
  creator_id uuid not null references auth.users(id) on delete cascade,
  focus_code text not null references public.creator_focus_catalog(focus_code) on delete restrict,
  access_kind text not null check (access_kind in ('primary', 'additional')),
  status text not null default 'active' check (status in ('active', 'grace', 'inactive')),
  source text not null default 'migration'
    check (source in ('migration', 'subscription', 'admin', 'founding')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (creator_id, focus_code),
  check (ends_at is null or ends_at > starts_at)
);

create unique index creator_focus_access_one_primary_idx
  on public.creator_focus_access (creator_id)
  where access_kind = 'primary' and status in ('active', 'grace');
create index creator_focus_access_active_idx
  on public.creator_focus_access (creator_id, status, focus_code);

insert into public.creator_focus_access
  (creator_id, focus_code, access_kind, status, source)
select
  cp.user_id,
  coalesce(cp.primary_creator_discipline, 'music'),
  'primary',
  'active',
  'migration'
from public.creator_profiles cp
on conflict (creator_id, focus_code) do nothing;

grant select on public.creator_focus_access to authenticated;
grant all on public.creator_focus_access to service_role;
alter table public.creator_focus_access enable row level security;
create policy "Creators read own focus access"
  on public.creator_focus_access for select to authenticated
  using (creator_id = auth.uid());
create policy "Admins manage creator focus access"
  on public.creator_focus_access for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create table public.creator_focus_usage (
  creator_id uuid not null references auth.users(id) on delete cascade,
  focus_code text not null references public.creator_focus_catalog(focus_code) on delete restrict,
  period_start date not null,
  project_count integer not null default 0 check (project_count >= 0),
  published_project_count integer not null default 0 check (published_project_count >= 0),
  external_media_link_count integer not null default 0 check (external_media_link_count >= 0),
  hosted_media_minutes numeric(12,2) not null default 0 check (hosted_media_minutes >= 0),
  private_review_playlist_count integer not null default 0 check (private_review_playlist_count >= 0),
  ai_action_count integer not null default 0 check (ai_action_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (creator_id, focus_code, period_start)
);

grant select on public.creator_focus_usage to authenticated;
grant all on public.creator_focus_usage to service_role;
alter table public.creator_focus_usage enable row level security;
create policy "Creators read own focus usage"
  on public.creator_focus_usage for select to authenticated
  using (creator_id = auth.uid());
create policy "Admins manage creator focus usage"
  on public.creator_focus_usage for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.creator_focus_limit(_creator_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case public.active_creator_plan(_creator_id)
    when 'creator_plus' then 2
    when 'creator_pro' then 5
    when 'creator_studio' then 5
    when 'founding_beta' then 5
    else 1
  end;
$$;

create or replace function public.get_my_creator_focus_access()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with active_access as (
    select a.focus_code, a.access_kind, a.status, a.source, a.starts_at, a.ends_at,
           c.public_name, c.description, c.launch_state, c.sort_order
    from public.creator_focus_access a
    join public.creator_focus_catalog c using (focus_code)
    where a.creator_id = auth.uid()
      and a.status in ('active', 'grace')
      and (a.ends_at is null or a.ends_at > now())
  )
  select jsonb_build_object(
    'primary_focus', coalesce(
      (select focus_code from active_access where access_kind = 'primary' limit 1),
      'music'
    ),
    'focus_limit', public.creator_focus_limit(auth.uid()),
    'active_focus_count', (select count(*) from active_access),
    'can_add_second_focus',
      public.active_creator_plan(auth.uid()) in ('creator_plus', 'creator_pro', 'creator_studio', 'founding_beta'),
    'can_use_multi_focus',
      public.active_creator_plan(auth.uid()) in ('creator_pro', 'creator_studio', 'founding_beta'),
    'access', coalesce(
      (select jsonb_agg(to_jsonb(active_access) order by
        case when access_kind = 'primary' then 0 else 1 end, sort_order)
       from active_access),
      '[]'::jsonb
    )
  );
$$;

create or replace function public.set_my_primary_creator_focus(
  _focus_code text,
  _confirmed boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not coalesce(_confirmed, false) then
    raise exception 'Confirm the primary creator focus change';
  end if;

  if not exists (
    select 1 from public.creator_focus_access
    where creator_id = auth.uid()
      and focus_code = _focus_code
      and status in ('active', 'grace')
      and (ends_at is null or ends_at > now())
  ) then
    raise exception 'This creator focus is not active on your membership';
  end if;

  update public.creator_focus_access
  set access_kind = 'additional', updated_at = now()
  where creator_id = auth.uid() and access_kind = 'primary';

  update public.creator_focus_access
  set access_kind = 'primary', updated_at = now()
  where creator_id = auth.uid() and focus_code = _focus_code;

  update public.creator_profiles
  set primary_creator_discipline = _focus_code
  where user_id = auth.uid();
end;
$$;

create or replace function public.admin_set_creator_focus_access(
  _creator_id uuid,
  _focus_code text,
  _enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count integer;
  has_primary boolean;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Admin access required';
  end if;
  if not exists (select 1 from public.creator_focus_catalog where focus_code = _focus_code) then
    raise exception 'Unknown creator focus';
  end if;

  if _enabled then
    select count(*) into active_count
    from public.creator_focus_access
    where creator_id = _creator_id and status in ('active', 'grace')
      and (ends_at is null or ends_at > now());

    if not exists (
      select 1 from public.creator_focus_access
      where creator_id = _creator_id and focus_code = _focus_code
        and status in ('active', 'grace')
    ) and active_count >= public.creator_focus_limit(_creator_id) then
      raise exception 'This membership has reached its creator focus limit';
    end if;

    select exists (
      select 1 from public.creator_focus_access
      where creator_id = _creator_id and access_kind = 'primary'
        and status in ('active', 'grace')
    ) into has_primary;

    insert into public.creator_focus_access
      (creator_id, focus_code, access_kind, status, source, ends_at)
    values
      (_creator_id, _focus_code, case when has_primary then 'additional' else 'primary' end,
       'active', 'admin', null)
    on conflict (creator_id, focus_code) do update set
      access_kind = case when has_primary then 'additional' else 'primary' end,
      status = 'active', source = 'admin', ends_at = null, updated_at = now();
  else
    if exists (
      select 1 from public.creator_focus_access
      where creator_id = _creator_id and focus_code = _focus_code
        and access_kind = 'primary' and status in ('active', 'grace')
    ) then
      raise exception 'Choose another authorized primary focus before removing this one';
    end if;
    update public.creator_focus_access
    set status = 'inactive', ends_at = coalesce(ends_at, now()), updated_at = now()
    where creator_id = _creator_id and focus_code = _focus_code;
  end if;
end;
$$;

revoke all on function public.creator_focus_limit(uuid) from public;
grant execute on function public.creator_focus_limit(uuid) to authenticated, service_role;
revoke all on function public.get_my_creator_focus_access() from public;
grant execute on function public.get_my_creator_focus_access() to authenticated;
revoke all on function public.set_my_primary_creator_focus(text, boolean) from public;
grant execute on function public.set_my_primary_creator_focus(text, boolean) to authenticated;
revoke all on function public.admin_set_creator_focus_access(uuid, text, boolean) from public;
grant execute on function public.admin_set_creator_focus_access(uuid, text, boolean) to authenticated;

comment on table public.creator_focus_access is
  'Explicit creator workspace authorization. Additional focuses require a later subscription or an admin/founding grant.';
comment on table public.creator_focus_usage is
  'Per-focus usage ledger foundation. Server workflows, not creator clients, update usage.';

commit;
