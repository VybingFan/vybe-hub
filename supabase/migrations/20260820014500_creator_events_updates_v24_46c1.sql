-- VYBE V24.46C1 - Creator Events, Updates & Promotions
begin;

create table if not exists public.creator_updates (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('show','appearance','festival','screening','podcast','workshop','meet_greet','livestream','release','promotion','announcement','other')),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 3000),
  starts_at timestamptz,
  ends_at timestamptz,
  location_name text not null default '' check (char_length(location_name) <= 200),
  location_address text not null default '' check (char_length(location_address) <= 300),
  image_path text,
  destination_url text,
  cta_label text not null default 'Learn More' check (char_length(cta_label) <= 60),
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_updates_creator_status_idx on public.creator_updates (creator_id, status, starts_at);
alter table public.creator_updates enable row level security;

drop policy if exists "Public creator updates are visible" on public.creator_updates;
create policy "Public creator updates are visible" on public.creator_updates for select using (status = 'published' or creator_id = auth.uid());

drop policy if exists "Creators can insert own updates" on public.creator_updates;
create policy "Creators can insert own updates" on public.creator_updates for insert to authenticated with check (creator_id = auth.uid());

drop policy if exists "Creators can update own updates" on public.creator_updates;
create policy "Creators can update own updates" on public.creator_updates for update to authenticated using (creator_id = auth.uid()) with check (creator_id = auth.uid());

drop policy if exists "Creators can delete own updates" on public.creator_updates;
create policy "Creators can delete own updates" on public.creator_updates for delete to authenticated using (creator_id = auth.uid());

grant select on public.creator_updates to anon, authenticated;
grant insert, update, delete on public.creator_updates to authenticated;
grant all on public.creator_updates to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('creator-updates','creator-updates',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view creator update images" on storage.objects;
create policy "Public can view creator update images" on storage.objects for select using (bucket_id = 'creator-updates');

drop policy if exists "Creators can upload own update images" on storage.objects;
create policy "Creators can upload own update images" on storage.objects for insert to authenticated
with check (bucket_id = 'creator-updates' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Creators can update own update images" on storage.objects;
create policy "Creators can update own update images" on storage.objects for update to authenticated
using (bucket_id = 'creator-updates' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'creator-updates' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Creators can delete own update images" on storage.objects;
create policy "Creators can delete own update images" on storage.objects for delete to authenticated
using (bucket_id = 'creator-updates' and (storage.foldername(name))[1] = auth.uid()::text);

commit;
