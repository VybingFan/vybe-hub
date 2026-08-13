begin;

alter table public.commerce_products
  add column if not exists rights_status text not null default 'incomplete'
    check (rights_status in ('incomplete','submitted','approved','changes_requested','rejected','suspended'));

create table if not exists public.commerce_rights_declarations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references public.commerce_products(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  owns_master_or_authorized boolean not null,
  owns_composition_or_authorized boolean not null,
  collaborators_authorized boolean not null,
  samples_cleared boolean not null,
  beat_license_allows_sale boolean not null,
  artwork_authorized boolean not null,
  no_conflicting_agreement boolean not null,
  creator_authority_confirmed boolean not null,
  contains_cover_song boolean not null default false,
  contains_third_party_material boolean not null default false,
  contributors text not null default '',
  rights_notes text not null default '',
  evidence_notes text not null default '',
  seller_agreement_version text not null,
  accepted_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  review_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commerce_rights_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.commerce_products(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('submitted','approved','changes_requested','rejected','suspended','resubmitted')),
  agreement_version text,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists commerce_rights_status_idx on public.commerce_products (rights_status, updated_at desc);
create index if not exists commerce_rights_creator_idx on public.commerce_rights_declarations (creator_id, submitted_at desc);
create index if not exists commerce_rights_events_product_idx on public.commerce_rights_events (product_id, created_at desc);

-- Listings created during the checkout-disabled foundation phase must be
-- reviewed before they can remain publicly presented as sale-ready.
update public.commerce_products
set status = 'draft'
where status = 'active' and rights_status <> 'approved';

create or replace function public.touch_commerce_rights_v24_41g2a()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists commerce_rights_touch on public.commerce_rights_declarations;
create trigger commerce_rights_touch before update on public.commerce_rights_declarations
for each row execute function public.touch_commerce_rights_v24_41g2a();

create or replace function public.guard_commerce_product_activation_v24_41g2a()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'active' and new.rights_status <> 'approved' then
    raise exception 'Rights approval is required before this product can go on sale.';
  end if;
  return new;
end $$;

drop trigger if exists commerce_product_activation_rights_guard on public.commerce_products;
create trigger commerce_product_activation_rights_guard before insert or update on public.commerce_products
for each row execute function public.guard_commerce_product_activation_v24_41g2a();

create or replace function public.submit_commerce_rights_v24_41g2a(
  _product_id uuid,
  _owns_master boolean,
  _owns_composition boolean,
  _collaborators boolean,
  _samples boolean,
  _beat_license boolean,
  _artwork boolean,
  _no_conflict boolean,
  _authority boolean,
  _cover boolean,
  _third_party boolean,
  _contributors text,
  _rights_notes text,
  _evidence_notes text,
  _agreement_version text
) returns void language plpgsql security definer set search_path = public as $$
declare owner_id uuid; next_event text;
begin
  select creator_id into owner_id from public.commerce_products where id = _product_id;
  if owner_id is null or owner_id <> auth.uid() then raise exception 'Product not found or access denied.'; end if;
  if not (_owns_master and _owns_composition and _collaborators and _samples and _beat_license and _artwork and _no_conflict and _authority) then
    raise exception 'Every required rights confirmation must be accepted.';
  end if;
  if _cover or _third_party then
    raise exception 'Covers and third-party material require a future enhanced clearance workflow and cannot be submitted in this launch phase.';
  end if;
  next_event := case when exists (select 1 from public.commerce_rights_declarations where product_id = _product_id) then 'resubmitted' else 'submitted' end;
  insert into public.commerce_rights_declarations (
    product_id, creator_id, owns_master_or_authorized, owns_composition_or_authorized,
    collaborators_authorized, samples_cleared, beat_license_allows_sale, artwork_authorized,
    no_conflicting_agreement, creator_authority_confirmed, contains_cover_song,
    contains_third_party_material, contributors, rights_notes, evidence_notes,
    seller_agreement_version, accepted_at, submitted_at, reviewed_at, reviewed_by, review_notes
  ) values (
    _product_id, owner_id, _owns_master, _owns_composition, _collaborators, _samples,
    _beat_license, _artwork, _no_conflict, _authority, _cover, _third_party,
    coalesce(_contributors,''), coalesce(_rights_notes,''), coalesce(_evidence_notes,''),
    _agreement_version, now(), now(), null, null, ''
  ) on conflict (product_id) do update set
    owns_master_or_authorized = excluded.owns_master_or_authorized,
    owns_composition_or_authorized = excluded.owns_composition_or_authorized,
    collaborators_authorized = excluded.collaborators_authorized,
    samples_cleared = excluded.samples_cleared,
    beat_license_allows_sale = excluded.beat_license_allows_sale,
    artwork_authorized = excluded.artwork_authorized,
    no_conflicting_agreement = excluded.no_conflicting_agreement,
    creator_authority_confirmed = excluded.creator_authority_confirmed,
    contains_cover_song = excluded.contains_cover_song,
    contains_third_party_material = excluded.contains_third_party_material,
    contributors = excluded.contributors,
    rights_notes = excluded.rights_notes,
    evidence_notes = excluded.evidence_notes,
    seller_agreement_version = excluded.seller_agreement_version,
    accepted_at = now(), submitted_at = now(), reviewed_at = null, reviewed_by = null, review_notes = '';
  update public.commerce_products set rights_status = 'submitted' where id = _product_id;
  insert into public.commerce_rights_events(product_id,actor_id,event_type,agreement_version)
  values (_product_id,auth.uid(),next_event,_agreement_version);
end $$;

create or replace function public.review_commerce_rights_v24_41g2a(_product_id uuid, _decision text, _notes text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admin access required.'; end if;
  if _decision not in ('approved','changes_requested','rejected','suspended') then raise exception 'Invalid review decision.'; end if;
  update public.commerce_products
    set rights_status = _decision,
        status = case when _decision in ('rejected','suspended') then 'retired' else status end
    where id = _product_id;
  if not found then raise exception 'Product not found.'; end if;
  update public.commerce_rights_declarations
    set reviewed_at = now(), reviewed_by = auth.uid(), review_notes = coalesce(_notes,'')
    where product_id = _product_id;
  insert into public.commerce_rights_events(product_id,actor_id,event_type,notes)
  values (_product_id,auth.uid(),_decision,coalesce(_notes,''));
end $$;

alter table public.commerce_rights_declarations enable row level security;
alter table public.commerce_rights_events enable row level security;

drop policy if exists commerce_products_admin_read on public.commerce_products;
create policy commerce_products_admin_read on public.commerce_products for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists commerce_rights_owner_read on public.commerce_rights_declarations;
create policy commerce_rights_owner_read on public.commerce_rights_declarations for select to authenticated
using (creator_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
drop policy if exists commerce_rights_events_read on public.commerce_rights_events;
create policy commerce_rights_events_read on public.commerce_rights_events for select to authenticated
using (public.has_role(auth.uid(), 'admin') or exists (select 1 from public.commerce_products p where p.id = product_id and p.creator_id = auth.uid()));

grant select on public.commerce_rights_declarations, public.commerce_rights_events to authenticated;
grant execute on function public.submit_commerce_rights_v24_41g2a(uuid,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,text,text,text,text) to authenticated;
grant execute on function public.review_commerce_rights_v24_41g2a(uuid,text,text) to authenticated;

commit;
