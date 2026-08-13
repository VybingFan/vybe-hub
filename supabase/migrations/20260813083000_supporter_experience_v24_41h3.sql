create table if not exists public.supporter_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  genres text[] not null default '{}',
  content_types text[] not null default '{}',
  discovery_radius text not null default 'anywhere',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.supporter_preferences enable row level security;
drop policy if exists supporter_preferences_owner_read on public.supporter_preferences;
create policy supporter_preferences_owner_read on public.supporter_preferences for select to authenticated using (user_id = auth.uid());
drop policy if exists supporter_preferences_owner_insert on public.supporter_preferences;
create policy supporter_preferences_owner_insert on public.supporter_preferences for insert to authenticated with check (user_id = auth.uid());
drop policy if exists supporter_preferences_owner_update on public.supporter_preferences;
create policy supporter_preferences_owner_update on public.supporter_preferences for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.community_conversations (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 120),
  body text not null check (char_length(body) between 10 and 3000),
  topic text not null default 'general',
  status text not null default 'visible' check (status in ('visible','under_review','hidden','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_conversations_status_created_idx on public.community_conversations(status, created_at desc);
alter table public.community_conversations enable row level security;
drop policy if exists community_conversations_member_read on public.community_conversations;
create policy community_conversations_member_read on public.community_conversations for select to authenticated using (status = 'visible' or author_id = auth.uid());
drop policy if exists community_conversations_member_insert on public.community_conversations;
create policy community_conversations_member_insert on public.community_conversations for insert to authenticated with check (author_id = auth.uid());
drop policy if exists community_conversations_owner_update on public.community_conversations;
create policy community_conversations_owner_update on public.community_conversations for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

grant select, insert, update on public.supporter_preferences to authenticated;
grant select, insert, update on public.community_conversations to authenticated;
