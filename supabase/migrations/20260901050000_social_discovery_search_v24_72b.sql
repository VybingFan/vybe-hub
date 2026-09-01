-- VYBE V24.72B - controlled authenticated Social Discovery search surface.
-- Keeps creator_social_posts private under RLS and exposes only active, entitled discovery-safe rows.

begin;

create or replace function public.search_social_discovery_posts(
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
  creator_avatar_path text
)
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select
      nullif(trim(coalesce(_query, '')), '') as q,
      least(greatest(coalesce(_limit, 40), 1), 60) as row_limit
  )
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
    cp.avatar_path as creator_avatar_path
  from public.creator_social_posts p
  join public.creator_profiles cp
    on cp.user_id = p.creator_id
  cross join params x
  where p.is_active = true
    and cp.username is not null
    and length(trim(cp.username)) > 0
    and public.social_discovery_is_entitled(p.creator_id)
    and (
      x.q is null
      or p.title ilike '%' || x.q || '%'
      or coalesce(p.description, '') ilike '%' || x.q || '%'
      or array_to_string(p.keywords, ' ') ilike '%' || x.q || '%'
      or p.platform ilike '%' || x.q || '%'
      or p.content_type ilike '%' || x.q || '%'
      or coalesce(p.focus_code, '') ilike '%' || x.q || '%'
      or coalesce(cp.username, '') ilike '%' || x.q || '%'
      or coalesce(cp.artist_name, '') ilike '%' || x.q || '%'
      or coalesce(cp.display_name, '') ilike '%' || x.q || '%'
      or coalesce(cp.genre, '') ilike '%' || x.q || '%'
      or coalesce(cp.location, '') ilike '%' || x.q || '%'
    )
  order by
    p.discovery_order asc,
    p.original_published_at desc nulls last,
    p.created_at desc
  limit (select row_limit from params);
$$;

revoke all on function public.search_social_discovery_posts(text, integer) from public;
grant execute on function public.search_social_discovery_posts(text, integer) to authenticated;
grant execute on function public.search_social_discovery_posts(text, integer) to service_role;

commit;
