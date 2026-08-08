begin;

create table if not exists public.account_identities (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  identity_type text not null check (identity_type in ('supporter','creator','business')),
  display_name text not null,
  avatar_url text,
  subject_user_id uuid references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','suspended','archived')),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_user_id, identity_type, subject_user_id)
);

create table if not exists public.account_identity_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_identity_id uuid references public.account_identities(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.identity_action_audit (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  identity_id uuid not null references public.account_identities(id) on delete cascade,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.account_identities enable row level security;
alter table public.account_identity_preferences enable row level security;
alter table public.identity_action_audit enable row level security;

create policy "identity owners read" on public.account_identities for select using (owner_user_id = auth.uid());
create policy "identity owners update" on public.account_identities for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "identity preferences own" on public.account_identity_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "identity audit own read" on public.identity_action_audit for select using (user_id = auth.uid());

create or replace function public.ensure_my_identities()
returns setof public.account_identities
language plpgsql security definer set search_path = public
as $$
declare
  v_user auth.users%rowtype;
  v_name text;
begin
  select * into v_user from auth.users where id = auth.uid();
  if v_user.id is null then raise exception 'Authentication required'; end if;
  v_name := coalesce(nullif(v_user.raw_user_meta_data->>'display_name',''), split_part(v_user.email,'@',1), 'VYBE Supporter');
  insert into public.account_identities(owner_user_id, identity_type, display_name, subject_user_id)
  values (v_user.id, 'supporter', v_name, v_user.id)
  on conflict (owner_user_id, identity_type, subject_user_id) do nothing;
  return query select * from public.account_identities where owner_user_id = auth.uid() and status = 'active' order by identity_type;
end $$;

create or replace function public.set_my_active_identity(p_identity_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from public.account_identities where id=p_identity_id and owner_user_id=auth.uid() and status='active') then
    raise exception 'Identity not available';
  end if;
  insert into public.account_identity_preferences(user_id,active_identity_id) values(auth.uid(),p_identity_id)
  on conflict(user_id) do update set active_identity_id=excluded.active_identity_id,updated_at=now();
end $$;

grant execute on function public.ensure_my_identities() to authenticated;
grant execute on function public.set_my_active_identity(uuid) to authenticated;
commit;

