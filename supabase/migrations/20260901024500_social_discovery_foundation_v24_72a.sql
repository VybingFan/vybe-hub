-- VYBE V24.72A - Social Discovery add-on subscription and creator post library.
-- Checkout remains disabled until Stripe Price IDs and STRIPE_SOCIAL_DISCOVERY_CHECKOUT_ENABLED are configured.

begin;

create table if not exists public.creator_social_discovery_catalog (
  add_on_code text primary key check (add_on_code = 'social_discovery'),
  public_name text not null,
  description text not null,
  monthly_price_cents integer not null check (monthly_price_cents > 0),
  annual_price_cents integer not null check (annual_price_cents > 0),
  active_post_limit integer not null check (active_post_limit > 0),
  eligible_plan_codes text[] not null,
  billing_state text not null default 'configured' check (billing_state in ('configured','active','paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.creator_social_discovery_catalog
  (add_on_code, public_name, description, monthly_price_cents, annual_price_cents, active_post_limit, eligible_plan_codes, billing_state)
values
  ('social_discovery', 'Social Discovery',
   'Makes creator-selected public social posts searchable and discoverable through VYBE.',
   800, 8000, 25,
   array['creator_free','creator_plus','creator_pro','creator_studio','founding_beta'],
   'configured')
on conflict (add_on_code) do update set
  public_name = excluded.public_name,
  description = excluded.description,
  monthly_price_cents = excluded.monthly_price_cents,
  annual_price_cents = excluded.annual_price_cents,
  active_post_limit = excluded.active_post_limit,
  eligible_plan_codes = excluded.eligible_plan_codes,
  updated_at = now();

grant select on public.creator_social_discovery_catalog to anon, authenticated;
grant all on public.creator_social_discovery_catalog to service_role;
alter table public.creator_social_discovery_catalog enable row level security;
drop policy if exists "Social Discovery catalog is publicly readable" on public.creator_social_discovery_catalog;
create policy "Social Discovery catalog is publicly readable"
  on public.creator_social_discovery_catalog for select to anon, authenticated using (true);

create table if not exists public.creator_social_discovery_subscriptions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null unique references auth.users(id) on delete cascade,
  add_on_code text not null default 'social_discovery' references public.creator_social_discovery_catalog(add_on_code) on delete restrict,
  status text not null check (status in ('active','trialing','past_due','canceled','incomplete','incomplete_expired','paused','unpaid')),
  billing_interval text check (billing_interval in ('monthly','annual')),
  billing_provider text check (billing_provider is null or billing_provider = 'stripe'),
  billing_customer_ref text,
  billing_subscription_ref text unique,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_billing_event_created bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.creator_social_discovery_subscriptions to authenticated;
grant all on public.creator_social_discovery_subscriptions to service_role;
alter table public.creator_social_discovery_subscriptions enable row level security;
drop policy if exists "Creators read own Social Discovery subscription" on public.creator_social_discovery_subscriptions;
create policy "Creators read own Social Discovery subscription"
  on public.creator_social_discovery_subscriptions for select to authenticated using (creator_id = auth.uid());
drop policy if exists "Admins read Social Discovery subscriptions" on public.creator_social_discovery_subscriptions;
create policy "Admins read Social Discovery subscriptions"
  on public.creator_social_discovery_subscriptions for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.social_discovery_is_entitled(_creator_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.creator_social_discovery_subscriptions s
    where s.creator_id = _creator_id
      and s.status in ('active','trialing','past_due')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

create or replace function public.social_discovery_active_post_limit(_creator_id uuid)
returns integer
language sql stable security definer set search_path = public
as $$
  select case when public.social_discovery_is_entitled(_creator_id)
    then coalesce((select active_post_limit from public.creator_social_discovery_catalog where add_on_code = 'social_discovery' limit 1), 25)
    else 0
  end;
$$;

create table if not exists public.creator_social_posts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram','tiktok','youtube','facebook','x','threads','other')),
  original_url text not null,
  title text not null,
  description text,
  keywords text[] not null default '{}'::text[],
  content_type text not null default 'post' check (content_type in ('post','video','reel','short','photo','article','live','other')),
  focus_code text references public.creator_focus_catalog(focus_code) on delete set null,
  related_vybe_url text,
  original_published_at timestamptz,
  is_active boolean not null default false,
  discovery_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_social_posts_url_http check (original_url ~* '^https?://'),
  constraint creator_social_posts_related_url_http check (related_vybe_url is null or related_vybe_url ~* '^https?://|^/')
);

create index if not exists creator_social_posts_creator_idx on public.creator_social_posts(creator_id, is_active, discovery_order, created_at desc);
create index if not exists creator_social_posts_active_idx on public.creator_social_posts(is_active, platform, original_published_at desc) where is_active = true;
create index if not exists creator_social_posts_keywords_gin on public.creator_social_posts using gin(keywords);

create or replace function public.enforce_social_discovery_post_activation()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  allowed_limit integer;
  active_count integer;
begin
  if new.is_active then
    if not public.social_discovery_is_entitled(new.creator_id) then
      raise exception 'An active Social Discovery subscription is required to activate posts';
    end if;
    allowed_limit := public.social_discovery_active_post_limit(new.creator_id);
    select count(*) into active_count
    from public.creator_social_posts
    where creator_id = new.creator_id and is_active = true and id <> new.id;
    if active_count >= allowed_limit then
      raise exception 'Social Discovery allows up to % active searchable posts', allowed_limit;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists creator_social_posts_activation_limit on public.creator_social_posts;
create trigger creator_social_posts_activation_limit
before insert or update on public.creator_social_posts
for each row execute function public.enforce_social_discovery_post_activation();

grant select, insert, update, delete on public.creator_social_posts to authenticated;
grant all on public.creator_social_posts to service_role;
alter table public.creator_social_posts enable row level security;

drop policy if exists "Creators read own social post library" on public.creator_social_posts;
create policy "Creators read own social post library" on public.creator_social_posts for select to authenticated using (creator_id = auth.uid());
drop policy if exists "Creators add own social posts with Social Discovery" on public.creator_social_posts;
create policy "Creators add own social posts with Social Discovery" on public.creator_social_posts for insert to authenticated
  with check (creator_id = auth.uid() and public.social_discovery_is_entitled(auth.uid()));
drop policy if exists "Creators update own social posts with Social Discovery" on public.creator_social_posts;
create policy "Creators update own social posts with Social Discovery" on public.creator_social_posts for update to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid() and public.social_discovery_is_entitled(auth.uid()));
drop policy if exists "Creators delete own social posts with Social Discovery" on public.creator_social_posts;
create policy "Creators delete own social posts with Social Discovery" on public.creator_social_posts for delete to authenticated
  using (creator_id = auth.uid() and public.social_discovery_is_entitled(auth.uid()));

create or replace function public.get_my_social_discovery_summary()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'subscription', case when s.id is null then null else jsonb_build_object(
      'id', s.id,
      'add_on_code', s.add_on_code,
      'status', s.status,
      'billing_interval', s.billing_interval,
      'billing_provider', s.billing_provider,
      'current_period_end', s.current_period_end,
      'cancel_at_period_end', s.cancel_at_period_end
    ) end,
    'entitled', public.social_discovery_is_entitled(auth.uid()),
    'active_post_limit', public.social_discovery_active_post_limit(auth.uid()),
    'active_post_count', (select count(*) from public.creator_social_posts p where p.creator_id = auth.uid() and p.is_active = true)
  )
  from (select auth.uid() as creator_id) me
  left join public.creator_social_discovery_subscriptions s on s.creator_id = me.creator_id;
$$;

revoke all on function public.social_discovery_is_entitled(uuid) from public;
grant execute on function public.social_discovery_is_entitled(uuid) to authenticated, service_role;
revoke all on function public.social_discovery_active_post_limit(uuid) from public;
grant execute on function public.social_discovery_active_post_limit(uuid) to authenticated, service_role;
revoke all on function public.get_my_social_discovery_summary() from public;
grant execute on function public.get_my_social_discovery_summary() to authenticated;

commit;
