-- VYBE V24.42B1C - creator focus workspace experience.
-- Adds safe self-service workspace activation/removal and exposes eligibility
-- alongside paid capacity. Billing remains controlled by V24.42B1B.

begin;

create or replace function public.get_my_creator_focus_access()
returns jsonb
language sql stable security definer set search_path = public
as $$
  with active_access as (
    select a.focus_code, a.access_kind, a.status, a.source, a.starts_at, a.ends_at,
           c.public_name, c.description, c.launch_state, c.sort_order
    from public.creator_focus_access a
    join public.creator_focus_catalog c using (focus_code)
    where a.creator_id = auth.uid() and a.status in ('active','grace')
      and (a.ends_at is null or a.ends_at > now())
  )
  select jsonb_build_object(
    'primary_focus', coalesce((select focus_code from active_access where access_kind='primary' limit 1),'music'),
    'focus_limit', public.creator_focus_limit(auth.uid()),
    'eligibility_limit', public.creator_focus_eligibility_limit(auth.uid()),
    'active_focus_count', (select count(*) from active_access),
    'can_add_second_focus', public.active_creator_plan(auth.uid()) in ('creator_plus','creator_pro','creator_studio','founding_beta'),
    'can_use_multi_focus', public.active_creator_plan(auth.uid()) in ('creator_pro','creator_studio','founding_beta'),
    'access', coalesce((select jsonb_agg(to_jsonb(active_access) order by
      case when access_kind='primary' then 0 else 1 end, sort_order) from active_access),'[]'::jsonb)
  );
$$;

create or replace function public.add_my_creator_focus(_focus_code text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  active_count integer;
  focus_state text;
  subscription_id uuid;
  access_source text;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select launch_state into focus_state from public.creator_focus_catalog where focus_code=_focus_code;
  if focus_state is null then raise exception 'Unknown creator focus'; end if;
  if focus_state not in ('available','foundation') then raise exception 'This creator workspace is still planned'; end if;

  if exists (select 1 from public.creator_focus_access where creator_id=auth.uid()
    and focus_code=_focus_code and status in ('active','grace') and (ends_at is null or ends_at>now())) then
    return;
  end if;

  select count(*) into active_count from public.creator_focus_access where creator_id=auth.uid()
    and status in ('active','grace') and (ends_at is null or ends_at>now());
  if active_count >= public.creator_focus_limit(auth.uid()) then
    raise exception 'Your current focus subscription does not include another workspace';
  end if;

  select id into subscription_id from public.creator_focus_subscriptions
  where creator_id=auth.uid() and status in ('active','trialing','past_due')
    and (current_period_end is null or current_period_end>now()) limit 1;
  access_source := case when public.active_creator_plan(auth.uid())='founding_beta' then 'founding' else 'subscription' end;

  insert into public.creator_focus_access
    (creator_id,focus_code,access_kind,status,source,ends_at,focus_subscription_id)
  values (auth.uid(),_focus_code,case when active_count=0 then 'primary' else 'additional' end,
    'active',access_source,null,subscription_id)
  on conflict (creator_id,focus_code) do update set
    access_kind=case when active_count=0 then 'primary' else 'additional' end,
    status='active',source=access_source,ends_at=null,focus_subscription_id=subscription_id,updated_at=now();
end;
$$;

create or replace function public.remove_my_additional_focus(_focus_code text, _confirmed boolean default false)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not coalesce(_confirmed,false) then raise exception 'Confirm the creator focus removal'; end if;
  if exists (select 1 from public.creator_focus_access where creator_id=auth.uid()
    and focus_code=_focus_code and access_kind='primary' and status in ('active','grace')) then
    raise exception 'Choose another authorized primary focus before removing this one';
  end if;
  update public.creator_focus_access set status='inactive',ends_at=coalesce(ends_at,now()),updated_at=now()
  where creator_id=auth.uid() and focus_code=_focus_code and access_kind='additional';
end;
$$;

revoke all on function public.add_my_creator_focus(text) from public;
grant execute on function public.add_my_creator_focus(text) to authenticated;
revoke all on function public.remove_my_additional_focus(text,boolean) from public;
grant execute on function public.remove_my_additional_focus(text,boolean) to authenticated;

commit;
