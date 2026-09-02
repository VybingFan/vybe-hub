-- VYBE V24.75A — Creator Messaging + secure large-file transfer foundation
-- Bundle only. Review before applying to the connected Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.creator_message_threads (
  id uuid primary key default gen_random_uuid(),
  creator_a uuid not null references auth.users(id) on delete cascade,
  creator_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz,
  constraint creator_message_threads_distinct check (creator_a <> creator_b)
);
create unique index if not exists creator_message_threads_pair_uq
  on public.creator_message_threads (least(creator_a, creator_b), greatest(creator_a, creator_b));

create table if not exists public.creator_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.creator_message_threads(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  body text,
  transfer_id uuid,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint creator_messages_body_or_transfer check (nullif(btrim(coalesce(body,'')), '') is not null or transfer_id is not null)
);

create table if not exists public.creator_transfer_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  allow_large_files boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.creator_transfers (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.creator_message_threads(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'preparing' check (status in ('preparing','uploading','ready','expired','deleted','failed')),
  total_bytes bigint not null default 0 check (total_bytes >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.creator_messages
  drop constraint if exists creator_messages_transfer_id_fkey;
alter table public.creator_messages
  add constraint creator_messages_transfer_id_fkey foreign key (transfer_id)
  references public.creator_transfers(id) on delete set null;

create table if not exists public.creator_transfer_files (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references public.creator_transfers(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  content_type text not null default 'application/octet-stream',
  size_bytes bigint not null check (size_bytes > 0),
  object_key text not null unique,
  upload_status text not null default 'pending' check (upload_status in ('pending','uploading','ready','failed','deleted')),
  created_at timestamptz not null default now(),
  ready_at timestamptz
);


create table if not exists public.creator_transfer_download_tickets (
  ticket uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.creator_transfer_files(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.creator_transfer_download_tickets enable row level security;
-- Tickets are intentionally accessed only through security-definer RPCs.

create table if not exists public.creator_transfer_events (
  id bigint generated always as identity primary key,
  transfer_id uuid not null references public.creator_transfers(id) on delete cascade,
  file_id uuid references public.creator_transfer_files(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  bytes bigint,
  created_at timestamptz not null default now()
);
create index if not exists creator_transfer_events_transfer_idx on public.creator_transfer_events(transfer_id, created_at desc);
create index if not exists creator_transfer_files_sender_created_idx on public.creator_transfer_files(sender_user_id, created_at desc);
create index if not exists creator_messages_thread_created_idx on public.creator_messages(thread_id, created_at);

alter table public.creator_message_threads enable row level security;
alter table public.creator_messages enable row level security;
alter table public.creator_transfer_preferences enable row level security;
alter table public.creator_transfers enable row level security;
alter table public.creator_transfer_files enable row level security;
alter table public.creator_transfer_events enable row level security;

drop policy if exists creator_message_threads_participants on public.creator_message_threads;
create policy creator_message_threads_participants on public.creator_message_threads
for select using (auth.uid() in (creator_a, creator_b));

drop policy if exists creator_messages_participants on public.creator_messages;
create policy creator_messages_participants on public.creator_messages
for select using (exists (select 1 from public.creator_message_threads t where t.id=thread_id and auth.uid() in (t.creator_a,t.creator_b)));

drop policy if exists creator_transfer_preferences_self on public.creator_transfer_preferences;
create policy creator_transfer_preferences_self on public.creator_transfer_preferences
for all using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists creator_transfers_participants on public.creator_transfers;
create policy creator_transfers_participants on public.creator_transfers
for select using (auth.uid() in (sender_user_id, recipient_user_id));

drop policy if exists creator_transfer_files_participants on public.creator_transfer_files;
create policy creator_transfer_files_participants on public.creator_transfer_files
for select using (exists (select 1 from public.creator_transfers t where t.id=transfer_id and auth.uid() in (t.sender_user_id,t.recipient_user_id)));

drop policy if exists creator_transfer_events_participants on public.creator_transfer_events;
create policy creator_transfer_events_participants on public.creator_transfer_events
for select using (exists (select 1 from public.creator_transfers t where t.id=transfer_id and auth.uid() in (t.sender_user_id,t.recipient_user_id)));

create or replace function public.creator_transfer_policy(p_user_id uuid default auth.uid())
returns table(plan_code text, monthly_bytes bigint, max_file_bytes bigint, retention_days int)
language plpgsql stable security definer set search_path=public as $$
declare p text;
begin
  if p_user_id is null then raise exception 'Authentication required'; end if;
  if not public.has_role(p_user_id, 'creator'::public.app_role) and not public.has_role(p_user_id, 'admin'::public.app_role) then
    raise exception 'Creator access required';
  end if;
  p := coalesce(public.get_public_creator_plan(p_user_id), 'creator_free');
  return query select p,
    case p when 'creator_studio' then 300::bigint*1024*1024*1024 when 'founding_beta' then 150::bigint*1024*1024*1024 when 'creator_pro' then 150::bigint*1024*1024*1024 when 'creator_plus' then 50::bigint*1024*1024*1024 else 5::bigint*1024*1024*1024 end,
    case p when 'creator_studio' then 150::bigint*1024*1024*1024 when 'founding_beta' then 75::bigint*1024*1024*1024 when 'creator_pro' then 75::bigint*1024*1024*1024 when 'creator_plus' then 25::bigint*1024*1024*1024 else 5::bigint*1024*1024*1024 end,
    case p when 'creator_studio' then 45 when 'founding_beta' then 30 when 'creator_pro' then 30 when 'creator_plus' then 14 else 7 end;
end $$;

create or replace function public.creator_transfer_summary()
returns table(plan_code text, monthly_bytes bigint, used_bytes bigint, remaining_bytes bigint, max_file_bytes bigint, retention_days int)
language sql stable security definer set search_path=public as $$
  with p as (select * from public.creator_transfer_policy(auth.uid())),
  u as (select coalesce(sum(size_bytes),0)::bigint used from public.creator_transfer_files where sender_user_id=auth.uid() and created_at >= date_trunc('month', now()))
  select p.plan_code,p.monthly_bytes,u.used,greatest(p.monthly_bytes-u.used,0),p.max_file_bytes,p.retention_days from p,u;
$$;

create or replace function public.creator_message_directory(p_query text default '')
returns table(user_id uuid, artist_name text, username text, avatar_url text)
language sql stable security definer set search_path=public as $$
 select cp.user_id, cp.artist_name, cp.username, cp.avatar_url
 from public.creator_profiles cp
 where cp.user_id <> auth.uid()
   and public.has_role(cp.user_id, 'creator'::public.app_role)
   and (coalesce(p_query,'')='' or cp.artist_name ilike '%'||p_query||'%' or coalesce(cp.username,'') ilike '%'||p_query||'%')
 order by cp.artist_name limit 50;
$$;

create or replace function public.creator_message_start(p_other_user_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare tid uuid; a uuid:=auth.uid();
begin
 if a is null then raise exception 'Authentication required'; end if;
 if p_other_user_id=a or not public.has_role(p_other_user_id,'creator'::public.app_role) then raise exception 'Invalid creator'; end if;
 if not public.has_role(a,'creator'::public.app_role) and not public.has_role(a,'admin'::public.app_role) then raise exception 'Creator access required'; end if;
 select id into tid from public.creator_message_threads where least(creator_a,creator_b)=least(a,p_other_user_id) and greatest(creator_a,creator_b)=greatest(a,p_other_user_id);
 if tid is null then insert into public.creator_message_threads(creator_a,creator_b) values(a,p_other_user_id) returning id into tid; end if;
 return tid;
end $$;

create or replace function public.creator_message_threads_list()
returns table(thread_id uuid, other_user_id uuid, other_name text, other_username text, other_avatar text, last_message_at timestamptz, last_preview text)
language sql stable security definer set search_path=public as $$
 select t.id,
   case when t.creator_a=auth.uid() then t.creator_b else t.creator_a end,
   coalesce(cp.artist_name,'Creator'), cp.username, cp.avatar_url, t.last_message_at,
   (select case when m.transfer_id is not null then 'Shared a file' else left(m.body,120) end from public.creator_messages m where m.thread_id=t.id order by m.created_at desc limit 1)
 from public.creator_message_threads t
 left join public.creator_profiles cp on cp.user_id=(case when t.creator_a=auth.uid() then t.creator_b else t.creator_a end)
 where auth.uid() in (t.creator_a,t.creator_b)
 order by coalesce(t.last_message_at,t.created_at) desc;
$$;

create or replace function public.creator_message_thread_messages(p_thread_id uuid)
returns table(message_id uuid, sender_user_id uuid, body text, created_at timestamptz, transfer_id uuid, file_id uuid, file_name text, size_bytes bigint, content_type text, expires_at timestamptz, transfer_status text)
language sql stable security definer set search_path=public as $$
 select m.id,m.sender_user_id,m.body,m.created_at,m.transfer_id,f.id,f.file_name,f.size_bytes,f.content_type,t.expires_at,t.status
 from public.creator_messages m
 join public.creator_message_threads th on th.id=m.thread_id
 left join public.creator_transfers t on t.id=m.transfer_id
 left join public.creator_transfer_files f on f.transfer_id=t.id
 where m.thread_id=p_thread_id and auth.uid() in (th.creator_a,th.creator_b)
 order by m.created_at;
$$;

create or replace function public.creator_message_send(p_thread_id uuid,p_body text)
returns uuid language plpgsql security definer set search_path=public as $$
declare mid uuid;
begin
 if nullif(btrim(coalesce(p_body,'')),'') is null then raise exception 'Message required'; end if;
 if not exists(select 1 from public.creator_message_threads where id=p_thread_id and auth.uid() in (creator_a,creator_b)) then raise exception 'Not allowed'; end if;
 insert into public.creator_messages(thread_id,sender_user_id,body) values(p_thread_id,auth.uid(),left(btrim(p_body),5000)) returning id into mid;
 update public.creator_message_threads set last_message_at=now(),updated_at=now() where id=p_thread_id;
 return mid;
end $$;

create or replace function public.creator_transfer_prepare(p_thread_id uuid,p_file_name text,p_size_bytes bigint,p_content_type text default 'application/octet-stream')
returns table(transfer_id uuid,file_id uuid,object_key text,expires_at timestamptz)
language plpgsql security definer set search_path=public as $$
declare other_id uuid; pol record; used bigint; tid uuid; fid uuid; key text; exp timestamptz; allow_it boolean;
begin
 select case when creator_a=auth.uid() then creator_b else creator_a end into other_id from public.creator_message_threads where id=p_thread_id and auth.uid() in (creator_a,creator_b);
 if other_id is null then raise exception 'Thread not found'; end if;
 select coalesce((select allow_large_files from public.creator_transfer_preferences where user_id=other_id),true) into allow_it;
 if not allow_it then raise exception 'This creator is not accepting large files'; end if;
 select * into pol from public.creator_transfer_policy(auth.uid());
 if p_size_bytes<=0 or p_size_bytes>pol.max_file_bytes then raise exception 'File exceeds your membership single-file limit'; end if;
 select coalesce(sum(size_bytes),0) into used from public.creator_transfer_files where sender_user_id=auth.uid() and created_at>=date_trunc('month',now());
 if used+p_size_bytes>pol.monthly_bytes then raise exception 'Monthly transfer allowance exceeded'; end if;
 exp:=now()+make_interval(days=>pol.retention_days);
 insert into public.creator_transfers(thread_id,sender_user_id,recipient_user_id,status,total_bytes,expires_at) values(p_thread_id,auth.uid(),other_id,'uploading',p_size_bytes,exp) returning id into tid;
 fid:=gen_random_uuid(); key:=auth.uid()::text||'/'||tid::text||'/'||fid::text;
 insert into public.creator_transfer_files(id,transfer_id,sender_user_id,file_name,content_type,size_bytes,object_key,upload_status) values(fid,tid,auth.uid(),left(p_file_name,255),coalesce(nullif(p_content_type,''),'application/octet-stream'),p_size_bytes,key,'uploading');
 insert into public.creator_transfer_events(transfer_id,file_id,actor_user_id,event_type,bytes) values(tid,fid,auth.uid(),'prepared',p_size_bytes);
 return query select tid,fid,key,exp;
end $$;

create or replace function public.creator_transfer_authorize_upload(p_file_id uuid)
returns table(object_key text, size_bytes bigint)
language sql stable security definer set search_path=public as $$
 select f.object_key,f.size_bytes from public.creator_transfer_files f join public.creator_transfers t on t.id=f.transfer_id
 where f.id=p_file_id and f.sender_user_id=auth.uid() and t.sender_user_id=auth.uid() and t.status in ('preparing','uploading');
$$;

create or replace function public.creator_transfer_finish(p_file_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare tid uuid; thid uuid; mid uuid;
begin
 select f.transfer_id,t.thread_id into tid,thid from public.creator_transfer_files f join public.creator_transfers t on t.id=f.transfer_id where f.id=p_file_id and f.sender_user_id=auth.uid();
 if tid is null then raise exception 'Transfer not found'; end if;
 update public.creator_transfer_files set upload_status='ready',ready_at=now() where id=p_file_id;
 update public.creator_transfers set status='ready',completed_at=now() where id=tid;
 insert into public.creator_messages(thread_id,sender_user_id,transfer_id,body) values(thid,auth.uid(),tid,null) returning id into mid;
 update public.creator_message_threads set last_message_at=now(),updated_at=now() where id=thid;
 insert into public.creator_transfer_events(transfer_id,file_id,actor_user_id,event_type) values(tid,p_file_id,auth.uid(),'ready');
 return mid;
end $$;

create or replace function public.creator_transfer_create_download_ticket(p_file_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare tok uuid;
begin
 if not exists(select 1 from public.creator_transfer_files f join public.creator_transfers t on t.id=f.transfer_id where f.id=p_file_id and auth.uid() in (t.sender_user_id,t.recipient_user_id) and t.status='ready' and t.expires_at>now() and f.upload_status='ready') then raise exception 'File is unavailable or expired'; end if;
 insert into public.creator_transfer_download_tickets(file_id,user_id) values(p_file_id,auth.uid()) returning ticket into tok;
 return tok;
end $$;

create or replace function public.creator_transfer_consume_download_ticket(p_ticket uuid)
returns table(object_key text,file_name text,content_type text,size_bytes bigint)
language plpgsql security definer set search_path=public as $$
declare fid uuid; uid uuid;
begin
 update public.creator_transfer_download_tickets set used_at=now() where ticket=p_ticket and used_at is null and expires_at>now() returning file_id,user_id into fid,uid;
 if fid is null then return; end if;
 insert into public.creator_transfer_events(transfer_id,file_id,actor_user_id,event_type) select f.transfer_id,f.id,uid,'download_started' from public.creator_transfer_files f where f.id=fid;
 return query select f.object_key,f.file_name,f.content_type,f.size_bytes from public.creator_transfer_files f join public.creator_transfers t on t.id=f.transfer_id where f.id=fid and t.status='ready' and t.expires_at>now() and f.upload_status='ready';
end $$;

revoke all on function public.creator_transfer_policy(uuid) from public;
revoke all on function public.creator_transfer_summary() from public;
revoke all on function public.creator_message_directory(text) from public;
revoke all on function public.creator_message_start(uuid) from public;
revoke all on function public.creator_message_threads_list() from public;
revoke all on function public.creator_message_thread_messages(uuid) from public;
revoke all on function public.creator_message_send(uuid,text) from public;
revoke all on function public.creator_transfer_prepare(uuid,text,bigint,text) from public;
revoke all on function public.creator_transfer_authorize_upload(uuid) from public;
revoke all on function public.creator_transfer_finish(uuid) from public;
revoke all on function public.creator_transfer_create_download_ticket(uuid) from public;
revoke all on function public.creator_transfer_consume_download_ticket(uuid) from public;
grant execute on function public.creator_transfer_policy(uuid), public.creator_transfer_summary(), public.creator_message_directory(text), public.creator_message_start(uuid), public.creator_message_threads_list(), public.creator_message_thread_messages(uuid), public.creator_message_send(uuid,text), public.creator_transfer_prepare(uuid,text,bigint,text), public.creator_transfer_authorize_upload(uuid), public.creator_transfer_finish(uuid), public.creator_transfer_create_download_ticket(uuid) to authenticated;
grant execute on function public.creator_transfer_consume_download_ticket(uuid) to anon, authenticated;
