begin;

alter type public.app_role add value if not exists 'partner';

alter table public.account_identities
  drop constraint if exists account_identities_identity_type_check;
alter table public.account_identities
  add constraint account_identities_identity_type_check
  check (identity_type in ('supporter','creator','business','partner'));

create table if not exists public.partner_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  partner_type text not null check (partner_type in ('individual','creator','business','organization','other')),
  organization_name text,
  headline text,
  description text,
  website_url text,
  contact_email text not null,
  service_area text,
  opportunity_types text[] not null default '{}',
  creator_interests text[] not null default '{}',
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','suspended')),
  founding_partner boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists partner_profiles_status_idx on public.partner_profiles(verification_status, founding_partner);

create table if not exists public.partner_saved_creators (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partner_profiles(id) on delete cascade,
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  list_name text not null default 'Saved creators',
  notes text,
  created_at timestamptz not null default now(),
  unique(partner_id, creator_user_id)
);
create index if not exists partner_saved_creators_partner_idx on public.partner_saved_creators(partner_id, created_at desc);

create table if not exists public.partner_opportunities (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partner_profiles(id) on delete cascade,
  title text not null,
  summary text not null,
  opportunity_type text not null,
  location text,
  compensation_type text not null default 'tbd' check (compensation_type in ('paid','unpaid','exposure','in_kind','revenue_share','negotiable','tbd')),
  compensation_details text,
  eligibility text,
  requirements text,
  visibility text not null default 'private' check (visibility in ('public','private','hybrid')),
  status text not null default 'draft' check (status in ('draft','submitted','approved','published','paused','closed','archived')),
  deadline timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists partner_opportunities_partner_idx on public.partner_opportunities(partner_id, status, created_at desc);

create table if not exists public.partner_opportunity_invites (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.partner_opportunities(id) on delete cascade,
  partner_id uuid not null references public.partner_profiles(id) on delete cascade,
  creator_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'invited' check (status in ('invited','viewed','interested','submitted','shortlisted','selected','declined','completed','archived')),
  message text,
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(opportunity_id, creator_user_id)
);
create index if not exists partner_invites_creator_idx on public.partner_opportunity_invites(creator_user_id, status, invited_at desc);
create index if not exists partner_invites_partner_idx on public.partner_opportunity_invites(partner_id, status, invited_at desc);
alter table public.partner_opportunities add constraint partner_opportunities_id_partner_unique unique(id,partner_id);
alter table public.partner_opportunity_invites add constraint partner_invites_opportunity_partner_fkey foreign key(opportunity_id,partner_id) references public.partner_opportunities(id,partner_id) on delete cascade;

alter table public.partner_profiles enable row level security;
alter table public.partner_saved_creators enable row level security;
alter table public.partner_opportunities enable row level security;
alter table public.partner_opportunity_invites enable row level security;

grant select, insert on public.partner_profiles to authenticated;
grant update(display_name,slug,partner_type,organization_name,headline,description,website_url,contact_email,service_area,opportunity_types,creator_interests,updated_at) on public.partner_profiles to authenticated;
grant select, insert, update, delete on public.partner_saved_creators to authenticated;
grant select, insert, update, delete on public.partner_opportunities to authenticated;
grant select, insert, update, delete on public.partner_opportunity_invites to authenticated;
grant all on public.partner_profiles, public.partner_saved_creators, public.partner_opportunities, public.partner_opportunity_invites to service_role;
create policy "Partners read own profile" on public.partner_profiles for select to authenticated
  using ((select auth.uid()) = owner_user_id or public.has_role((select auth.uid()), 'admin'));
create policy "Partners apply for own profile" on public.partner_profiles for insert to authenticated
  with check ((select auth.uid()) = owner_user_id);
create policy "Partners update own profile" on public.partner_profiles for update to authenticated
  using ((select auth.uid()) = owner_user_id or public.has_role((select auth.uid()), 'admin'))
  with check ((select auth.uid()) = owner_user_id or public.has_role((select auth.uid()), 'admin'));

create policy "Partners manage saved creators" on public.partner_saved_creators for all to authenticated
  using (partner_id in (select id from public.partner_profiles where owner_user_id = (select auth.uid())) or public.has_role((select auth.uid()), 'admin'))
  with check (partner_id in (select id from public.partner_profiles where owner_user_id = (select auth.uid())) or public.has_role((select auth.uid()), 'admin'));

create policy "Partners read own opportunities" on public.partner_opportunities for select to authenticated
  using (partner_id in (select id from public.partner_profiles where owner_user_id = (select auth.uid())) or public.has_role((select auth.uid()), 'admin'));
create policy "Partners create opportunity drafts" on public.partner_opportunities for insert to authenticated
  with check ((partner_id in (select id from public.partner_profiles where owner_user_id = (select auth.uid())) and status='draft') or public.has_role((select auth.uid()), 'admin'));
create policy "Partners update opportunity drafts" on public.partner_opportunities for update to authenticated
  using (partner_id in (select id from public.partner_profiles where owner_user_id = (select auth.uid())) or public.has_role((select auth.uid()), 'admin'))
  with check ((partner_id in (select id from public.partner_profiles where owner_user_id = (select auth.uid())) and status in ('draft','submitted')) or public.has_role((select auth.uid()), 'admin'));
create policy "Partners delete opportunity drafts" on public.partner_opportunities for delete to authenticated
  using ((partner_id in (select id from public.partner_profiles where owner_user_id = (select auth.uid())) and status='draft') or public.has_role((select auth.uid()), 'admin'));

create policy "Partners read own invites and creators read theirs" on public.partner_opportunity_invites for select to authenticated
  using (creator_user_id = (select auth.uid()) or partner_id in (select id from public.partner_profiles where owner_user_id = (select auth.uid())) or public.has_role((select auth.uid()), 'admin'));
create policy "Partners manage opportunity invites" on public.partner_opportunity_invites for insert to authenticated
  with check (partner_id in (select id from public.partner_profiles where owner_user_id = (select auth.uid())) or public.has_role((select auth.uid()), 'admin'));
create policy "Partners update opportunity invites" on public.partner_opportunity_invites for update to authenticated
  using (partner_id in (select id from public.partner_profiles where owner_user_id = (select auth.uid())) or public.has_role((select auth.uid()), 'admin'))
  with check (partner_id in (select id from public.partner_profiles where owner_user_id = (select auth.uid())) or public.has_role((select auth.uid()), 'admin'));
create policy "Partners delete opportunity invites" on public.partner_opportunity_invites for delete to authenticated
  using (partner_id in (select id from public.partner_profiles where owner_user_id = (select auth.uid())) or public.has_role((select auth.uid()), 'admin'));

create or replace function public.ensure_my_identities()
returns setof public.account_identities
language plpgsql security definer set search_path=public as $$
declare v_user auth.users%rowtype; v_name text; v_role text; v_verified boolean;
begin
  select * into v_user from auth.users where id=(select auth.uid());
  if v_user.id is null then raise exception 'Authentication required'; end if;
  v_name:=coalesce(nullif(v_user.raw_user_meta_data->>'display_name',''),split_part(v_user.email,'@',1),'VYBE member');
  insert into public.account_identities(owner_user_id,identity_type,display_name,subject_user_id)
  values(v_user.id,'supporter',v_name,v_user.id)
  on conflict(owner_user_id,identity_type,subject_user_id) do nothing;
  for v_role in select role::text from public.user_roles where user_id=v_user.id and role::text in ('creator','business','partner') loop
    v_verified := case
      when v_role='creator' then true
      when v_role='business' then exists(select 1 from public.business_profiles where owner_user_id=v_user.id and verification_status='verified')
      when v_role='partner' then exists(select 1 from public.partner_profiles where owner_user_id=v_user.id and verification_status='verified')
      else false end;
    insert into public.account_identities(owner_user_id,identity_type,display_name,subject_user_id,verified)
    values(v_user.id,v_role,v_name,v_user.id,v_verified)
    on conflict(owner_user_id,identity_type,subject_user_id)
    do update set display_name=excluded.display_name,verified=excluded.verified,updated_at=now();
  end loop;
  return query select * from public.account_identities where owner_user_id=(select auth.uid()) and status='active' order by identity_type;
end $$;
revoke execute on function public.ensure_my_identities() from public, anon;
grant execute on function public.ensure_my_identities() to authenticated;

commit;