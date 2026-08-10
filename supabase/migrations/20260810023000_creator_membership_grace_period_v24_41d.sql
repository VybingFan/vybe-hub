begin;

create table if not exists public.creator_membership_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  previous_plan_code text not null,
  target_plan_code text not null,
  reason text not null default 'membership_downgrade',
  status text not null default 'active' check (status in ('active','restored','expired')),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  restored_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists creator_membership_adjustments_one_active
  on public.creator_membership_adjustments(user_id) where status='active';
create index if not exists creator_membership_adjustments_user_history
  on public.creator_membership_adjustments(user_id, created_at desc);

alter table public.creator_membership_adjustments enable row level security;
drop policy if exists creator_membership_adjustments_owner_read on public.creator_membership_adjustments;
create policy creator_membership_adjustments_owner_read
  on public.creator_membership_adjustments for select to authenticated
  using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.creator_plan_rank(p_plan text)
returns integer language sql immutable as $$
  select case p_plan
    when 'creator_studio' then 4
    when 'creator_pro' then 3
    when 'founding_beta' then 3
    when 'creator_plus' then 2
    else 1
  end;
$$;

create or replace function public.manage_creator_membership_adjustment()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_previous text:=coalesce(old.plan_code,'creator_free');
  v_target text:=coalesce(new.plan_code,'creator_free');
  v_lost_paid_access boolean:=old.status in ('active','trialing') and new.status not in ('active','trialing');
  v_downgrade boolean:=public.creator_plan_rank(v_target)<public.creator_plan_rank(v_previous);
begin
  update public.creator_membership_adjustments
     set status='expired',updated_at=now()
   where user_id=new.user_id and status='active' and ends_at<=now();

  if v_lost_paid_access or v_downgrade then
    if v_lost_paid_access then v_target:='creator_free'; end if;
    insert into public.creator_membership_adjustments(
      user_id,previous_plan_code,target_plan_code,reason,ends_at
    ) values (
      new.user_id,v_previous,v_target,
      case when v_lost_paid_access then 'membership_ended' else 'membership_downgrade' end,
      now()+interval '30 days'
    )
    on conflict (user_id) where status='active' do update set
      previous_plan_code=excluded.previous_plan_code,
      target_plan_code=excluded.target_plan_code,
      reason=excluded.reason,
      started_at=now(),
      ends_at=excluded.ends_at,
      restored_at=null,
      updated_at=now();
    new.adjustment_ends_at:=now()+interval '30 days';
    new.scheduled_plan_code:=v_target;
  elsif new.status in ('active','trialing') and public.creator_plan_rank(v_target)>=public.creator_plan_rank(v_previous) then
    update public.creator_membership_adjustments
       set status='restored',restored_at=now(),updated_at=now()
     where user_id=new.user_id and status='active';
    new.adjustment_ends_at:=null;
    new.scheduled_plan_code:=null;
  end if;
  return new;
end;
$$;

drop trigger if exists creator_membership_adjustment_guard on public.account_entitlements;
create trigger creator_membership_adjustment_guard
before update of plan_code,status on public.account_entitlements
for each row execute function public.manage_creator_membership_adjustment();

create or replace function public.get_my_membership_adjustment()
returns jsonb language sql security definer set search_path=public stable as $$
  select coalesce((
    select jsonb_build_object(
      'id',a.id,
      'previous_plan_code',a.previous_plan_code,
      'target_plan_code',a.target_plan_code,
      'reason',a.reason,
      'status',case when a.status='active' and a.ends_at<=now() then 'expired' else a.status end,
      'started_at',a.started_at,
      'ends_at',a.ends_at,
      'restored_at',a.restored_at,
      'days_remaining',greatest(0,ceil(extract(epoch from (a.ends_at-now()))/86400.0))::integer,
      'automatic_deletion',false
    )
    from public.creator_membership_adjustments a
    where a.user_id=auth.uid()
    order by (a.status='active' and a.ends_at>now()) desc,a.created_at desc
    limit 1
  ),'null'::jsonb);
$$;

grant execute on function public.creator_plan_rank(text) to authenticated,service_role;
grant execute on function public.get_my_membership_adjustment() to authenticated,service_role;
grant select on public.creator_membership_adjustments to authenticated;
grant all on public.creator_membership_adjustments to service_role;

commit;
