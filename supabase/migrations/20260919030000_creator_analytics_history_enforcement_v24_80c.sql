-- VYBE V24.80C - enforce creator analytics history by membership at the database layer.
-- The client already requests the plan-appropriate period; this prevents direct RPC
-- callers from requesting more history than their membership allows. Founding and
-- Studio all-history behavior remains bounded to the platform maximum of 3650 days.

begin;

create or replace function public.creator_analytics_request_days_v24_80c(
  p_user_id uuid,
  p_requested_days integer
)
returns integer
language sql
stable
security definer
set search_path=public
as $$
  select least(
    greatest(coalesce(p_requested_days, 1), 1),
    coalesce((
      select analytics_history_days
      from public.creator_plan_definitions
      where plan_code = public.creator_effective_plan(p_user_id)
      limit 1
    ), 3650),
    3650
  );
$$;

revoke all on function public.creator_analytics_request_days_v24_80c(uuid, integer) from public, anon;
grant execute on function public.creator_analytics_request_days_v24_80c(uuid, integer) to authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_my_creator_playlist_insights(p_days integer DEFAULT 365)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH eligible AS (
    SELECT pa.*
    FROM public.playlist_activity pa
    WHERE pa.creator_id = auth.uid()
      AND pa.created_at >= now() - make_interval(days => public.creator_analytics_request_days_v24_80c(auth.uid(), COALESCE(p_days, 365)))
  ), by_playlist AS (
    SELECT
      p.id AS playlist_id,
      p.title,
      count(*) FILTER (WHERE e.event_type = 'link_opened')::integer AS opens,
      count(*) FILTER (WHERE e.event_type = 'playback_started')::integer AS plays,
      count(DISTINCT e.session_id)::integer AS unique_visitors
    FROM eligible e
    JOIN public.playlists p ON p.id = e.playlist_id
    GROUP BY p.id, p.title
  )
  SELECT jsonb_build_object(
    'opens', COALESCE((SELECT count(*) FROM eligible WHERE event_type = 'link_opened'), 0),
    'plays', COALESCE((SELECT count(*) FROM eligible WHERE event_type = 'playback_started'), 0),
    'unique_visitors', COALESCE((SELECT count(DISTINCT session_id) FROM eligible), 0),
    'playlists', COALESCE((SELECT jsonb_agg(to_jsonb(bp) ORDER BY bp.opens DESC, bp.plays DESC, bp.title) FROM by_playlist bp), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.get_my_creator_playlist_insights(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_creator_playlist_insights(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_creator_retention_insights(p_days integer DEFAULT 365)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH eligible AS (
    SELECT s.*
    FROM public.creator_playback_sessions s
    WHERE s.creator_id = auth.uid()
      AND NOT s.is_creator_self_play
      AND s.started_at >= now() - make_interval(days => public.creator_analytics_request_days_v24_80c(auth.uid(), COALESCE(p_days, 365)))
  ), listener_repeats AS (
    SELECT listener_session_id
    FROM eligible
    WHERE qualified_at IS NOT NULL
    GROUP BY listener_session_id
    HAVING count(*) >= 2
  ), track_listener_repeats AS (
    SELECT track_id, listener_session_id
    FROM eligible
    WHERE qualified_at IS NOT NULL
    GROUP BY track_id, listener_session_id
    HAVING count(*) >= 2
  ), by_track AS (
    SELECT
      t.id AS track_id,
      t.title,
      count(e.id)::integer AS starts,
      count(e.id) FILTER (WHERE e.qualified_at IS NOT NULL)::integer AS qualified_plays,
      count(DISTINCT e.listener_session_id) FILTER (WHERE e.qualified_at IS NOT NULL)::integer AS unique_listeners,
      COALESCE(round(sum(e.listened_sec)), 0)::integer AS listening_seconds,
      COALESCE(round(avg(e.listened_sec)), 0)::integer AS average_listening_seconds,
      count(e.id) FILTER (WHERE e.completed_at IS NOT NULL)::integer AS completions,
      CASE WHEN count(e.id) FILTER (WHERE e.qualified_at IS NOT NULL) = 0 THEN 0
        ELSE round(100.0 * count(e.id) FILTER (WHERE e.completed_at IS NOT NULL)
          / count(e.id) FILTER (WHERE e.qualified_at IS NOT NULL), 1) END AS completion_rate,
      (SELECT count(*) FROM track_listener_repeats r WHERE r.track_id = t.id)::integer AS repeat_listeners,
      count(e.id) FILTER (WHERE e.reached_25)::integer AS reached_25,
      count(e.id) FILTER (WHERE e.reached_50)::integer AS reached_50,
      count(e.id) FILTER (WHERE e.reached_75)::integer AS reached_75,
      count(e.id) FILTER (WHERE e.reached_90)::integer AS reached_90
    FROM eligible e
    JOIN public.tracks t ON t.id = e.track_id
    GROUP BY t.id, t.title
  )
  SELECT jsonb_build_object(
    'starts', count(e.id),
    'qualified_plays', count(e.id) FILTER (WHERE e.qualified_at IS NOT NULL),
    'unique_listeners', count(DISTINCT e.listener_session_id) FILTER (WHERE e.qualified_at IS NOT NULL),
    'listening_seconds', COALESCE(round(sum(e.listened_sec)), 0),
    'average_listening_seconds', COALESCE(round(avg(e.listened_sec)), 0),
    'completions', count(e.id) FILTER (WHERE e.completed_at IS NOT NULL),
    'completion_rate', CASE WHEN count(e.id) FILTER (WHERE e.qualified_at IS NOT NULL) = 0 THEN 0
      ELSE round(100.0 * count(e.id) FILTER (WHERE e.completed_at IS NOT NULL)
        / count(e.id) FILTER (WHERE e.qualified_at IS NOT NULL), 1) END,
    'repeat_listeners', (SELECT count(*) FROM listener_repeats),
    'reached_25', count(e.id) FILTER (WHERE e.reached_25),
    'reached_50', count(e.id) FILTER (WHERE e.reached_50),
    'reached_75', count(e.id) FILTER (WHERE e.reached_75),
    'reached_90', count(e.id) FILTER (WHERE e.reached_90),
    'tracks', COALESCE((SELECT jsonb_agg(to_jsonb(bt) ORDER BY bt.qualified_plays DESC, bt.listening_seconds DESC, bt.title) FROM by_track bt), '[]'::jsonb)
  )
  FROM eligible e;
$$;

REVOKE ALL ON FUNCTION public.get_my_creator_retention_insights(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_creator_retention_insights(integer) TO authenticated;

create or replace function public.get_my_creator_activity(p_days int default 90)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select now() - make_interval(days => public.creator_analytics_request_days_v24_80c(auth.uid(), p_days)) as since
  )
  select jsonb_build_object(
    'followers',
      (select count(*)
       from public.identity_follows f
       join public.account_identities target on target.id = f.target_identity_id
       cross join bounds
       where target.subject_user_id = auth.uid()
         and target.identity_type = 'creator'
         and f.created_at >= bounds.since),
    'likes',
      (select count(*)
       from public.identity_reactions r
       join public.tracks t on r.entity_type = 'track' and r.entity_id = t.id
       cross join bounds
       where r.reaction_type = 'like'
         and t.creator_id = auth.uid()
         and r.created_at >= bounds.since),
    'saves',
      (select count(*)
       from public.supporter_music_list_items item
       join public.tracks t on t.id = item.track_id
       cross join bounds
       where t.creator_id = auth.uid()
         and item.added_at >= bounds.since),
    'comments',
      (select count(*)
       from public.identity_comments c
       cross join bounds
       where c.entity_type = 'creator_profile'
         and c.entity_id = auth.uid()
         and c.status = 'visible'
         and c.created_at >= bounds.since)
  )
$$;

grant execute on function public.get_my_creator_activity(int) to authenticated;

create or replace function public.get_my_creator_engagement_details(p_days int default 90)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select now() - make_interval(days => public.creator_analytics_request_days_v24_80c(auth.uid(), p_days)) as since
  ),
  followers as (
    select
      f.id,
      f.created_at,
      actor.id as identity_id,
      coalesce(nullif(sp.display_name,''), nullif(actor.display_name,''), 'VYBE Supporter') as display_name,
      nullif(sp.username,'') as username,
      sp.avatar_path,
      sp.avatar_url
    from public.identity_follows f
    join public.account_identities target on target.id = f.target_identity_id
    join public.account_identities actor on actor.id = f.follower_identity_id
    left join public.supporter_profiles sp on sp.user_id = actor.owner_user_id
    cross join bounds
    where target.subject_user_id = auth.uid()
      and target.identity_type = 'creator'
      and f.created_at >= bounds.since
    order by f.created_at desc
  ),
  likes as (
    select
      r.id,
      r.created_at,
      actor.id as identity_id,
      coalesce(nullif(sp.display_name,''), nullif(actor.display_name,''), 'VYBE Supporter') as display_name,
      nullif(sp.username,'') as username,
      sp.avatar_path,
      sp.avatar_url,
      t.id as track_id,
      t.title as track_title
    from public.identity_reactions r
    join public.account_identities actor on actor.id = r.identity_id
    join public.tracks t on r.entity_type = 'track' and r.entity_id = t.id
    left join public.supporter_profiles sp on sp.user_id = actor.owner_user_id
    cross join bounds
    where r.reaction_type = 'like'
      and t.creator_id = auth.uid()
      and r.created_at >= bounds.since
    order by r.created_at desc
  ),
  saves as (
    select
      item.id,
      item.added_at as created_at,
      actor.id as identity_id,
      coalesce(nullif(sp.display_name,''), nullif(actor.display_name,''), 'VYBE Supporter') as display_name,
      nullif(sp.username,'') as username,
      sp.avatar_path,
      sp.avatar_url,
      t.id as track_id,
      t.title as track_title,
      l.name as list_name
    from public.supporter_music_list_items item
    join public.supporter_music_lists l on l.id = item.list_id
    join public.account_identities actor on actor.id = l.owner_identity_id
    join public.tracks t on t.id = item.track_id
    left join public.supporter_profiles sp on sp.user_id = actor.owner_user_id
    cross join bounds
    where t.creator_id = auth.uid()
      and item.added_at >= bounds.since
    order by item.added_at desc
  ),
  comments as (
    select
      c.id,
      c.created_at,
      c.identity_id,
      coalesce(nullif(sp.display_name,''), nullif(actor.display_name,''), 'VYBE Supporter') as display_name,
      nullif(sp.username,'') as username,
      sp.avatar_path,
      sp.avatar_url,
      c.body
    from public.identity_comments c
    join public.account_identities actor on actor.id = c.identity_id
    left join public.supporter_profiles sp on sp.user_id = actor.owner_user_id
    cross join bounds
    where c.entity_type = 'creator_profile'
      and c.entity_id = auth.uid()
      and c.status = 'visible'
      and c.created_at >= bounds.since
    order by c.created_at desc
  )
  select jsonb_build_object(
    'followers', coalesce((select jsonb_agg(to_jsonb(followers)) from followers), '[]'::jsonb),
    'likes', coalesce((select jsonb_agg(to_jsonb(likes)) from likes), '[]'::jsonb),
    'saves', coalesce((select jsonb_agg(to_jsonb(saves)) from saves), '[]'::jsonb),
    'comments', coalesce((select jsonb_agg(to_jsonb(comments)) from comments), '[]'::jsonb)
  )
$$;

grant execute on function public.get_my_creator_engagement_details(int) to authenticated;

commit;
