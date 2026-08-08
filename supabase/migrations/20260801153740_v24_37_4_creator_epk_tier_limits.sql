begin;

create or replace function public.creator_has_full_epk(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.account_entitlements
    where user_id = p_user_id
      and plan_code in ('creator_plus', 'founding_beta')
      and status in ('active', 'trialing')
  );
$$;

create or replace function public.get_my_epk_tier()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'full_epk', public.creator_has_full_epk(auth.uid()),
    'press_photo_limit', case when public.creator_has_full_epk(auth.uid()) then 25 else 1 end,
    'featured_track_limit', case when public.creator_has_full_epk(auth.uid()) then 25 else 2 end
  );
$$;

grant execute on function public.get_my_epk_tier() to authenticated;

create or replace function public.enforce_creator_epk_profile_tier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.creator_has_full_epk(new.creator_id) then return new; end if;

  if tg_op = 'INSERT' then
    if nullif(btrim(coalesce(new.medium_bio, '')), '') is not null
      or nullif(btrim(coalesce(new.long_bio, '')), '') is not null
      or nullif(btrim(coalesce(new.business_email, '')), '') is not null
      or nullif(btrim(coalesce(new.booking_phone, '')), '') is not null
      or nullif(btrim(coalesce(new.booking_contact_name, '')), '') is not null
      or nullif(btrim(coalesce(new.management_name, '')), '') is not null
      or nullif(btrim(coalesce(new.management_email, '')), '') is not null
      or nullif(btrim(coalesce(new.publicist_name, '')), '') is not null
      or nullif(btrim(coalesce(new.publicist_email, '')), '') is not null
      or nullif(btrim(coalesce(new.bandcamp_url, '')), '') is not null
      or nullif(btrim(coalesce(new.primary_color, '')), '') is not null
      or nullif(btrim(coalesce(new.secondary_color, '')), '') is not null
      or nullif(btrim(coalesce(new.accent_color, '')), '') is not null
    then raise exception 'Upgrade to Creator Plus to use the full Industry Kit.'; end if;
  else
    if new.medium_bio is distinct from old.medium_bio
      or new.long_bio is distinct from old.long_bio
      or new.business_email is distinct from old.business_email
      or new.booking_phone is distinct from old.booking_phone
      or new.booking_contact_name is distinct from old.booking_contact_name
      or new.management_name is distinct from old.management_name
      or new.management_email is distinct from old.management_email
      or new.publicist_name is distinct from old.publicist_name
      or new.publicist_email is distinct from old.publicist_email
      or new.bandcamp_url is distinct from old.bandcamp_url
      or new.primary_color is distinct from old.primary_color
      or new.secondary_color is distinct from old.secondary_color
      or new.accent_color is distinct from old.accent_color
      or new.public_business_email is distinct from old.public_business_email
      or new.public_booking_phone is distinct from old.public_booking_phone
      or new.public_management_contact is distinct from old.public_management_contact
      or new.public_publicist_contact is distinct from old.public_publicist_contact
    then raise exception 'Upgrade to Creator Plus to use the full Industry Kit.'; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists creator_epk_profile_tier_guard on public.creator_epk_profiles;
create trigger creator_epk_profile_tier_guard before insert or update on public.creator_epk_profiles
for each row execute function public.enforce_creator_epk_profile_tier();

create or replace function public.enforce_creator_epk_child_tier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  if public.creator_has_full_epk(new.creator_id) then return new; end if;

  if tg_table_name = 'creator_epk_assets' then
    if new.asset_type <> 'press_photo' then
      raise exception 'Creator Free includes one EPK press photo. Upgrade for logos, documents, flyers, and riders.';
    end if;
    select count(*) into v_count from public.creator_epk_assets where creator_id = new.creator_id and id <> new.id;
    if v_count >= 1 then raise exception 'Creator Free includes one EPK press photo.'; end if;
  elsif tg_table_name = 'creator_epk_featured_tracks' then
    select count(*) into v_count from public.creator_epk_featured_tracks where creator_id = new.creator_id and track_id <> new.track_id;
    if v_count >= 2 then raise exception 'Creator Free includes two featured EPK tracks.'; end if;
  else
    raise exception 'Upgrade to Creator Plus to use credits, WAV masters, or press milestones in the Industry Kit.';
  end if;
  return new;
end;
$$;

drop trigger if exists creator_epk_asset_tier_guard on public.creator_epk_assets;
create trigger creator_epk_asset_tier_guard before insert or update on public.creator_epk_assets for each row execute function public.enforce_creator_epk_child_tier();
drop trigger if exists creator_epk_featured_tier_guard on public.creator_epk_featured_tracks;
create trigger creator_epk_featured_tier_guard before insert or update on public.creator_epk_featured_tracks for each row execute function public.enforce_creator_epk_child_tier();
drop trigger if exists creator_epk_master_tier_guard on public.creator_audio_masters;
create trigger creator_epk_master_tier_guard before insert or update on public.creator_audio_masters for each row execute function public.enforce_creator_epk_child_tier();
drop trigger if exists creator_epk_credit_tier_guard on public.creator_track_credits;
create trigger creator_epk_credit_tier_guard before insert or update on public.creator_track_credits for each row execute function public.enforce_creator_epk_child_tier();
drop trigger if exists creator_epk_highlight_tier_guard on public.creator_epk_press_highlights;
create trigger creator_epk_highlight_tier_guard before insert or update on public.creator_epk_press_highlights for each row execute function public.enforce_creator_epk_child_tier();

commit;
