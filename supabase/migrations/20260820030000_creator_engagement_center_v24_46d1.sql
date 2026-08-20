-- VYBE V24.46D1 - Creator Engagement Center
-- Supporter identity on comments, creator engagement detail RPCs, and creator notifications.

begin;

-- Public supporter avatars are intentionally viewable when the supporter has
-- chosen that image as their profile avatar.
drop policy if exists "Supporter profile images can be signed" on storage.objects;
create policy "Supporter profile images can be signed"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'avatars'
    and exists (
      select 1
      from public.supporter_profiles sp
      where sp.avatar_path = name
    )
  );

-- Public comment reader with supporter identity/profile information.
create or replace function public.get_public_creator_comments(p_creator_user_id uuid)
returns table (
  id uuid,
  body text,
  created_at timestamptz,
  identity_id uuid,
  display_name text,
  username text,
  avatar_path text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.body,
    c.created_at,
    c.identity_id,
    coalesce(nullif(sp.display_name, ''), nullif(ai.display_name, ''), 'VYBE Supporter') as display_name,
    nullif(sp.username, '') as username,
    sp.avatar_path,
    sp.avatar_url
  from public.identity_comments c
  join public.account_identities ai on ai.id = c.identity_id
  left join public.supporter_profiles sp on sp.user_id = ai.owner_user_id
  where c.entity_type = 'creator_profile'
    and c.entity_id = p_creator_user_id
    and c.status = 'visible'
  order by c.created_at asc
$$;

grant execute on function public.get_public_creator_comments(uuid) to anon, authenticated;

-- Correct creator totals so track likes and saved-list additions are attributed
-- through the creator's tracks rather than comparing a track id with auth.uid().
create or replace function public.get_my_creator_activity(p_days int default 90)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select now() - make_interval(days => least(greatest(p_days, 1), 3650)) as since
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

-- Detailed engagement lists for Creator Insights.
create or replace function public.get_my_creator_engagement_details(p_days int default 90)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select now() - make_interval(days => least(greatest(p_days, 1), 3650)) as since
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

-- Notifications: comments.
create or replace function public.notify_creator_comment_v24_46d1()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
begin
  if new.entity_type <> 'creator_profile' or new.status <> 'visible' then
    return new;
  end if;

  select id into recipient
  from public.account_identities
  where identity_type = 'creator'
    and subject_user_id = new.entity_id
    and status = 'active'
  limit 1;

  if recipient is not null and recipient <> new.identity_id then
    insert into public.identity_notifications(
      recipient_identity_id, actor_identity_id, notification_type,
      entity_type, entity_id, payload
    )
    values(
      recipient, new.identity_id, 'new_comment',
      'creator_profile', new.entity_id,
      jsonb_build_object('comment_id', new.id, 'preview', left(new.body, 160))
    );
  end if;
  return new;
end
$$;

drop trigger if exists creator_comment_notification_v24_46d1 on public.identity_comments;
create trigger creator_comment_notification_v24_46d1
after insert on public.identity_comments
for each row execute function public.notify_creator_comment_v24_46d1();

-- Notifications: track likes.
create or replace function public.notify_creator_reaction_v24_46d1()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  creator_user uuid;
  recipient uuid;
  track_name text;
begin
  if new.entity_type <> 'track' or new.reaction_type <> 'like' then
    return new;
  end if;

  select creator_id, title into creator_user, track_name
  from public.tracks
  where id = new.entity_id;

  select id into recipient
  from public.account_identities
  where identity_type = 'creator'
    and subject_user_id = creator_user
    and status = 'active'
  limit 1;

  if recipient is not null and recipient <> new.identity_id then
    insert into public.identity_notifications(
      recipient_identity_id, actor_identity_id, notification_type,
      entity_type, entity_id, payload
    )
    values(
      recipient, new.identity_id, 'track_like',
      'track', new.entity_id,
      jsonb_build_object('track_title', track_name)
    );
  end if;
  return new;
end
$$;

drop trigger if exists creator_reaction_notification_v24_46d1 on public.identity_reactions;
create trigger creator_reaction_notification_v24_46d1
after insert on public.identity_reactions
for each row execute function public.notify_creator_reaction_v24_46d1();

-- Notifications: saved songs. Saving to a supporter list is the real save action in
-- the current UI, so this is tracked independently of identity_reactions.
create or replace function public.notify_creator_save_v24_46d1()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  creator_user uuid;
  recipient uuid;
  track_name text;
  list_name text;
begin
  select l.owner_identity_id, l.name into actor, list_name
  from public.supporter_music_lists l
  where l.id = new.list_id;

  select creator_id, title into creator_user, track_name
  from public.tracks
  where id = new.track_id;

  select id into recipient
  from public.account_identities
  where identity_type = 'creator'
    and subject_user_id = creator_user
    and status = 'active'
  limit 1;

  if recipient is not null and actor is not null and recipient <> actor then
    insert into public.identity_notifications(
      recipient_identity_id, actor_identity_id, notification_type,
      entity_type, entity_id, payload
    )
    values(
      recipient, actor, 'track_save',
      'track', new.track_id,
      jsonb_build_object('track_title', track_name, 'list_name', list_name)
    );
  end if;
  return new;
end
$$;

drop trigger if exists creator_save_notification_v24_46d1 on public.supporter_music_list_items;
create trigger creator_save_notification_v24_46d1
after insert on public.supporter_music_list_items
for each row execute function public.notify_creator_save_v24_46d1();

-- Creator notification feed enriched with supporter identity.
create or replace function public.get_my_creator_notifications(p_limit int default 30)
returns table (
  id uuid,
  notification_type text,
  entity_type text,
  entity_id uuid,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz,
  actor_display_name text,
  actor_username text,
  actor_avatar_path text,
  actor_avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    n.id,
    n.notification_type,
    n.entity_type,
    n.entity_id,
    n.payload,
    n.read_at,
    n.created_at,
    coalesce(nullif(sp.display_name,''), nullif(actor.display_name,''), 'VYBE Supporter') as actor_display_name,
    nullif(sp.username,'') as actor_username,
    sp.avatar_path as actor_avatar_path,
    sp.avatar_url as actor_avatar_url
  from public.identity_notifications n
  join public.account_identities recipient on recipient.id = n.recipient_identity_id
  left join public.account_identities actor on actor.id = n.actor_identity_id
  left join public.supporter_profiles sp on sp.user_id = actor.owner_user_id
  where recipient.owner_user_id = auth.uid()
    and recipient.identity_type = 'creator'
  order by n.created_at desc
  limit least(greatest(p_limit, 1), 100)
$$;

grant execute on function public.get_my_creator_notifications(int) to authenticated;

create or replace function public.mark_my_creator_notifications_read()
returns void
language sql
security definer
set search_path = public
as $$
  update public.identity_notifications n
  set read_at = coalesce(n.read_at, now())
  where n.recipient_identity_id in (
    select i.id
    from public.account_identities i
    where i.owner_user_id = auth.uid()
      and i.identity_type = 'creator'
  )
    and n.read_at is null
$$;

grant execute on function public.mark_my_creator_notifications_read() to authenticated;

commit;
