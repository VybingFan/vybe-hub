begin;

create table if not exists public.supporter_music_lists (
  id uuid primary key default gen_random_uuid(),
  owner_identity_id uuid not null references public.account_identities(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists supporter_music_lists_owner_name_key
  on public.supporter_music_lists(owner_identity_id, lower(btrim(name)));
create unique index if not exists supporter_music_lists_one_default_key
  on public.supporter_music_lists(owner_identity_id) where is_default;

create table if not exists public.supporter_music_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.supporter_music_lists(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique(list_id, track_id)
);

alter table public.supporter_music_lists enable row level security;
alter table public.supporter_music_list_items enable row level security;

drop policy if exists supporter_music_lists_owner_select on public.supporter_music_lists;
create policy supporter_music_lists_owner_select on public.supporter_music_lists
  for select to authenticated using (
    exists (
      select 1 from public.account_identities i
      where i.id = owner_identity_id
        and i.owner_user_id = auth.uid()
        and i.identity_type = 'supporter'
    )
  );

drop policy if exists supporter_music_lists_owner_insert on public.supporter_music_lists;
create policy supporter_music_lists_owner_insert on public.supporter_music_lists
  for insert to authenticated with check (
    exists (
      select 1 from public.account_identities i
      where i.id = owner_identity_id
        and i.owner_user_id = auth.uid()
        and i.identity_type = 'supporter'
    )
  );

drop policy if exists supporter_music_lists_owner_update on public.supporter_music_lists;
create policy supporter_music_lists_owner_update on public.supporter_music_lists
  for update to authenticated using (
    exists (
      select 1 from public.account_identities i
      where i.id = owner_identity_id
        and i.owner_user_id = auth.uid()
        and i.identity_type = 'supporter'
    )
  ) with check (
    exists (
      select 1 from public.account_identities i
      where i.id = owner_identity_id
        and i.owner_user_id = auth.uid()
        and i.identity_type = 'supporter'
    )
  );

drop policy if exists supporter_music_lists_owner_delete on public.supporter_music_lists;
create policy supporter_music_lists_owner_delete on public.supporter_music_lists
  for delete to authenticated using (
    exists (
      select 1 from public.account_identities i
      where i.id = owner_identity_id
        and i.owner_user_id = auth.uid()
        and i.identity_type = 'supporter'
    )
  );

drop policy if exists supporter_music_list_items_owner_select on public.supporter_music_list_items;
create policy supporter_music_list_items_owner_select on public.supporter_music_list_items
  for select to authenticated using (
    exists (
      select 1 from public.supporter_music_lists l
      join public.account_identities i on i.id = l.owner_identity_id
      where l.id = list_id
        and i.owner_user_id = auth.uid()
        and i.identity_type = 'supporter'
    )
  );

drop policy if exists supporter_music_list_items_owner_insert on public.supporter_music_list_items;
create policy supporter_music_list_items_owner_insert on public.supporter_music_list_items
  for insert to authenticated with check (
    exists (
      select 1 from public.supporter_music_lists l
      join public.account_identities i on i.id = l.owner_identity_id
      where l.id = list_id
        and i.owner_user_id = auth.uid()
        and i.identity_type = 'supporter'
    )
  );

drop policy if exists supporter_music_list_items_owner_delete on public.supporter_music_list_items;
create policy supporter_music_list_items_owner_delete on public.supporter_music_list_items
  for delete to authenticated using (
    exists (
      select 1 from public.supporter_music_lists l
      join public.account_identities i on i.id = l.owner_identity_id
      where l.id = list_id
        and i.owner_user_id = auth.uid()
        and i.identity_type = 'supporter'
    )
  );

grant select, insert, update, delete on public.supporter_music_lists to authenticated;
grant select, insert, delete on public.supporter_music_list_items to authenticated;

commit;
