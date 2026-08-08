begin;
create table public.identity_comments (
 id uuid primary key default gen_random_uuid(), identity_id uuid not null references public.account_identities(id) on delete cascade,
 entity_type text not null, entity_id uuid not null, parent_comment_id uuid references public.identity_comments(id) on delete cascade,
 body text not null check(char_length(btrim(body)) between 1 and 2000), status text not null default 'visible' check(status in ('visible','hidden','removed','reported')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.identity_notifications (
 id uuid primary key default gen_random_uuid(), recipient_identity_id uuid not null references public.account_identities(id) on delete cascade,
 actor_identity_id uuid references public.account_identities(id) on delete set null, notification_type text not null,
 entity_type text, entity_id uuid, payload jsonb not null default '{}'::jsonb, read_at timestamptz, created_at timestamptz not null default now()
);
create table public.engagement_reports (
 id uuid primary key default gen_random_uuid(), reporter_identity_id uuid not null references public.account_identities(id) on delete cascade,
 target_type text not null, target_id uuid not null, reason text not null, details text, status text not null default 'open', created_at timestamptz not null default now()
);
alter table public.identity_comments enable row level security; alter table public.identity_notifications enable row level security; alter table public.engagement_reports enable row level security;
create policy "visible comments read" on public.identity_comments for select using(status='visible' or exists(select 1 from public.account_identities i where i.id=identity_id and i.owner_user_id=auth.uid()));
create policy "supporter comments create" on public.identity_comments for insert with check(exists(select 1 from public.account_identities i where i.id=identity_id and i.owner_user_id=auth.uid() and i.identity_type='supporter'));
create policy "comment owner changes" on public.identity_comments for update using(exists(select 1 from public.account_identities i where i.id=identity_id and i.owner_user_id=auth.uid())) with check(exists(select 1 from public.account_identities i where i.id=identity_id and i.owner_user_id=auth.uid()));
create policy "notification recipient" on public.identity_notifications for select using(exists(select 1 from public.account_identities i where i.id=recipient_identity_id and i.owner_user_id=auth.uid()));
create policy "notification recipient update" on public.identity_notifications for update using(exists(select 1 from public.account_identities i where i.id=recipient_identity_id and i.owner_user_id=auth.uid()));
create policy "supporter reports" on public.engagement_reports for insert with check(exists(select 1 from public.account_identities i where i.id=reporter_identity_id and i.owner_user_id=auth.uid()));
commit;

