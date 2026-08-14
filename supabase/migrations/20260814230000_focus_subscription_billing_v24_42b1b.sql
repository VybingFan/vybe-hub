-- VYBE V24.42B1B - Stripe-ready creator focus add-on billing.
-- Checkout remains disabled until server Price IDs, webhook secret, and the
-- STRIPE_FOCUS_CHECKOUT_ENABLED flag are configured.

begin;

create table public.creator_focus_add_on_catalog (
  add_on_code text primary key
    check (add_on_code in ('second_focus', 'pro_multi_focus', 'studio_multi_focus')),
  public_name text not null,
  description text not null,
  monthly_price_cents integer not null check (monthly_price_cents > 0),
  annual_price_cents integer not null check (annual_price_cents > 0),
  focus_capacity integer not null check (focus_capacity between 2 and 5),
  eligible_plan_codes text[] not null,
  founding_enrollment_ends_at timestamptz not null,
  billing_state text not null default 'configured'
    check (billing_state in ('configured', 'active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.creator_focus_add_on_catalog
  (add_on_code, public_name, description, monthly_price_cents, annual_price_cents,
   focus_capacity, eligible_plan_codes, founding_enrollment_ends_at)
values
  ('second_focus', 'Second Creator Focus',
   'Adds one authorized creator focus to an eligible Plus, Pro, or Studio membership.',
   800, 8000, 2, array['creator_plus','creator_pro','creator_studio'],
   '2027-02-14T23:59:59Z'),
  ('pro_multi_focus', 'Creator Pro Multi-Focus',
   'Replaces the second-focus add-on and authorizes up to five Pro-level creator focuses.',
   1500, 15000, 5, array['creator_pro'], '2027-02-14T23:59:59Z'),
  ('studio_multi_focus', 'Creator Studio Multi-Focus',
   'Replaces the second-focus add-on and authorizes up to five Studio-level creator focuses.',
   2000, 20000, 5, array['creator_studio'], '2027-02-14T23:59:59Z')
on conflict (add_on_code) do update set
  public_name = excluded.public_name,
  description = excluded.description,
  monthly_price_cents = excluded.monthly_price_cents,
  annual_price_cents = excluded.annual_price_cents,
  focus_capacity = excluded.focus_capacity,
  eligible_plan_codes = excluded.eligible_plan_codes,
  founding_enrollment_ends_at = excluded.founding_enrollment_ends_at,
  updated_at = now();

grant select on public.creator_focus_add_on_catalog to anon, authenticated;
grant all on public.creator_focus_add_on_catalog to service_role;
alter table public.creator_focus_add_on_catalog enable row level security;
create policy "Focus add-on catalog is publicly readable"
  on public.creator_focus_add_on_catalog for select to anon, authenticated using (true);

create table public.creator_focus_subscriptions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null unique references auth.users(id) on delete cascade,
  add_on_code text not null references public.creator_focus_add_on_catalog(add_on_code) on delete restrict,
  status text not null
    check (status in ('active','trialing','past_due','canceled','incomplete','incomplete_expired','paused','unpaid')),
  billing_interval text check (billing_interval in ('monthly','annual')),
  billing_provider text check (billing_provider is null or billing_provider = 'stripe'),
  billing_customer_ref text,
  billing_subscription_ref text unique,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  founding_price_enrolled_at timestamptz,
  founding_price_locked boolean not null default false,
  last_billing_event_created bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.creator_focus_subscriptions to authenticated;
grant all on public.creator_focus_subscriptions to service_role;
alter table public.creator_focus_subscriptions enable row level security;
create policy "Creators read own focus subscription"
  on public.creator_focus_subscriptions for select to authenticated
  using (creator_id = auth.uid());
create policy "Admins read focus subscriptions"
  on public.creator_focus_subscriptions for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

alter table public.creator_focus_access
  add column if not exists focus_subscription_id uuid
    references public.creator_focus_subscriptions(id) on delete set null;

create or replace function public.creator_focus_eligibility_limit(_creator_id uuid)
returns integer
language sql stable security definer set search_path = public
as $$
  select case public.active_creator_plan(_creator_id)
    when 'creator_plus' then 2
    when 'creator_pro' then 5
    when 'creator_studio' then 5
    when 'founding_beta' then 5
    else 1
  end;
$$;

create or replace function public.creator_focus_limit(_creator_id uuid)
returns integer
language sql stable security definer set search_path = public
as $$
  select case
    when public.active_creator_plan(_creator_id) = 'founding_beta' then 5
    else coalesce((
      select c.focus_capacity
      from public.creator_focus_subscriptions s
      join public.creator_focus_add_on_catalog c using (add_on_code)
      where s.creator_id = _creator_id
        and s.status in ('active','trialing','past_due')
        and (s.current_period_end is null or s.current_period_end > now())
      limit 1
    ), 1)
  end;
$$;

create or replace function public.get_my_creator_focus_subscription()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'subscription', case when s.id is null then null else jsonb_build_object(
      'id', s.id, 'add_on_code', s.add_on_code, 'status', s.status,
      'billing_interval', s.billing_interval, 'current_period_end', s.current_period_end,
      'cancel_at_period_end', s.cancel_at_period_end,
      'founding_price_enrolled_at', s.founding_price_enrolled_at,
      'founding_price_locked', s.founding_price_locked
    ) end,
    'focus_capacity', public.creator_focus_limit(auth.uid()),
    'eligibility_limit', public.creator_focus_eligibility_limit(auth.uid())
  )
  from (select auth.uid() as creator_id) me
  left join public.creator_focus_subscriptions s on s.creator_id = me.creator_id;
$$;

-- Admin grants remain available for founding tests, but may not exceed what
-- the creator's base plan is eligible to support.
create or replace function public.admin_set_creator_focus_access(
  _creator_id uuid, _focus_code text, _enabled boolean
) returns void
language plpgsql security definer set search_path = public
as $$
declare active_count integer; has_primary boolean;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admin access required'; end if;
  if not exists (select 1 from public.creator_focus_catalog where focus_code = _focus_code) then
    raise exception 'Unknown creator focus';
  end if;
  if _enabled then
    select count(*) into active_count from public.creator_focus_access
    where creator_id = _creator_id and status in ('active','grace')
      and (ends_at is null or ends_at > now());
    if not exists (select 1 from public.creator_focus_access where creator_id=_creator_id
      and focus_code=_focus_code and status in ('active','grace'))
      and active_count >= public.creator_focus_eligibility_limit(_creator_id) then
      raise exception 'This membership is not eligible for another creator focus';
    end if;
    select exists (select 1 from public.creator_focus_access where creator_id=_creator_id
      and access_kind='primary' and status in ('active','grace')) into has_primary;
    insert into public.creator_focus_access
      (creator_id,focus_code,access_kind,status,source,ends_at)
    values (_creator_id,_focus_code,case when has_primary then 'additional' else 'primary' end,
      'active','admin',null)
    on conflict (creator_id,focus_code) do update set
      access_kind=case when has_primary then 'additional' else 'primary' end,
      status='active',source='admin',ends_at=null,updated_at=now();
  else
    if exists (select 1 from public.creator_focus_access where creator_id=_creator_id
      and focus_code=_focus_code and access_kind='primary' and status in ('active','grace')) then
      raise exception 'Choose another authorized primary focus before removing this one';
    end if;
    update public.creator_focus_access set status='inactive',ends_at=coalesce(ends_at,now()),updated_at=now()
    where creator_id=_creator_id and focus_code=_focus_code;
  end if;
end;
$$;

revoke all on function public.creator_focus_eligibility_limit(uuid) from public;
grant execute on function public.creator_focus_eligibility_limit(uuid) to authenticated, service_role;
revoke all on function public.creator_focus_limit(uuid) from public;
grant execute on function public.creator_focus_limit(uuid) to authenticated, service_role;
revoke all on function public.get_my_creator_focus_subscription() from public;
grant execute on function public.get_my_creator_focus_subscription() to authenticated;

commit;
