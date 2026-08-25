-- VYBE V24.62A2 - Supporter Following + Existing Creator Update Feed
begin;

create or replace function public.get_my_followed_creators_v24_62a2()
returns table (
  creator_user_id uuid,
  creator_display_name text,
  creator_username text,
  creator_avatar_path text,
  followed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    target.subject_user_id,
    coalesce(nullif(cp.display_name, ''), nullif(target.display_name, ''), 'VYBE Creator'),
    nullif(cp.username, ''),
    cp.avatar_path,
    f.created_at
  from public.identity_follows f
  join public.account_identities supporter on supporter.id = f.follower_identity_id
  join public.account_identities target on target.id = f.target_identity_id
  left join public.creator_profiles cp on cp.user_id = target.subject_user_id
  where supporter.owner_user_id = auth.uid()
    and supporter.identity_type = 'supporter'
    and supporter.status = 'active'
    and target.identity_type = 'creator'
    and target.status = 'active'
  order by f.created_at desc
$$;

grant execute on function public.get_my_followed_creators_v24_62a2() to authenticated;

create or replace function public.get_my_supporter_creator_feed_v24_62a2(p_limit int default 50)
returns table (
  id uuid,
  notification_type text,
  entity_type text,
  entity_id uuid,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz,
  creator_user_id uuid,
  creator_display_name text,
  creator_username text,
  creator_avatar_path text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id,
    'creator_update_published'::text,
    'creator_update'::text,
    u.id,
    jsonb_build_object(
      'title', u.title,
      'kind', u.kind,
      'description', left(coalesce(u.description, ''), 300),
      'destination_url', u.destination_url,
      'cta_label', u.cta_label,
      'starts_at', u.starts_at,
      'ends_at', u.ends_at,
      'location_name', u.location_name,
      'location_address', u.location_address
    ),
    n.read_at,
    u.created_at,
    target.subject_user_id,
    coalesce(nullif(cp.display_name, ''), nullif(target.display_name, ''), 'VYBE Creator'),
    nullif(cp.username, ''),
    cp.avatar_path
  from public.identity_follows f
  join public.account_identities supporter on supporter.id = f.follower_identity_id
  join public.account_identities target on target.id = f.target_identity_id
  join public.creator_updates u on u.creator_id = target.subject_user_id and u.status = 'published'
  left join public.creator_profiles cp on cp.user_id = target.subject_user_id
  left join public.identity_notifications n
    on n.recipient_identity_id = supporter.id
   and n.actor_identity_id = target.id
   and n.notification_type = 'creator_update_published'
   and n.entity_type = 'creator_update'
   and n.entity_id = u.id
  where supporter.owner_user_id = auth.uid()
    and supporter.identity_type = 'supporter'
    and supporter.status = 'active'
    and target.identity_type = 'creator'
    and target.status = 'active'
  order by coalesce(u.starts_at, u.created_at) desc, u.created_at desc
  limit least(greatest(p_limit, 1), 100)
$$;

grant execute on function public.get_my_supporter_creator_feed_v24_62a2(int) to authenticated;

commit;
