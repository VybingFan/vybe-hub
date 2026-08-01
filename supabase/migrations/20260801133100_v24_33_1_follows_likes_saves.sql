begin;
create table public.identity_follows (
  id uuid primary key default gen_random_uuid(), follower_identity_id uuid not null references public.account_identities(id) on delete cascade,
  target_identity_id uuid not null references public.account_identities(id) on delete cascade,
  created_at timestamptz not null default now(), unique(follower_identity_id,target_identity_id), check(follower_identity_id<>target_identity_id)
);
create table public.identity_reactions (
  id uuid primary key default gen_random_uuid(), identity_id uuid not null references public.account_identities(id) on delete cascade,
  reaction_type text not null check(reaction_type in ('like','save')), entity_type text not null,
  entity_id uuid not null, created_at timestamptz not null default now(), unique(identity_id,reaction_type,entity_type,entity_id)
);
alter table public.identity_follows enable row level security;
alter table public.identity_reactions enable row level security;
create policy "public follow counts" on public.identity_follows for select using(true);
create policy "supporter owns follows" on public.identity_follows for all using(exists(select 1 from public.account_identities i where i.id=follower_identity_id and i.owner_user_id=auth.uid() and i.identity_type='supporter')) with check(exists(select 1 from public.account_identities i where i.id=follower_identity_id and i.owner_user_id=auth.uid() and i.identity_type='supporter'));
create policy "public reaction counts" on public.identity_reactions for select using(true);
create policy "supporter owns reactions" on public.identity_reactions for all using(exists(select 1 from public.account_identities i where i.id=identity_id and i.owner_user_id=auth.uid() and i.identity_type='supporter')) with check(exists(select 1 from public.account_identities i where i.id=identity_id and i.owner_user_id=auth.uid() and i.identity_type='supporter'));
commit;

