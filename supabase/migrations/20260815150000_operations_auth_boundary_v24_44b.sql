-- VYBE V24.44B - dedicated Operations authentication boundary.

begin;

create table public.operations_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.admin_team_members(user_id) on delete cascade,
  status text not null default 'active' check(status in ('active','expired','revoked')),
  auth_method text not null default 'password',
  mfa_verified boolean not null default false,
  issued_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '8 hours'),
  revoked_at timestamptz,
  user_agent text,
  check(expires_at > issued_at)
);
create index operations_sessions_user_active_idx on public.operations_sessions(user_id,status,expires_at desc);

alter table public.operations_sessions enable row level security;
grant all on public.operations_sessions to service_role;

create or replace function public.start_operations_session_v24_44b(_user_agent text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); session_id uuid; session_expiry timestamptz;
begin
  if actor is null then raise exception 'Authentication required.'; end if;
  if not public.has_role(actor,'admin'::public.app_role) or not exists(select 1 from public.admin_team_members where user_id=actor and status='active') then
    insert into public.admin_access_audit(actor_user_id,target_user_id,action,details) values(actor,actor,'operations_session_denied',jsonb_build_object('reason','staff_access_inactive'));
    raise exception 'Operations access is unavailable.';
  end if;
  update public.operations_sessions set status='expired' where user_id=actor and status='active' and (expires_at<=now() or last_seen_at<now()-interval '30 minutes');
  insert into public.operations_sessions(user_id,user_agent) values(actor,left(_user_agent,500)) returning id,expires_at into session_id,session_expiry;
  insert into public.admin_access_audit(actor_user_id,target_user_id,action,details) values(actor,actor,'operations_session_started',jsonb_build_object('session_id',session_id,'expires_at',session_expiry,'mfa_verified',false));
  return jsonb_build_object('session_id',session_id,'expires_at',session_expiry,'idle_timeout_minutes',30,'mfa_required',false);
end;$$;

create or replace function public.validate_operations_session_v24_44b(_session_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid(); session_row public.operations_sessions%rowtype;
begin
  if actor is null then return jsonb_build_object('valid',false); end if;
  select * into session_row from public.operations_sessions where id=_session_id and user_id=actor for update;
  if not found then return jsonb_build_object('valid',false); end if;
  if session_row.status<>'active' or session_row.expires_at<=now() or session_row.last_seen_at<now()-interval '30 minutes'
     or not public.has_role(actor,'admin'::public.app_role)
     or not exists(select 1 from public.admin_team_members where user_id=actor and status='active') then
    if session_row.status='active' then update public.operations_sessions set status='expired' where id=session_row.id; end if;
    return jsonb_build_object('valid',false);
  end if;
  update public.operations_sessions set last_seen_at=now() where id=session_row.id;
  return jsonb_build_object('valid',true,'expires_at',session_row.expires_at,'mfa_verified',session_row.mfa_verified,'idle_timeout_minutes',30);
end;$$;

create or replace function public.end_operations_session_v24_44b(_session_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare actor uuid:=auth.uid();
begin
  update public.operations_sessions set status='revoked',revoked_at=now() where id=_session_id and user_id=actor and status='active';
  if found then insert into public.admin_access_audit(actor_user_id,target_user_id,action,details) values(actor,actor,'operations_session_ended',jsonb_build_object('session_id',_session_id)); end if;
end;$$;

revoke all on function public.start_operations_session_v24_44b(text) from public;
revoke all on function public.validate_operations_session_v24_44b(uuid) from public;
revoke all on function public.end_operations_session_v24_44b(uuid) from public;
grant execute on function public.start_operations_session_v24_44b(text),public.validate_operations_session_v24_44b(uuid),public.end_operations_session_v24_44b(uuid) to authenticated;

comment on table public.operations_sessions is 'Short-lived staff authorization layered over the ordinary Supabase account session. MFA-ready; V24.44B does not claim MFA enforcement.';
commit;
