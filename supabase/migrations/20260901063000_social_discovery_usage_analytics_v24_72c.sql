-- VYBE V24.72C - Social Discovery usage and creator analytics foundation.
-- Measures authenticated searches, result impressions, and outbound visits.
-- No supporter search allowance is enforced in this phase.

begin;

create table if not exists public.social_discovery_search_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  normalized_query text not null,
  result_count integer not null default 0 check (result_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.social_discovery_search_impressions (
  search_event_id uuid not null references public.social_discovery_search_events(id) on delete cascade,
  post_id uuid not null references public.creator_social_posts(id) on delete cascade,
  creator_id uuid not null,
  result_position integer not null check (result_position > 0),
  created_at timestamptz not null default now(),
  primary key (search_event_id, post_id)
);

create table if not exists public.social_discovery_outbound_clicks (
  id uuid primary key default gen_random_uuid(),
  search_event_id uuid not null references public.social_discovery_search_events(id) on delete cascade,
  post_id uuid not null references public.creator_social_posts(id) on delete cascade,
  creator_id uuid not null,
  actor_id uuid not null,
  platform text not null,
  created_at timestamptz not null default now()
);

create index if not exists social_discovery_search_events_actor_created_idx
  on public.social_discovery_search_events(actor_id, created_at desc);

create index if not exists social_discovery_search_impressions_creator_created_idx
  on public.social_discovery_search_impressions(creator_id, created_at desc);

create index if not exists social_discovery_outbound_clicks_creator_created_idx
  on public.social_discovery_outbound_clicks(creator_id, created_at desc);

alter table public.social_discovery_search_events enable row level security;
alter table public.social_discovery_search_impressions enable row level security;
alter table public.social_discovery_outbound_clicks enable row level security;

revoke all on public.social_discovery_search_events from anon, authenticated;
revoke all on public.social_discovery_search_impressions from anon, authenticated;
revoke all on public.social_discovery_outbound_clicks from anon, authenticated;

create or replace function public.search_social_discovery_posts_v24_72c(
  _query text default null,
  _limit integer default 40
)
returns table (
  id uuid,
  creator_id uuid,
  platform text,
  original_url text,
  title text,
  description text,
  keywords text[],
  content_type text,
  focus_code text,
  related_vybe_url text,
  original_published_at timestamptz,
  discovery_order integer,
  creator_username text,
  creator_artist_name text,
  creator_display_name text,
  creator_avatar_url text,
  creator_avatar_path text,
  search_event_id uuid
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_query text := left(regexp_replace(trim(coalesce(_query, '')), '\s+', ' ', 'g'), 80);
  v_limit integer := least(greatest(coalesce(_limit, 40), 1), 60);
  v_search_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required';
  end if;

  if length(v_query) = 0 then
    return;
  end if;

  insert into public.social_discovery_search_events(actor_id, normalized_query)
  values (v_actor, v_query)
  returning social_discovery_search_events.id into v_search_id;

  return query
  with matched as materialized (
    select
      p.id,
      p.creator_id,
      p.platform,
      p.original_url,
      p.title,
      p.description,
      p.keywords,
      p.content_type,
      p.focus_code,
      p.related_vybe_url,
      p.original_published_at,
      p.discovery_order,
      cp.username as creator_username,
      cp.artist_name as creator_artist_name,
      cp.display_name as creator_display_name,
      cp.avatar_url as creator_avatar_url,
      cp.avatar_path as creator_avatar_path,
      row_number() over (
        order by p.discovery_order asc, p.original_published_at desc nulls last, p.created_at desc
      )::integer as result_position
    from public.creator_social_posts p
    join public.creator_profiles cp on cp.user_id = p.creator_id
    where p.is_active = true
      and cp.username is not null
      and length(trim(cp.username)) > 0
      and public.social_discovery_is_entitled(p.creator_id)
      and (
        p.title ilike '%' || v_query || '%'
        or coalesce(p.description, '') ilike '%' || v_query || '%'
        or array_to_string(p.keywords, ' ') ilike '%' || v_query || '%'
        or p.platform ilike '%' || v_query || '%'
        or p.content_type ilike '%' || v_query || '%'
        or coalesce(p.focus_code, '') ilike '%' || v_query || '%'
        or coalesce(cp.username, '') ilike '%' || v_query || '%'
        or coalesce(cp.artist_name, '') ilike '%' || v_query || '%'
        or coalesce(cp.display_name, '') ilike '%' || v_query || '%'
        or coalesce(cp.genre, '') ilike '%' || v_query || '%'
        or coalesce(cp.location, '') ilike '%' || v_query || '%'
      )
    order by p.discovery_order asc, p.original_published_at desc nulls last, p.created_at desc
    limit v_limit
  ),
  event_update as (
    update public.social_discovery_search_events e
    set result_count = (select count(*)::integer from matched)
    where e.id = v_search_id
    returning e.id
  ),
  impression_insert as (
    insert into public.social_discovery_search_impressions(
      search_event_id, post_id, creator_id, result_position
    )
    select v_search_id, m.id, m.creator_id, m.result_position
    from matched m
    on conflict (search_event_id, post_id) do nothing
    returning post_id
  )
  select
    m.id,
    m.creator_id,
    m.platform,
    m.original_url,
    m.title,
    m.description,
    m.keywords,
    m.content_type,
    m.focus_code,
    m.related_vybe_url,
    m.original_published_at,
    m.discovery_order,
    m.creator_username,
    m.creator_artist_name,
    m.creator_display_name,
    m.creator_avatar_url,
    m.creator_avatar_path,
    v_search_id
  from matched m
  cross join event_update;
end;
$$;

revoke all on function public.search_social_discovery_posts_v24_72c(text, integer) from public;
grant execute on function public.search_social_discovery_posts_v24_72c(text, integer) to authenticated;
grant execute on function public.search_social_discovery_posts_v24_72c(text, integer) to service_role;

create or replace function public.record_social_discovery_outbound_click(
  _search_event_id uuid,
  _post_id uuid
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'Authentication required';
  end if;

  insert into public.social_discovery_outbound_clicks(
    search_event_id, post_id, creator_id, actor_id, platform
  )
  select
    i.search_event_id,
    i.post_id,
    i.creator_id,
    v_actor,
    p.platform
  from public.social_discovery_search_impressions i
  join public.social_discovery_search_events e on e.id = i.search_event_id
  join public.creator_social_posts p on p.id = i.post_id
  where i.search_event_id = _search_event_id
    and i.post_id = _post_id
    and e.actor_id = v_actor
  limit 1;

  return found;
end;
$$;

revoke all on function public.record_social_discovery_outbound_click(uuid, uuid) from public;
grant execute on function public.record_social_discovery_outbound_click(uuid, uuid) to authenticated;
grant execute on function public.record_social_discovery_outbound_click(uuid, uuid) to service_role;

create or replace function public.get_my_social_discovery_search_analytics(
  _days integer default 30
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select auth.uid() as creator_id, greatest(1, least(coalesce(_days, 30), 365)) as days
  ),
  impressions as (
    select i.*
    from public.social_discovery_search_impressions i, params p
    where i.creator_id = p.creator_id
      and i.created_at >= now() - make_interval(days => p.days)
  ),
  clicks as (
    select c.*
    from public.social_discovery_outbound_clicks c, params p
    where c.creator_id = p.creator_id
      and c.created_at >= now() - make_interval(days => p.days)
  ),
  searchers as (
    select count(distinct e.actor_id)::integer as total
    from impressions i
    join public.social_discovery_search_events e on e.id = i.search_event_id
  )
  select jsonb_build_object(
    'days', (select days from params),
    'searches_appeared_in', coalesce((select count(distinct search_event_id)::integer from impressions), 0),
    'result_impressions', coalesce((select count(*)::integer from impressions), 0),
    'outbound_clicks', coalesce((select count(*)::integer from clicks), 0),
    'unique_searchers', coalesce((select total from searchers), 0),
    'outbound_rate', case
      when (select count(*) from impressions) = 0 then 0
      else round(((select count(*) from clicks)::numeric / (select count(*) from impressions)::numeric) * 100, 1)
    end
  );
$$;

revoke all on function public.get_my_social_discovery_search_analytics(integer) from public;
grant execute on function public.get_my_social_discovery_search_analytics(integer) to authenticated;
grant execute on function public.get_my_social_discovery_search_analytics(integer) to service_role;

commit;
