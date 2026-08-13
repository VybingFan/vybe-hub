-- VYBE V24.42A - mixed-media playlist and creator-discipline foundation.
-- Compatibility rule: existing creator accounts and playlists remain music-first.
-- This migration does not enable private film playback, screeners, or commerce.

begin;

alter table public.creator_profiles
  add column if not exists primary_creator_discipline text not null default 'music'
    check (primary_creator_discipline in ('music', 'film', 'theater', 'multidisciplinary'));

comment on column public.creator_profiles.primary_creator_discipline is
  'Selects creator-type-aware terminology and entitlements without changing the account membership plan.';

alter table public.playlists
  add column if not exists presentation_type text not null default 'music'
    check (presentation_type in ('music', 'film', 'theater', 'mixed'));

comment on column public.playlists.presentation_type is
  'Controls creator-facing and shared-page terminology. Existing playlists remain music.';

create table if not exists public.creator_plan_discipline_allowances (
  plan_code text not null references public.creator_plan_definitions(plan_code) on delete cascade,
  discipline text not null check (discipline in ('music', 'film', 'theater')),
  public_identity_label text not null,
  project_limit integer not null default 0 check (project_limit >= 0),
  published_project_limit integer not null default 0 check (published_project_limit >= 0),
  external_media_link_limit integer not null default 0 check (external_media_link_limit >= 0),
  hosted_media_minutes integer not null default 0 check (hosted_media_minutes >= 0),
  private_review_playlist_limit integer not null default 0 check (private_review_playlist_limit >= 0),
  private_screener_limit integer not null default 0 check (private_screener_limit >= 0),
  team_seat_limit integer not null default 1 check (team_seat_limit > 0),
  private_media_enabled boolean not null default false,
  commercial_distribution_enabled boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (plan_code, discipline),
  check (published_project_limit <= project_limit)
);

comment on table public.creator_plan_discipline_allowances is
  'Creator-type-specific features and usage. Pricing remains owned by creator_plan_definitions.';

insert into public.creator_plan_discipline_allowances (
  plan_code, discipline, public_identity_label, project_limit,
  published_project_limit, external_media_link_limit, hosted_media_minutes,
  private_review_playlist_limit, private_screener_limit, team_seat_limit,
  private_media_enabled, commercial_distribution_enabled, notes
) values
  ('creator_free', 'film', 'Film Creator Profile', 5, 3, 20, 0, 0, 0, 1, false, false,
   'Public projects, posters, trailers, and authorized external watch links. No private screener or commercial hosting.'),
  ('creator_plus', 'film', 'Film Creator Showcase', 20, 12, 100, 30, 3, 0, 1, false, false,
   'Expanded film presentation and limited protected playlist planning. Private hosted film delivery remains disabled.'),
  ('creator_pro', 'film', 'Film Creator Website', 75, 50, 300, 180, 25, 0, 1, false, false,
   'Professional catalog and protected-sharing eligibility. Screeners remain feature-flagged until delivery controls are complete.'),
  ('creator_studio', 'film', 'Film Studio Website', 200, 150, 1000, 600, 100, 0, 5, false, false,
   'Production catalog and team capacity. Commercial distribution remains disabled.'),
  ('founding_beta', 'film', 'Founding Film Creator', 75, 50, 300, 180, 25, 0, 1, false, false,
   'Invitation-only Creator Pro-equivalent film allowances while eligibility remains active.')
on conflict (plan_code, discipline) do update set
  public_identity_label = excluded.public_identity_label,
  project_limit = excluded.project_limit,
  published_project_limit = excluded.published_project_limit,
  external_media_link_limit = excluded.external_media_link_limit,
  hosted_media_minutes = excluded.hosted_media_minutes,
  private_review_playlist_limit = excluded.private_review_playlist_limit,
  private_screener_limit = excluded.private_screener_limit,
  team_seat_limit = excluded.team_seat_limit,
  private_media_enabled = excluded.private_media_enabled,
  commercial_distribution_enabled = excluded.commercial_distribution_enabled,
  notes = excluded.notes,
  updated_at = now();

grant select on public.creator_plan_discipline_allowances to anon, authenticated;
grant all on public.creator_plan_discipline_allowances to service_role;
alter table public.creator_plan_discipline_allowances enable row level security;

drop policy if exists "Creator discipline allowances are publicly readable"
  on public.creator_plan_discipline_allowances;
create policy "Creator discipline allowances are publicly readable"
  on public.creator_plan_discipline_allowances for select to anon, authenticated
  using (true);

create table if not exists public.playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  item_kind text not null check (item_kind in ('track', 'video', 'external_watch', 'project', 'note')),
  track_id uuid references public.tracks(id) on delete restrict,
  video_id uuid references public.creator_videos(id) on delete restrict,
  external_url text,
  external_label text,
  project_ref uuid,
  title_override text check (title_override is null or char_length(trim(title_override)) between 1 and 160),
  creator_note text not null default '' check (char_length(creator_note) <= 5000),
  start_time_sec integer check (start_time_sec is null or start_time_sec >= 0),
  end_time_sec integer check (end_time_sec is null or end_time_sec > 0),
  allow_download boolean not null default false,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (playlist_id, position),
  check (end_time_sec is null or start_time_sec is null or end_time_sec > start_time_sec),
  check (
    (item_kind = 'track' and track_id is not null and video_id is null and external_url is null and project_ref is null)
    or (item_kind = 'video' and track_id is null and video_id is not null and external_url is null and project_ref is null)
    or (item_kind = 'external_watch' and track_id is null and video_id is null and external_url ~* '^https://[^[:space:]]+$' and project_ref is null)
    or (item_kind = 'project' and track_id is null and video_id is null and external_url is null and project_ref is not null)
    or (item_kind = 'note' and track_id is null and video_id is null and external_url is null and project_ref is null and title_override is not null)
  )
);

create index if not exists playlist_items_playlist_order_idx
  on public.playlist_items (playlist_id, position);
create index if not exists playlist_items_track_idx
  on public.playlist_items (track_id) where track_id is not null;
create index if not exists playlist_items_video_idx
  on public.playlist_items (video_id) where video_id is not null;

comment on table public.playlist_items is
  'Ordered compatibility layer for mixed creator media. Public delivery must pass item eligibility and playlist authorization.';

grant select, insert, update, delete on public.playlist_items to authenticated;
grant all on public.playlist_items to service_role;
alter table public.playlist_items enable row level security;

drop policy if exists "Creators manage own playlist items" on public.playlist_items;
create policy "Creators manage own playlist items"
  on public.playlist_items for all to authenticated
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.creator_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.creator_id = auth.uid()
    )
    and (
      track_id is null or exists (
        select 1 from public.tracks t
        where t.id = track_id and t.creator_id = auth.uid()
      )
    )
    and (
      video_id is null or exists (
        select 1 from public.creator_videos v
        where v.id = video_id and v.creator_id = auth.uid()
      )
    )
  );

create or replace function public.replace_playlist_items(
  _playlist_id uuid,
  _items jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  _playlist_owner uuid;
  _item jsonb;
  _position integer := 0;
  _kind text;
  _track_id uuid;
  _video_id uuid;
begin
  if jsonb_typeof(coalesce(_items, '[]'::jsonb)) <> 'array' then
    raise exception 'Playlist items must be a JSON array';
  end if;

  select creator_id into _playlist_owner
  from public.playlists
  where id = _playlist_id and creator_id = auth.uid()
  for update;

  if _playlist_owner is null then
    raise exception 'Playlist not found or access denied';
  end if;

  for _item in select value from jsonb_array_elements(coalesce(_items, '[]'::jsonb))
  loop
    _kind := _item->>'item_kind';
    _track_id := nullif(_item->>'track_id', '')::uuid;
    _video_id := nullif(_item->>'video_id', '')::uuid;

    if _kind = 'track' and not exists (
      select 1 from public.tracks t where t.id = _track_id and t.creator_id = auth.uid()
    ) then
      raise exception 'Playlist track is not owned by this creator';
    end if;

    if _kind = 'video' and not exists (
      select 1 from public.creator_videos v where v.id = _video_id and v.creator_id = auth.uid()
    ) then
      raise exception 'Playlist video is not owned by this creator';
    end if;

    _position := _position + 1;
  end loop;

  delete from public.playlist_items where playlist_id = _playlist_id;
  _position := 0;

  for _item in select value from jsonb_array_elements(coalesce(_items, '[]'::jsonb))
  loop
    insert into public.playlist_items (
      playlist_id, item_kind, track_id, video_id, external_url, external_label,
      project_ref, title_override, creator_note, start_time_sec, end_time_sec,
      allow_download, position
    ) values (
      _playlist_id,
      _item->>'item_kind',
      nullif(_item->>'track_id', '')::uuid,
      nullif(_item->>'video_id', '')::uuid,
      nullif(btrim(_item->>'external_url'), ''),
      nullif(btrim(_item->>'external_label'), ''),
      nullif(_item->>'project_ref', '')::uuid,
      nullif(btrim(_item->>'title_override'), ''),
      coalesce(_item->>'creator_note', ''),
      nullif(_item->>'start_time_sec', '')::integer,
      nullif(_item->>'end_time_sec', '')::integer,
      coalesce((_item->>'allow_download')::boolean, false),
      _position
    );
    _position := _position + 1;
  end loop;
end;
$$;

revoke all on function public.replace_playlist_items(uuid, jsonb) from public;
grant execute on function public.replace_playlist_items(uuid, jsonb) to authenticated;

commit;

