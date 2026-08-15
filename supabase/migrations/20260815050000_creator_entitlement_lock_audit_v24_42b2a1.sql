-- VYBE V24.42B2A1 - creator entitlement lock audit and corrections.
begin;

-- Backfill every creator account, including older accounts that did not yet
-- have a creator_profiles row when V24.42B1A was installed.
with creator_accounts as (
  select user_id from public.user_roles where role::text='creator'
  union select user_id from public.creator_profiles
  union select user_id from public.account_entitlements
    where plan_code in ('creator_free','creator_plus','creator_pro','creator_studio','founding_beta')
), targets as (
  select ca.user_id, coalesce(cp.primary_creator_discipline,'music') as focus_code
  from creator_accounts ca left join public.creator_profiles cp on cp.user_id=ca.user_id
  where not exists(select 1 from public.creator_focus_access a where a.creator_id=ca.user_id
    and a.status in ('active','grace') and (a.ends_at is null or a.ends_at>now()))
)
insert into public.creator_focus_access(creator_id,focus_code,access_kind,status,source,ends_at)
select user_id,focus_code,'primary','active','migration',null from targets
on conflict(creator_id,focus_code) do update set access_kind='primary',status='active',ends_at=null,updated_at=now();

create or replace function public.initialize_creator_primary_focus()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.creator_focus_access where creator_id=new.user_id
    and status in ('active','grace') and (ends_at is null or ends_at>now())) then
    insert into public.creator_focus_access(creator_id,focus_code,access_kind,status,source)
    values(new.user_id,coalesce(new.primary_creator_discipline,'music'),'primary','active','migration')
    on conflict(creator_id,focus_code) do update set access_kind='primary',status='active',ends_at=null,updated_at=now();
  end if;
  return new;
end; $$;
drop trigger if exists initialize_creator_primary_focus_trigger on public.creator_profiles;
create trigger initialize_creator_primary_focus_trigger after insert on public.creator_profiles
for each row execute function public.initialize_creator_primary_focus();

-- Film projects enforce both total and public-project limits.
create or replace function public.enforce_film_project_allowance()
returns trigger language plpgsql security definer set search_path=public as $$
declare allowed integer; published_allowed integer; used integer; published_used integer; private_enabled boolean;
begin
  if not public.creator_has_focus(new.creator_id,'film') then raise exception 'Film & Video workspace access is required'; end if;
  select a.project_limit,a.published_project_limit,a.private_media_enabled
    into allowed,published_allowed,private_enabled
  from public.creator_plan_discipline_allowances a
  where a.plan_code=public.active_creator_plan(new.creator_id) and a.discipline='film';
  if tg_op='INSERT' then
    select count(*) into used from public.film_projects where creator_id=new.creator_id;
    if used>=coalesce(allowed,0) then raise exception 'Your Film project allowance has been reached'; end if;
  end if;
  if new.visibility='public' and (tg_op='INSERT' or old.visibility is distinct from 'public') then
    select count(*) into published_used from public.film_projects where creator_id=new.creator_id and visibility='public' and id<>new.id;
    if published_used>=coalesce(published_allowed,0) then raise exception 'Your published Film project allowance has been reached'; end if;
  end if;
  if new.visibility='private' and not coalesce(private_enabled,false) then
    raise exception 'Private hosted film delivery is not enabled for this membership';
  end if;
  return new;
end; $$;

create or replace function public.enforce_film_watch_destination_allowance()
returns trigger language plpgsql security definer set search_path=public as $$
declare allowed integer; used integer;
begin
  select a.external_media_link_limit into allowed
  from public.creator_plan_discipline_allowances a
  where a.plan_code=public.active_creator_plan(new.creator_id) and a.discipline='film';
  select count(*) into used from public.film_watch_destinations where creator_id=new.creator_id and id<>new.id;
  if used>=coalesce(allowed,0) then raise exception 'Your Film external Watch-link allowance has been reached'; end if;
  return new;
end; $$;
drop trigger if exists enforce_film_watch_destination_allowance_trigger on public.film_watch_destinations;
create trigger enforce_film_watch_destination_allowance_trigger before insert or update on public.film_watch_destinations
for each row execute function public.enforce_film_watch_destination_allowance();

create or replace function public.enforce_film_private_review_allowance()
returns trigger language plpgsql security definer set search_path=public as $$
declare allowed integer; used integer;
begin
  if new.presentation_type<>'film' or new.access_mode not in ('password','approved_listeners','membership_only') then return new; end if;
  select a.private_review_playlist_limit into allowed from public.creator_plan_discipline_allowances a
  where a.plan_code=public.active_creator_plan(new.creator_id) and a.discipline='film';
  select count(*) into used from public.playlists where creator_id=new.creator_id and presentation_type='film'
    and access_mode in ('password','approved_listeners','membership_only') and id<>new.id
    and (access_expires_at is null or access_expires_at>now());
  if used>=coalesce(allowed,0) then raise exception 'Your active private Film review-playlist allowance has been reached'; end if;
  return new;
end; $$;
drop trigger if exists film_private_review_allowance_trigger on public.playlists;
create trigger film_private_review_allowance_trigger before insert or update of access_mode,access_expires_at,presentation_type on public.playlists
for each row execute function public.enforce_film_private_review_allowance();

-- Film downloads remain locked for every current plan until protected hosted
-- media and revocation controls are deliberately activated.
create or replace function public.enforce_film_playlist_item_download_lock()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.allow_download and exists(select 1 from public.playlists p where p.id=new.playlist_id and p.presentation_type='film') then
    raise exception 'Film clip downloads are not available during the protected-media foundation phase';
  end if;
  return new;
end; $$;
drop trigger if exists film_playlist_item_download_lock_trigger on public.playlist_items;
create trigger film_playlist_item_download_lock_trigger before insert or update of allow_download on public.playlist_items
for each row execute function public.enforce_film_playlist_item_download_lock();

commit;
