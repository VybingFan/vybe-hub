-- VYBE V24.62A - Supporter Creator Update Notifications Foundation
-- Reuses identity_follows + identity_notifications. No duplicate follow system.

begin;

create or replace function public.notify_supporters_creator_update_v24_62a()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_identity uuid;
begin
  if new.status <> 'published' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'published' then
    return new;
  end if;

  select i.id
  into actor_identity
  from public.account_identities i
  where i.identity_type = 'creator'
    and i.subject_user_id = new.creator_id
    and i.status = 'active'
  order by i.created_at asc
  limit 1;

  if actor_identity is null then
    return new;
  end if;

  insert into public.identity_notifications(
    recipient_identity_id,
    actor_identity_id,
    notification_type,
    entity_type,
    entity_id,
    payload
  )
  select
    f.follower_identity_id,
    actor_identity,
    'creator_update_published',
    'creator_update',
    new.id,
    jsonb_build_object(
      'title', new.title,
      'kind', new.kind,
      'description', left(coalesce(new.description, ''), 300),
      'destination_url', new.destination_url,
      'cta_label', new.cta_label,
      'starts_at', new.starts_at
    )
  from public.identity_follows f
  join public.account_identities supporter
    on supporter.id = f.follower_identity_id
   and supporter.identity_type = 'supporter'
   and supporter.status = 'active'
  where f.target_identity_id = actor_identity;

  return new;
end
$$;

drop trigger if exists supporter_creator_update_notification_v24_62a on public.creator_updates;
create trigger supporter_creator_update_notification_v24_62a
after insert or update of status on public.creator_updates
for each row execute function public.notify_supporters_creator_update_v24_62a();

create or replace function public.get_my_supporter_notifications(p_limit int default 50)
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
  creator_avatar_path text,
  creator_avatar_url text
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
    actor.subject_user_id as creator_user_id,
    coalesce(
      nullif(cp.display_name, ''),
      nullif(actor.display_name, ''),
      'VYBE Creator'
    ) as creator_display_name,
    nullif(cp.username, '') as creator_username,
    cp.avatar_path as creator_avatar_path,
    cp.avatar_url as creator_avatar_url
  from public.identity_notifications n
  join public.account_identities recipient
    on recipient.id = n.recipient_identity_id
  left join public.account_identities actor
    on actor.id = n.actor_identity_id
  left join public.creator_profiles cp
    on cp.user_id = actor.subject_user_id
  where recipient.owner_user_id = auth.uid()
    and recipient.identity_type = 'supporter'
    and n.notification_type = 'creator_update_published'
  order by n.created_at desc
  limit least(greatest(p_limit, 1), 100)
$$;

grant execute on function public.get_my_supporter_notifications(int) to authenticated;

create or replace function public.mark_my_supporter_notifications_read()
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
      and i.identity_type = 'supporter'
  )
    and n.notification_type = 'creator_update_published'
    and n.read_at is null
$$;

grant execute on function public.mark_my_supporter_notifications_read() to authenticated;

commit;
