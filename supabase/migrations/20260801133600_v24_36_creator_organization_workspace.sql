begin;
create table public.creator_organizations (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
 identity_id uuid unique references public.account_identities(id) on delete cascade,
 creator_type text not null check(creator_type in ('music_collective','independent_label','creative_organization','entertainment_company','management_company','production_company','film_studio','podcast_network','creative_agency')),
 name text not null, biography text, mission_statement text, brand_story text, logo_url text, contact_email text,
 status text not null default 'draft' check(status in ('draft','active','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.creator_organization_members (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.creator_organizations(id) on delete cascade,
 creator_user_id uuid references auth.users(id) on delete set null, name text not null, photo_url text, role text not null,
 department text, short_bio text, genres text[] not null default '{}', featured boolean not null default false,
 display_order integer not null default 0, status text not null default 'active', created_at timestamptz not null default now()
);
create table public.creator_organization_relationships (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.creator_organizations(id) on delete cascade,
 member_id uuid not null references public.creator_organization_members(id) on delete cascade,
 relationship_type text not null check(relationship_type in ('represents','managed_by','produced_by','signed_to','affiliated_with','member_of','founder','executive_team')),
 created_at timestamptz not null default now(), unique(organization_id,member_id,relationship_type)
);
alter table public.creator_organizations enable row level security; alter table public.creator_organization_members enable row level security; alter table public.creator_organization_relationships enable row level security;
create policy "organization owner manage" on public.creator_organizations for all using(owner_user_id=auth.uid()) with check(owner_user_id=auth.uid());
create policy "active organizations public read" on public.creator_organizations for select using(status='active');
create policy "organization members owner manage" on public.creator_organization_members for all using(exists(select 1 from public.creator_organizations o where o.id=organization_id and o.owner_user_id=auth.uid())) with check(exists(select 1 from public.creator_organizations o where o.id=organization_id and o.owner_user_id=auth.uid()));
create policy "active organization members public" on public.creator_organization_members for select using(exists(select 1 from public.creator_organizations o where o.id=organization_id and o.status='active'));
create policy "organization relationships owner manage" on public.creator_organization_relationships for all using(exists(select 1 from public.creator_organizations o where o.id=organization_id and o.owner_user_id=auth.uid())) with check(exists(select 1 from public.creator_organizations o where o.id=organization_id and o.owner_user_id=auth.uid()));
create policy "active organization relationships public" on public.creator_organization_relationships for select using(exists(select 1 from public.creator_organizations o where o.id=organization_id and o.status='active'));
commit;

