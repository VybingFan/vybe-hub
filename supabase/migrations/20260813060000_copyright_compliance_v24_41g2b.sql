begin;

create table if not exists public.legal_document_versions (
  document_code text not null,
  version text not null,
  title text not null,
  effective_at timestamptz not null,
  document_url text not null,
  required_for_creator boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (document_code, version)
);

insert into public.legal_document_versions(document_code,version,title,effective_at,document_url,required_for_creator)
values
 ('creator_upload_rights','VYBE-CUR-2026-08-13','Creator Upload and Rights Agreement',now(),'/copyright#creator-agreement',true),
 ('repeat_infringer','VYBE-RIP-2026-08-13','Repeat Infringer Policy',now(),'/copyright#repeat-infringer',true),
 ('dmca_policy','VYBE-DMCA-2026-08-13','Copyright and DMCA Policy',now(),'/copyright',false)
on conflict do nothing;

create table if not exists public.user_legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_code text not null,
  document_version text not null,
  accepted_at timestamptz not null default now(),
  acceptance_source text not null default 'creator_compliance',
  user_agent_summary text not null default '',
  revoked_at timestamptz,
  unique(user_id,document_code,document_version)
);

create table if not exists public.copyright_cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique default ('VYBE-DMCA-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  case_type text not null check (case_type in ('takedown_notice','counter_notice','rights_dispute','platform_review')),
  status text not null default 'received' check (status in ('received','needs_information','valid_review','access_disabled','counter_received','claimant_notified','restoration_scheduled','restored','closed','legal_hold','rejected')),
  claimant_name text not null,
  claimant_organization text not null default '',
  claimant_email text not null,
  claimant_phone text not null default '',
  claimant_address text not null,
  authorized_capacity text not null default '',
  copyrighted_work text not null,
  material_url text not null,
  material_description text not null,
  good_faith_statement boolean not null,
  accuracy_statement boolean not null,
  electronic_signature text not null,
  target_type text check (target_type in ('track','playlist','commerce_product','other')),
  target_id uuid,
  creator_id uuid references auth.users(id) on delete set null,
  received_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  disabled_at timestamptz,
  counter_received_at timestamptz,
  claimant_notified_at timestamptz,
  restore_not_before date,
  restore_not_after date,
  restored_at timestamptz,
  closed_at timestamptz,
  assigned_to uuid references auth.users(id) on delete set null,
  original_state jsonb not null default '{}'::jsonb,
  internal_notes text not null default '',
  legal_hold boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.copyright_case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.copyright_cases(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  from_status text,
  to_status text,
  notes text not null default '',
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.copyright_counter_notices (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.copyright_cases(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  subscriber_name text not null,
  subscriber_address text not null,
  subscriber_phone text not null,
  removed_material text not null,
  mistake_statement boolean not null,
  jurisdiction_consent boolean not null,
  service_consent boolean not null,
  electronic_signature text not null,
  submitted_at timestamptz not null default now()
);

create table if not exists public.copyright_strikes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null unique references public.copyright_cases(id) on delete restrict,
  status text not null default 'counting' check (status in ('counting','reversed','expired')),
  reason text not null,
  issued_by uuid not null references auth.users(id),
  issued_at timestamptz not null default now(),
  reversed_at timestamptz,
  reversal_reason text not null default ''
);

create table if not exists public.creator_compliance_status (
  creator_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'good_standing' check (status in ('good_standing','upload_hold','sales_hold','suspended','terminated')),
  reason text not null default '',
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table if not exists public.rights_audits (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('track','playlist','commerce_product')),
  target_id uuid not null,
  selection_reason text not null check (selection_reason in ('random','sale_listing','complaint','prior_strike','metadata_conflict','manual')),
  status text not null default 'requested' check (status in ('requested','evidence_received','approved','changes_requested','escalated','closed')),
  requested_evidence text not null,
  creator_response text not null default '',
  due_at timestamptz not null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text not null default '',
  created_at timestamptz not null default now(),
  unique(target_type,target_id,status)
);

create index if not exists copyright_cases_status_idx on public.copyright_cases(status,received_at);
create index if not exists copyright_cases_creator_idx on public.copyright_cases(creator_id,received_at desc);
create index if not exists copyright_strikes_creator_idx on public.copyright_strikes(creator_id,issued_at desc);
create index if not exists rights_audits_status_idx on public.rights_audits(status,due_at);

create or replace function public.has_current_creator_compliance_acceptance(_user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select not exists (
    select 1 from public.legal_document_versions d
    where d.active and d.required_for_creator
      and not exists (
        select 1 from public.user_legal_acceptances a
        where a.user_id=_user_id and a.document_code=d.document_code
          and a.document_version=d.version and a.revoked_at is null
      )
  );
$$;

create or replace function public.accept_creator_compliance_v24_41g2b(_user_agent_summary text default '')
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Sign in is required.'; end if;
  insert into public.user_legal_acceptances(user_id,document_code,document_version,user_agent_summary)
  select auth.uid(),document_code,version,left(coalesce(_user_agent_summary,''),500)
  from public.legal_document_versions where active and required_for_creator
  on conflict(user_id,document_code,document_version) do update set
    accepted_at=now(), revoked_at=null, user_agent_summary=excluded.user_agent_summary;
end $$;

create or replace function public.guard_creator_upload_compliance_v24_41g2b()
returns trigger language plpgsql set search_path=public as $$
declare compliance text;
begin
  if tg_op='INSERT' then
    if not public.has_current_creator_compliance_acceptance(new.creator_id) then
      raise exception 'Accept the current Creator Upload and Repeat Infringer policies before uploading.';
    end if;
    select status into compliance from public.creator_compliance_status where creator_id=new.creator_id;
    if compliance in ('upload_hold','suspended','terminated') then
      raise exception 'Music uploads are currently unavailable for this account. Contact VYBE Support.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists tracks_creator_compliance_guard on public.tracks;
create trigger tracks_creator_compliance_guard before insert on public.tracks
for each row execute function public.guard_creator_upload_compliance_v24_41g2b();

create or replace function public.submit_dmca_notice_v24_41g2b(
  _claimant_name text,_organization text,_email text,_phone text,_address text,
  _capacity text,_work text,_url text,_material text,_good_faith boolean,
  _accuracy boolean,_signature text
) returns text language plpgsql security definer set search_path=public as $$
declare result_number text;
begin
  if length(trim(_claimant_name))<2 or position('@' in _email)=0 or length(trim(_address))<5
     or length(trim(_work))<5 or length(trim(_url))<5 or length(trim(_material))<5
     or not _good_faith or not _accuracy or length(trim(_signature))<2 then
    raise exception 'The notice is incomplete.';
  end if;
  if (select count(*) from public.copyright_cases where lower(claimant_email)=lower(_email) and received_at>now()-interval '1 hour')>=5 then
    raise exception 'Submission limit reached. Contact the designated agent directly.';
  end if;
  insert into public.copyright_cases(case_type,claimant_name,claimant_organization,claimant_email,
    claimant_phone,claimant_address,authorized_capacity,copyrighted_work,material_url,
    material_description,good_faith_statement,accuracy_statement,electronic_signature)
  values('takedown_notice',trim(_claimant_name),trim(coalesce(_organization,'')),lower(trim(_email)),
    trim(coalesce(_phone,'')),trim(_address),trim(coalesce(_capacity,'')),trim(_work),trim(_url),
    trim(_material),_good_faith,_accuracy,trim(_signature)) returning case_number into result_number;
  return result_number;
end $$;

create or replace function public.submit_counter_notice_v24_41g2b(
  _case_id uuid,_name text,_address text,_phone text,_material text,_mistake boolean,
  _jurisdiction boolean,_service boolean,_signature text
) returns void language plpgsql security definer set search_path=public as $$
declare owner_id uuid;
begin
  select creator_id into owner_id from public.copyright_cases where id=_case_id and status='access_disabled';
  if owner_id is null or owner_id<>auth.uid() then raise exception 'Eligible case not found.'; end if;
  if not (_mistake and _jurisdiction and _service) or length(trim(_name))<2 or length(trim(_address))<5
     or length(trim(_phone))<7 or length(trim(_material))<5 or length(trim(_signature))<2 then
    raise exception 'The counter-notice is incomplete.';
  end if;
  insert into public.copyright_counter_notices(case_id,creator_id,subscriber_name,subscriber_address,
    subscriber_phone,removed_material,mistake_statement,jurisdiction_consent,service_consent,electronic_signature)
  values(_case_id,auth.uid(),trim(_name),trim(_address),trim(_phone),trim(_material),_mistake,_jurisdiction,_service,trim(_signature));
  update public.copyright_cases set status='counter_received',counter_received_at=now(),updated_at=now() where id=_case_id;
  insert into public.copyright_case_events(case_id,actor_id,event_type,from_status,to_status)
  values(_case_id,auth.uid(),'counter_notice_submitted','access_disabled','counter_received');
end $$;

create or replace function public.admin_update_copyright_case_v24_41g2b(
  _case_id uuid,_status text,_notes text default '',_target_type text default null,
  _target_id uuid default null,_creator_id uuid default null
) returns void language plpgsql security definer set search_path=public as $$
declare old_status text; state jsonb:='{}'::jsonb;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admin access required.'; end if;
  select status into old_status from public.copyright_cases where id=_case_id for update;
  if old_status is null then raise exception 'Case not found.'; end if;
  -- Restoration is deliberately excluded here. Only the dedicated restoration
  -- function may restore material after its timing and court-action checks.
  if _status not in ('needs_information','valid_review','access_disabled','claimant_notified','restoration_scheduled','closed','legal_hold','rejected') then raise exception 'Invalid status.'; end if;
  if _status='access_disabled' then
    if _target_type='track' then
      select jsonb_build_object('visibility',visibility,'status',status) into state from public.tracks where id=_target_id;
      update public.tracks set visibility='private' where id=_target_id;
    elsif _target_type='playlist' then
      select jsonb_build_object('access_mode',access_mode,'is_published',is_published) into state from public.playlists where id=_target_id;
      update public.playlists set access_mode='unlisted' where id=_target_id;
    elsif _target_type='commerce_product' then
      select jsonb_build_object('status',status) into state from public.commerce_products where id=_target_id;
      update public.commerce_products set status='retired' where id=_target_id;
    else raise exception 'Choose a supported target before disabling access.';
    end if;
  end if;
  update public.copyright_cases set status=_status,internal_notes=coalesce(_notes,''),
    target_type=coalesce(_target_type,target_type),target_id=coalesce(_target_id,target_id),
    creator_id=coalesce(_creator_id,creator_id),assigned_to=auth.uid(),
    original_state=case when _status='access_disabled' then state else original_state end,
    disabled_at=case when _status='access_disabled' then now() else disabled_at end,
    acknowledged_at=coalesce(acknowledged_at,now()),legal_hold=(_status='legal_hold'),
    closed_at=case when _status in ('closed','rejected') then now() else closed_at end,updated_at=now()
  where id=_case_id;
  insert into public.copyright_case_events(case_id,actor_id,event_type,from_status,to_status,notes)
  values(_case_id,auth.uid(),'admin_status_change',old_status,_status,coalesce(_notes,''));
end $$;

create or replace function public.admin_schedule_dmca_restoration_v24_41g2b(_case_id uuid,_claimant_notified boolean)
returns void language plpgsql security definer set search_path=public as $$
declare min_date date; max_date date; added integer:=0; received_date date;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admin access required.'; end if;
  if not _claimant_notified then raise exception 'Confirm that the claimant received the counter-notice.'; end if;
  select counter_received_at::date into received_date from public.copyright_cases where id=_case_id and status='counter_received';
  if received_date is null then raise exception 'Counter-notice case not found.'; end if;
  min_date:=received_date;
  max_date:=received_date;
  while added<14 loop
    max_date:=max_date+1;
    if extract(isodow from max_date)<6 then
      added:=added+1;
      if added=10 then min_date:=max_date; end if;
    end if;
  end loop;
  update public.copyright_cases set status='restoration_scheduled',claimant_notified_at=now(),
    restore_not_before=min_date,restore_not_after=max_date,updated_at=now()
  where id=_case_id and status='counter_received';
  if not found then raise exception 'Counter-notice case not found.'; end if;
  insert into public.copyright_case_events(case_id,actor_id,event_type,from_status,to_status,notes)
  values(_case_id,auth.uid(),'restoration_window_scheduled','counter_received','restoration_scheduled','Dates are operational reminders; calculate statutory business-day timing with counsel.');
end $$;

create or replace function public.get_admin_copyright_cases_v24_41g2b()
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admin access required.'; end if;
  return coalesce((select jsonb_agg(to_jsonb(c) order by c.received_at) from public.copyright_cases c),'[]'::jsonb);
end $$;

create or replace function public.admin_restore_dmca_material_v24_41g2b(_case_id uuid,_court_action_confirmed_absent boolean)
returns void language plpgsql security definer set search_path=public as $$
declare item public.copyright_cases%rowtype;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admin access required.'; end if;
  select * into item from public.copyright_cases where id=_case_id for update;
  if item.status<>'restoration_scheduled' or current_date<item.restore_not_before then raise exception 'The recorded restoration window has not opened.'; end if;
  if item.legal_hold or not _court_action_confirmed_absent then raise exception 'Restoration requires confirmation that no qualifying court action or legal hold prevents it.'; end if;
  if item.target_type='track' then
    update public.tracks set visibility=coalesce(item.original_state->>'visibility','private'),status=coalesce(item.original_state->>'status',status) where id=item.target_id;
  elsif item.target_type='playlist' then
    update public.playlists set access_mode=coalesce(item.original_state->>'access_mode','unlisted'),is_published=coalesce((item.original_state->>'is_published')::boolean,is_published) where id=item.target_id;
  elsif item.target_type='commerce_product' then
    update public.commerce_products set status=coalesce(item.original_state->>'status','retired') where id=item.target_id;
  else raise exception 'Unsupported restoration target.';
  end if;
  update public.copyright_cases set status='restored',restored_at=now(),closed_at=now(),updated_at=now() where id=_case_id;
  insert into public.copyright_case_events(case_id,actor_id,event_type,from_status,to_status,notes)
  values(_case_id,auth.uid(),'material_restored','restoration_scheduled','restored','Administrator confirmed no known qualifying court action or legal hold.');
end $$;

create or replace function public.admin_issue_copyright_strike_v24_41g2b(_case_id uuid,_reason text)
returns integer language plpgsql security definer set search_path=public as $$
declare owner_id uuid; strike_count integer;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admin access required.'; end if;
  select creator_id into owner_id from public.copyright_cases where id=_case_id;
  if owner_id is null then raise exception 'Assign the creator before issuing a strike.'; end if;
  insert into public.copyright_strikes(creator_id,case_id,reason,issued_by) values(owner_id,_case_id,_reason,auth.uid());
  select count(*) into strike_count from public.copyright_strikes
    where creator_id=owner_id and status='counting' and issued_at>now()-interval '12 months';
  if strike_count>=3 then
    insert into public.creator_compliance_status(creator_id,status,reason,changed_by)
    values(owner_id,'suspended','Three counting copyright strikes within 12 months; administrative termination review required.',auth.uid())
    on conflict(creator_id) do update set status='suspended',reason=excluded.reason,changed_by=auth.uid(),changed_at=now();
    update public.tracks set visibility='private' where creator_id=owner_id;
    update public.playlists set access_mode='unlisted' where creator_id=owner_id;
    update public.commerce_products set status='retired' where creator_id=owner_id;
  end if;
  return strike_count;
end $$;

create or replace function public.generate_random_rights_audits_v24_41g2b(_percent numeric default 5,_maximum integer default 25)
returns integer language plpgsql security definer set search_path=public as $$
declare inserted_count integer;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admin access required.'; end if;
  if _percent<=0 or _percent>25 or _maximum<1 or _maximum>100 then raise exception 'Invalid audit sample.'; end if;
  with candidates as (
    select creator_id,'track'::text target_type,id target_id from public.tracks
    where status='published' and visibility='public'
      and random()<=(_percent/100.0)
    order by random() limit _maximum
  )
  insert into public.rights_audits(creator_id,target_type,target_id,selection_reason,requested_evidence,due_at)
  select creator_id,target_type,target_id,'random','Provide ownership, split-sheet, beat-license, sample-clearance and artwork evidence applicable to this recording.',now()+interval '10 days'
  from candidates on conflict do nothing;
  get diagnostics inserted_count=row_count;
  return inserted_count;
end $$;

create or replace function public.submit_rights_audit_response_v24_41g2b(_audit_id uuid,_response text)
returns void language plpgsql security definer set search_path=public as $$
begin
  update public.rights_audits set creator_response=trim(_response),status='evidence_received'
  where id=_audit_id and creator_id=auth.uid() and status in ('requested','changes_requested');
  if not found then raise exception 'Eligible rights check not found.'; end if;
end $$;

create or replace function public.admin_create_rights_audit_v24_41g2b(
  _creator_id uuid,_target_type text,_target_id uuid,_reason text,_request text
) returns uuid language plpgsql security definer set search_path=public as $$
declare result_id uuid;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admin access required.'; end if;
  if _target_type not in ('track','playlist','commerce_product') or _reason not in ('sale_listing','complaint','prior_strike','metadata_conflict','manual') then raise exception 'Invalid audit target or reason.'; end if;
  insert into public.rights_audits(creator_id,target_type,target_id,selection_reason,requested_evidence,due_at)
  values(_creator_id,_target_type,_target_id,_reason,_request,now()+interval '10 days') returning id into result_id;
  return result_id;
end $$;

alter table public.legal_document_versions enable row level security;
alter table public.user_legal_acceptances enable row level security;
alter table public.copyright_cases enable row level security;
alter table public.copyright_case_events enable row level security;
alter table public.copyright_counter_notices enable row level security;
alter table public.copyright_strikes enable row level security;
alter table public.creator_compliance_status enable row level security;
alter table public.rights_audits enable row level security;

create policy legal_documents_public_read on public.legal_document_versions for select using(active);
create policy legal_acceptances_owner_read on public.user_legal_acceptances for select to authenticated using(user_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy copyright_cases_creator_read on public.copyright_cases for select to authenticated using(creator_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy copyright_events_admin_read on public.copyright_case_events for select to authenticated using(public.has_role(auth.uid(),'admin'));
create policy counter_notices_owner_read on public.copyright_counter_notices for select to authenticated using(creator_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy copyright_strikes_owner_read on public.copyright_strikes for select to authenticated using(creator_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy compliance_status_owner_read on public.creator_compliance_status for select to authenticated using(creator_id=auth.uid() or public.has_role(auth.uid(),'admin'));
create policy rights_audits_owner_read on public.rights_audits for select to authenticated using(creator_id=auth.uid() or public.has_role(auth.uid(),'admin'));

grant select on public.legal_document_versions to anon,authenticated;
grant select on public.user_legal_acceptances,public.copyright_counter_notices,public.copyright_strikes,public.creator_compliance_status,public.rights_audits to authenticated;
-- Claimant contact details and internal notes are intentionally excluded from
-- creator-accessible column grants. Administrators use the protected RPC.
grant select(id,case_number,status,material_url,received_at,counter_received_at,creator_id,restore_not_before,restore_not_after,disabled_at,restored_at,closed_at)
  on public.copyright_cases to authenticated;
revoke execute on function public.has_current_creator_compliance_acceptance(uuid) from public,anon;
revoke execute on function public.accept_creator_compliance_v24_41g2b(text) from public,anon;
revoke execute on function public.submit_dmca_notice_v24_41g2b(text,text,text,text,text,text,text,text,text,boolean,boolean,text) from public;
revoke execute on function public.submit_counter_notice_v24_41g2b(uuid,text,text,text,text,boolean,boolean,boolean,text) from public,anon;
revoke execute on function public.admin_update_copyright_case_v24_41g2b(uuid,text,text,text,uuid,uuid) from public,anon;
revoke execute on function public.get_admin_copyright_cases_v24_41g2b() from public,anon;
revoke execute on function public.admin_schedule_dmca_restoration_v24_41g2b(uuid,boolean) from public,anon;
revoke execute on function public.admin_restore_dmca_material_v24_41g2b(uuid,boolean) from public,anon;
revoke execute on function public.admin_issue_copyright_strike_v24_41g2b(uuid,text) from public,anon;
revoke execute on function public.generate_random_rights_audits_v24_41g2b(numeric,integer) from public,anon;
revoke execute on function public.submit_rights_audit_response_v24_41g2b(uuid,text) from public,anon;
revoke execute on function public.admin_create_rights_audit_v24_41g2b(uuid,text,uuid,text,text) from public,anon;
grant execute on function public.has_current_creator_compliance_acceptance(uuid) to authenticated;
grant execute on function public.accept_creator_compliance_v24_41g2b(text) to authenticated;
grant execute on function public.submit_dmca_notice_v24_41g2b(text,text,text,text,text,text,text,text,text,boolean,boolean,text) to anon,authenticated;
grant execute on function public.submit_counter_notice_v24_41g2b(uuid,text,text,text,text,boolean,boolean,boolean,text) to authenticated;
grant execute on function public.admin_update_copyright_case_v24_41g2b(uuid,text,text,text,uuid,uuid) to authenticated;
grant execute on function public.get_admin_copyright_cases_v24_41g2b() to authenticated;
grant execute on function public.admin_schedule_dmca_restoration_v24_41g2b(uuid,boolean) to authenticated;
grant execute on function public.admin_restore_dmca_material_v24_41g2b(uuid,boolean) to authenticated;
grant execute on function public.admin_issue_copyright_strike_v24_41g2b(uuid,text) to authenticated;
grant execute on function public.generate_random_rights_audits_v24_41g2b(numeric,integer) to authenticated;
grant execute on function public.submit_rights_audit_response_v24_41g2b(uuid,text) to authenticated;
grant execute on function public.admin_create_rights_audit_v24_41g2b(uuid,text,uuid,text,text) to authenticated;

commit;
