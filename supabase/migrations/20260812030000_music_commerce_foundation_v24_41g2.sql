begin;

create table if not exists public.commerce_settings (
  id boolean primary key default true check (id),
  checkout_enabled boolean not null default false,
  minimum_checkout_cents integer not null default 300 check (minimum_checkout_cents >= 50),
  minimum_song_price_cents integer not null default 99 check (minimum_song_price_cents >= 0),
  minimum_collection_price_cents integer not null default 299 check (minimum_collection_price_cents >= 0),
  platform_fee_basis_points integer not null default 1000 check (platform_fee_basis_points between 0 and 5000),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.commerce_settings (id) values (true)
on conflict (id) do nothing;

create table if not exists public.commerce_products (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  product_type text not null check (product_type in ('song','collection','bundle')),
  track_id uuid references public.tracks(id) on delete restrict,
  source_playlist_id uuid references public.playlists(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text not null default '',
  cover_path text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  fulfillment text not null default 'stream' check (fulfillment in ('stream','download','stream_and_download')),
  preview_mode text not null default 'preview' check (preview_mode in ('none','preview','full')),
  status text not null default 'draft' check (status in ('draft','active','retired')),
  edition_number integer not null default 1 check (edition_number > 0),
  first_sold_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((product_type = 'song' and track_id is not null) or product_type <> 'song')
);

create index if not exists commerce_products_creator_idx on public.commerce_products (creator_id, status, created_at desc);
create index if not exists commerce_products_public_idx on public.commerce_products (status, created_at desc) where status = 'active';

create table if not exists public.commerce_product_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.commerce_products(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete restrict,
  position integer not null check (position > 0),
  snapshot_title text not null,
  snapshot_artist text not null default '',
  snapshot_duration_seconds integer,
  created_at timestamptz not null default now(),
  unique (product_id, position),
  unique (product_id, track_id)
);

create table if not exists public.commerce_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded','partially_refunded')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  payment_provider text,
  provider_checkout_ref text unique,
  provider_payment_ref text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commerce_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.commerce_orders(id) on delete restrict,
  product_id uuid references public.commerce_products(id) on delete set null,
  creator_id uuid not null references auth.users(id) on delete restrict,
  product_title text not null,
  product_type text not null,
  edition_number integer not null default 1,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  fulfillment text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.commerce_entitlements (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete restrict,
  order_item_id uuid not null unique references public.commerce_order_items(id) on delete restrict,
  product_id uuid references public.commerce_products(id) on delete set null,
  can_stream boolean not null default true,
  can_download boolean not null default false,
  status text not null default 'active' check (status in ('active','refunded','revoked_for_fraud')),
  granted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_commerce_updated_at_v24_41g2()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists commerce_products_touch on public.commerce_products;
create trigger commerce_products_touch before update on public.commerce_products
for each row execute function public.touch_commerce_updated_at_v24_41g2();

drop trigger if exists commerce_orders_touch on public.commerce_orders;
create trigger commerce_orders_touch before update on public.commerce_orders
for each row execute function public.touch_commerce_updated_at_v24_41g2();

create or replace function public.guard_sold_commerce_product_v24_41g2()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.first_sold_at is not null and (
    new.product_type is distinct from old.product_type or
    new.track_id is distinct from old.track_id or
    new.source_playlist_id is distinct from old.source_playlist_id or
    new.edition_number is distinct from old.edition_number
  ) then
    raise exception 'A sold product edition cannot change its source content. Create a new edition.';
  end if;
  if old.first_sold_at is not null and new.status = 'draft' then
    raise exception 'A sold product may be active or retired, but cannot return to draft.';
  end if;
  return new;
end $$;

drop trigger if exists commerce_products_sold_guard on public.commerce_products;
create trigger commerce_products_sold_guard before update on public.commerce_products
for each row execute function public.guard_sold_commerce_product_v24_41g2();

create or replace function public.guard_sold_commerce_items_v24_41g2()
returns trigger language plpgsql set search_path = public as $$
declare sold_at timestamptz; target_product_id uuid;
begin
  if tg_op = 'DELETE' then target_product_id = old.product_id; else target_product_id = new.product_id; end if;
  select first_sold_at into sold_at from public.commerce_products where id = target_product_id;
  if sold_at is not null then
    raise exception 'Songs and order are locked after the first sale. Create a new edition.';
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;

drop trigger if exists commerce_items_sold_guard on public.commerce_product_items;
create trigger commerce_items_sold_guard before insert or update or delete on public.commerce_product_items
for each row execute function public.guard_sold_commerce_items_v24_41g2();

alter table public.commerce_settings enable row level security;
alter table public.commerce_products enable row level security;
alter table public.commerce_product_items enable row level security;
alter table public.commerce_orders enable row level security;
alter table public.commerce_order_items enable row level security;
alter table public.commerce_entitlements enable row level security;

drop policy if exists commerce_settings_authenticated_read on public.commerce_settings;
create policy commerce_settings_authenticated_read on public.commerce_settings for select to anon, authenticated using (true);
drop policy if exists commerce_settings_admin_manage on public.commerce_settings;
create policy commerce_settings_admin_manage on public.commerce_settings for all to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists commerce_products_public_read on public.commerce_products;
create policy commerce_products_public_read on public.commerce_products for select to anon, authenticated using (status = 'active' or creator_id = auth.uid());
drop policy if exists commerce_products_creator_insert on public.commerce_products;
create policy commerce_products_creator_insert on public.commerce_products for insert to authenticated with check (creator_id = auth.uid());
drop policy if exists commerce_products_creator_update on public.commerce_products;
create policy commerce_products_creator_update on public.commerce_products for update to authenticated using (creator_id = auth.uid()) with check (creator_id = auth.uid());
drop policy if exists commerce_products_creator_delete on public.commerce_products;
create policy commerce_products_creator_delete on public.commerce_products for delete to authenticated using (creator_id = auth.uid() and first_sold_at is null);

drop policy if exists commerce_items_read on public.commerce_product_items;
create policy commerce_items_read on public.commerce_product_items for select to anon, authenticated using (
  exists (select 1 from public.commerce_products p where p.id = product_id and (p.status = 'active' or p.creator_id = auth.uid()))
);
drop policy if exists commerce_items_creator_manage on public.commerce_product_items;
create policy commerce_items_creator_manage on public.commerce_product_items for all to authenticated
using (exists (select 1 from public.commerce_products p where p.id = product_id and p.creator_id = auth.uid()))
with check (exists (select 1 from public.commerce_products p where p.id = product_id and p.creator_id = auth.uid()));

drop policy if exists commerce_orders_buyer_read on public.commerce_orders;
create policy commerce_orders_buyer_read on public.commerce_orders for select to authenticated using (buyer_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
drop policy if exists commerce_order_items_participant_read on public.commerce_order_items;
create policy commerce_order_items_participant_read on public.commerce_order_items for select to authenticated using (
  creator_id = auth.uid() or exists (select 1 from public.commerce_orders o where o.id = order_id and o.buyer_id = auth.uid()) or public.has_role(auth.uid(), 'admin')
);
drop policy if exists commerce_entitlements_buyer_read on public.commerce_entitlements;
create policy commerce_entitlements_buyer_read on public.commerce_entitlements for select to authenticated using (buyer_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

grant select on public.commerce_settings to anon, authenticated;
grant select on public.commerce_products, public.commerce_product_items to anon, authenticated;
grant insert, update, delete on public.commerce_products, public.commerce_product_items to authenticated;
grant select on public.commerce_orders, public.commerce_order_items, public.commerce_entitlements to authenticated;

commit;
