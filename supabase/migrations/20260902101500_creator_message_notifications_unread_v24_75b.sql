-- VYBE V24.75B - Creator Message Notifications + Unread State
-- Does not change file-transfer security or storage behavior.

create or replace function public.creator_message_mark_read(p_thread_id uuid)
returns bigint
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  affected bigint;
begin
  if not exists (
    select 1
    from public.creator_message_threads t
    where t.id = p_thread_id
      and auth.uid() in (t.creator_a, t.creator_b)
  ) then
    raise exception 'Not allowed';
  end if;

  update public.creator_messages m
     set read_at = now()
   where m.thread_id = p_thread_id
     and m.sender_user_id <> auth.uid()
     and m.read_at is null;

  get diagnostics affected = row_count;
  return affected;
end
$function$;

create or replace function public.creator_message_unread_count()
returns bigint
language sql
stable
security definer
set search_path to 'public'
as $function$
  select count(*)::bigint
  from public.creator_messages m
  join public.creator_message_threads t on t.id = m.thread_id
  where auth.uid() in (t.creator_a, t.creator_b)
    and m.sender_user_id <> auth.uid()
    and m.read_at is null;
$function$;

create or replace function public.creator_message_threads_list_v2()
returns table(
  thread_id uuid,
  other_user_id uuid,
  other_name text,
  other_username text,
  other_avatar text,
  last_message_at timestamptz,
  last_preview text,
  unread_count bigint
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    t.id,
    case when t.creator_a = auth.uid() then t.creator_b else t.creator_a end,
    coalesce(cp.artist_name, 'Creator'),
    cp.username,
    cp.avatar_url,
    t.last_message_at,
    (
      select case
        when m.transfer_id is not null then 'Shared a file'
        else left(m.body, 120)
      end
      from public.creator_messages m
      where m.thread_id = t.id
      order by m.created_at desc
      limit 1
    ),
    (
      select count(*)::bigint
      from public.creator_messages um
      where um.thread_id = t.id
        and um.sender_user_id <> auth.uid()
        and um.read_at is null
    )
  from public.creator_message_threads t
  left join public.creator_profiles cp
    on cp.user_id = (
      case when t.creator_a = auth.uid() then t.creator_b else t.creator_a end
    )
  where auth.uid() in (t.creator_a, t.creator_b)
  order by coalesce(t.last_message_at, t.created_at) desc;
$function$;

create or replace function public.creator_message_unread_summary()
returns table(
  unread_count bigint,
  latest_thread_id uuid,
  latest_sender_name text,
  latest_preview text,
  latest_kind text
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with unread as (
    select
      m.id,
      m.thread_id,
      m.sender_user_id,
      m.body,
      m.transfer_id,
      m.created_at
    from public.creator_messages m
    join public.creator_message_threads t on t.id = m.thread_id
    where auth.uid() in (t.creator_a, t.creator_b)
      and m.sender_user_id <> auth.uid()
      and m.read_at is null
  ),
  latest as (
    select u.*
    from unread u
    order by u.created_at desc
    limit 1
  )
  select
    (select count(*)::bigint from unread),
    latest.thread_id,
    coalesce(cp.artist_name, 'Creator'),
    case
      when latest.transfer_id is not null then 'Sent you a file'
      else left(latest.body, 120)
    end,
    case when latest.transfer_id is not null then 'file' else 'message' end
  from (select 1) seed
  left join latest on true
  left join public.creator_profiles cp on cp.user_id = latest.sender_user_id;
$function$;

revoke all on function public.creator_message_mark_read(uuid) from public;
revoke all on function public.creator_message_unread_count() from public;
revoke all on function public.creator_message_threads_list_v2() from public;
revoke all on function public.creator_message_unread_summary() from public;

grant execute on function public.creator_message_mark_read(uuid) to authenticated;
grant execute on function public.creator_message_unread_count() to authenticated;
grant execute on function public.creator_message_threads_list_v2() to authenticated;
grant execute on function public.creator_message_unread_summary() to authenticated;
