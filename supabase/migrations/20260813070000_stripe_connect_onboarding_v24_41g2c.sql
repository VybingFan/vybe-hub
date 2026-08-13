create table if not exists public.commerce_seller_accounts (
  creator_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'stripe' check (provider = 'stripe'),
  provider_account_id text unique,
  onboarding_status text not null default 'not_started' check (onboarding_status in ('not_started','incomplete','under_review','restricted','ready')),
  payouts_ready boolean not null default false,
  charges_ready boolean not null default false,
  requirements_due integer not null default 0,
  terms_version text,
  terms_accepted_at timestamptz,
  terms_acceptance_ip inet,
  provider_details jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.commerce_seller_accounts enable row level security;
drop policy if exists commerce_seller_accounts_owner_read on public.commerce_seller_accounts;
create policy commerce_seller_accounts_owner_read on public.commerce_seller_accounts
  for select to authenticated using (creator_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create or replace function public.guard_commerce_product_seller_readiness_v24_41g2c()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'active' and old.status is distinct from 'active' and not exists (
    select 1 from public.commerce_seller_accounts s
    where s.creator_id = new.creator_id and s.payouts_ready = true and s.onboarding_status = 'ready'
  ) then
    raise exception 'Complete Stripe seller onboarding before publishing a sales listing.';
  end if;
  return new;
end;
$$;

drop trigger if exists commerce_products_seller_readiness_guard on public.commerce_products;
create trigger commerce_products_seller_readiness_guard
before insert or update of status on public.commerce_products
for each row execute function public.guard_commerce_product_seller_readiness_v24_41g2c();

comment on table public.commerce_seller_accounts is 'VYBE seller payout readiness. Bank and identity details remain at Stripe and are never stored here.';
