begin;

create or replace function public.creator_effective_plan(p_user_id uuid)
returns text language sql security definer set search_path=public stable as $$
  select case
    when coalesce(plan_code,'creator_free')='founding_beta' and status in ('active','trialing') then 'creator_pro'
    when plan_code in ('creator_plus','creator_pro','creator_studio') and status in ('active','trialing') then plan_code
    else 'creator_free'
  end
  from (select ae.plan_code,ae.status from public.account_entitlements ae where ae.user_id=p_user_id limit 1) x
  union all select 'creator_free' where not exists(select 1 from public.account_entitlements ae where ae.user_id=p_user_id)
  limit 1;
$$;
grant execute on function public.creator_effective_plan(uuid) to authenticated,service_role;

create or replace function public.creator_has_full_epk(p_user_id uuid)
returns boolean language sql security definer set search_path=public stable as $$
  select public.creator_effective_plan(p_user_id) in ('creator_pro','creator_studio');
$$;

create or replace function public.get_my_epk_tier()
returns jsonb language sql security definer set search_path=public stable as $$
  select jsonb_build_object(
    'plan_code',public.creator_effective_plan(auth.uid()),
    'lite_epk',public.creator_effective_plan(auth.uid()) in ('creator_plus','creator_pro','creator_studio'),
    'full_epk',public.creator_effective_plan(auth.uid()) in ('creator_pro','creator_studio'),
    'press_photo_limit',case public.creator_effective_plan(auth.uid()) when 'creator_studio' then 25 when 'creator_pro' then 25 when 'creator_plus' then 3 else 1 end,
    'featured_track_limit',case public.creator_effective_plan(auth.uid()) when 'creator_studio' then 25 when 'creator_pro' then 25 when 'creator_plus' then 5 else 2 end
  );
$$;

create or replace function public.enforce_creator_epk_profile_tier()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_plan text:=public.creator_effective_plan(new.creator_id);
begin
  if v_plan in ('creator_pro','creator_studio') then return new; end if;
  if v_plan='creator_plus' then
    if tg_op='INSERT' then
      if nullif(btrim(coalesce(new.long_bio,'')),'') is not null or nullif(btrim(coalesce(new.business_email,'')),'') is not null or nullif(btrim(coalesce(new.booking_phone,'')),'') is not null or nullif(btrim(coalesce(new.booking_contact_name,'')),'') is not null or nullif(btrim(coalesce(new.management_name,'')),'') is not null or nullif(btrim(coalesce(new.management_email,'')),'') is not null or nullif(btrim(coalesce(new.publicist_name,'')),'') is not null or nullif(btrim(coalesce(new.publicist_email,'')),'') is not null or nullif(btrim(coalesce(new.primary_color,'')),'') is not null or nullif(btrim(coalesce(new.secondary_color,'')),'') is not null or nullif(btrim(coalesce(new.accent_color,'')),'') is not null then raise exception 'Full professional EPK fields require Creator Pro.'; end if;
    elsif new.long_bio is distinct from old.long_bio or new.business_email is distinct from old.business_email or new.booking_phone is distinct from old.booking_phone or new.booking_contact_name is distinct from old.booking_contact_name or new.management_name is distinct from old.management_name or new.management_email is distinct from old.management_email or new.publicist_name is distinct from old.publicist_name or new.publicist_email is distinct from old.publicist_email or new.primary_color is distinct from old.primary_color or new.secondary_color is distinct from old.secondary_color or new.accent_color is distinct from old.accent_color or new.public_business_email is distinct from old.public_business_email or new.public_booking_phone is distinct from old.public_booking_phone or new.public_management_contact is distinct from old.public_management_contact or new.public_publicist_contact is distinct from old.public_publicist_contact then raise exception 'Full professional EPK fields require Creator Pro.'; end if;
    return new;
  end if;
  if tg_op='INSERT' then
    if nullif(btrim(coalesce(new.medium_bio,'')),'') is not null or nullif(btrim(coalesce(new.long_bio,'')),'') is not null or nullif(btrim(coalesce(new.business_email,'')),'') is not null or nullif(btrim(coalesce(new.booking_phone,'')),'') is not null or nullif(btrim(coalesce(new.management_name,'')),'') is not null or nullif(btrim(coalesce(new.publicist_name,'')),'') is not null then raise exception 'EPK Lite requires Creator Plus. Full EPK requires Creator Pro.'; end if;
  elsif new.medium_bio is distinct from old.medium_bio or new.long_bio is distinct from old.long_bio or new.business_email is distinct from old.business_email or new.booking_phone is distinct from old.booking_phone or new.management_name is distinct from old.management_name or new.publicist_name is distinct from old.publicist_name then raise exception 'EPK Lite requires Creator Plus. Full EPK requires Creator Pro.'; end if;
  return new;
end;$$;

create or replace function public.enforce_creator_epk_child_tier()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_plan text:=public.creator_effective_plan(new.creator_id);v_count integer;v_limit integer;
begin
  if v_plan in ('creator_pro','creator_studio') then return new; end if;
  if tg_table_name='creator_epk_assets' then
    if new.asset_type<>'press_photo' then raise exception 'Logos, documents, flyers, and riders require Creator Pro.'; end if;
    v_limit:=case when v_plan='creator_plus' then 3 else 1 end;
    select count(*) into v_count from public.creator_epk_assets where creator_id=new.creator_id and id<>new.id;
    if v_count>=v_limit then raise exception 'Your membership press-photo limit has been reached.'; end if;
  elsif tg_table_name='creator_epk_featured_tracks' then
    v_limit:=case when v_plan='creator_plus' then 5 else 2 end;
    select count(*) into v_count from public.creator_epk_featured_tracks where creator_id=new.creator_id and track_id<>new.track_id;
    if v_count>=v_limit then raise exception 'Your membership featured-track limit has been reached.'; end if;
  else raise exception 'Credits, WAV masters, and press milestones require Creator Pro.';
  end if;return new;
end;$$;

create or replace function public.enforce_playlist_membership_tier()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_plan text:=public.creator_effective_plan(new.creator_id);v_limit integer;v_days integer;v_count integer;
begin
  if new.access_mode='password' then
    v_limit:=case v_plan when 'creator_plus' then 3 when 'creator_pro' then 25 when 'creator_studio' then 100 else 0 end;
    v_days:=case v_plan when 'creator_plus' then 7 when 'creator_pro' then 90 when 'creator_studio' then 365 else 0 end;
    if v_limit=0 then raise exception 'Password-protected playlists require Creator Plus.'; end if;
    select count(*) into v_count from public.playlists where creator_id=new.creator_id and access_mode='password' and id<>new.id and (access_expires_at is null or access_expires_at>now());
    if v_count>=v_limit then raise exception 'Your active password-playlist limit has been reached.'; end if;
    if new.access_expires_at is null or new.access_expires_at>now()+make_interval(days=>v_days) then raise exception 'This plan requires a link expiration within % days.',v_days; end if;
  elsif new.access_mode='approved_listeners' then
    if v_plan not in ('creator_pro','creator_studio') then raise exception 'Approved listeners require Creator Pro.'; end if;
  elsif new.access_mode='unlisted' then
    v_limit:=case v_plan when 'creator_plus' then 10 when 'creator_pro' then 50 when 'creator_studio' then 150 else 2 end;
    select count(*) into v_count from public.playlists where creator_id=new.creator_id and access_mode='unlisted' and id<>new.id and (access_expires_at is null or access_expires_at>now());
    if v_count>=v_limit then raise exception 'Your active unlisted-playlist limit has been reached.'; end if;
  end if;
  if new.require_sign_in and v_plan not in ('creator_pro','creator_studio') then raise exception 'Listener sign-in controls require Creator Pro.'; end if;
  return new;
end;$$;
drop trigger if exists playlist_membership_tier_guard on public.playlists;
create trigger playlist_membership_tier_guard before insert or update of access_mode,access_expires_at,require_sign_in on public.playlists for each row execute function public.enforce_playlist_membership_tier();

create or replace function public.enforce_playlist_grant_membership_tier()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_creator uuid;v_plan text;
begin select creator_id into v_creator from public.playlists where id=new.playlist_id;v_plan:=public.creator_effective_plan(v_creator);if v_plan not in ('creator_pro','creator_studio') then raise exception 'Approved-listener grants require Creator Pro.';end if;return new;end;$$;
drop trigger if exists playlist_grant_membership_tier_guard on public.playlist_access_grants;
create trigger playlist_grant_membership_tier_guard before insert or update on public.playlist_access_grants for each row execute function public.enforce_playlist_grant_membership_tier();

commit;
