-- VYBE V24.72C R1 - measured-search RPC repair.
-- Follow-up migration for the already-applied V24.72C foundation.
-- Do not edit or rerun 20260901063000_social_discovery_usage_analytics_v24_72c.sql.

begin;

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

  insert into public.social_discovery_search_events (
    actor_id,
    normalized_query,
    result_count
  )
  values (
    v_actor,
    v_query,
    0
  )
  returning social_discovery_search_events.id
  into v_search_id;

  insert into public.social_discovery_search_impressions (
    search_event_id,
    post_id,
    creator_id,
    result_position
  )
  select
    v_search_id,
    matched.id,
    matched.creator_id,
    matched.result_position
  from (
    select
      p.id,
      p.creator_id,
      row_number() over (
        order by
          p.discovery_order asc,
          p.original_published_at desc nulls last,
          p.created_at desc
      )::integer as result_position
    from public.creator_social_posts p
    join public.creator_profiles cp
      on cp.user_id = p.creator_id
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
    order by
      p.discovery_order asc,
      p.original_published_at desc nulls last,
      p.created_at desc
    limit v_limit
  ) matched;

  update public.social_discovery_search_events e
  set result_count = (
    select count(*)::integer
    from public.social_discovery_search_impressions i
    where i.search_event_id = v_search_id
  )
  where e.id = v_search_id;

  return query
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
    cp.username,
    cp.artist_name,
    cp.display_name,
    cp.avatar_url,
    cp.avatar_path,
    v_search_id
  from public.social_discovery_search_impressions i
  join public.creator_social_posts p
    on p.id = i.post_id
  join public.creator_profiles cp
    on cp.user_id = p.creator_id
  where i.search_event_id = v_search_id
  order by i.result_position;
end;
$$;

revoke all on function public.search_social_discovery_posts_v24_72c(text, integer) from public;
grant execute on function public.search_social_discovery_posts_v24_72c(text, integer) to authenticated;
grant execute on function public.search_social_discovery_posts_v24_72c(text, integer) to service_role;

commit;
