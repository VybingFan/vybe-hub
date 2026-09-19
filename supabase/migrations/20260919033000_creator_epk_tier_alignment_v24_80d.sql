-- VYBE V24.80D - align EPK Starter/Lite/Full database enforcement.
-- Free keeps the private starter/readiness profile. Plus gets EPK Lite.
-- Pro, Studio, and eligible Founding access get the Full EPK data model.

begin;

create or replace function public.enforce_creator_epk_profile_tier()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_plan text := public.creator_effective_plan(new.creator_id);
begin
  if v_plan in ('creator_pro','creator_studio') then
    return new;
  end if;

  if v_plan = 'creator_plus' then
    if tg_op = 'INSERT' then
      if nullif(btrim(coalesce(new.long_bio,'')),'') is not null
        or nullif(btrim(coalesce(new.business_email,'')),'') is not null
        or nullif(btrim(coalesce(new.booking_phone,'')),'') is not null
        or nullif(btrim(coalesce(new.booking_contact_name,'')),'') is not null
        or nullif(btrim(coalesce(new.management_name,'')),'') is not null
        or nullif(btrim(coalesce(new.management_email,'')),'') is not null
        or nullif(btrim(coalesce(new.publicist_name,'')),'') is not null
        or nullif(btrim(coalesce(new.publicist_email,'')),'') is not null
        or nullif(btrim(coalesce(new.primary_color,'')),'') is not null
        or nullif(btrim(coalesce(new.secondary_color,'')),'') is not null
        or nullif(btrim(coalesce(new.accent_color,'')),'') is not null
      then raise exception 'Full professional EPK fields require Creator Pro.'; end if;
    else
      if new.long_bio is distinct from old.long_bio
        or new.business_email is distinct from old.business_email
        or new.booking_phone is distinct from old.booking_phone
        or new.booking_contact_name is distinct from old.booking_contact_name
        or new.management_name is distinct from old.management_name
        or new.management_email is distinct from old.management_email
        or new.publicist_name is distinct from old.publicist_name
        or new.publicist_email is distinct from old.publicist_email
        or new.primary_color is distinct from old.primary_color
        or new.secondary_color is distinct from old.secondary_color
        or new.accent_color is distinct from old.accent_color
        or new.public_business_email is distinct from old.public_business_email
        or new.public_booking_phone is distinct from old.public_booking_phone
        or new.public_management_contact is distinct from old.public_management_contact
        or new.public_publicist_contact is distinct from old.public_publicist_contact
      then raise exception 'Full professional EPK fields require Creator Pro.'; end if;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if nullif(btrim(coalesce(new.medium_bio,'')),'') is not null
      or nullif(btrim(coalesce(new.long_bio,'')),'') is not null
      or nullif(btrim(coalesce(new.business_email,'')),'') is not null
      or nullif(btrim(coalesce(new.booking_phone,'')),'') is not null
      or nullif(btrim(coalesce(new.booking_contact_name,'')),'') is not null
      or nullif(btrim(coalesce(new.management_name,'')),'') is not null
      or nullif(btrim(coalesce(new.management_email,'')),'') is not null
      or nullif(btrim(coalesce(new.publicist_name,'')),'') is not null
      or nullif(btrim(coalesce(new.publicist_email,'')),'') is not null
      or nullif(btrim(coalesce(new.bandcamp_url,'')),'') is not null
      or nullif(btrim(coalesce(new.primary_color,'')),'') is not null
      or nullif(btrim(coalesce(new.secondary_color,'')),'') is not null
      or nullif(btrim(coalesce(new.accent_color,'')),'') is not null
    then raise exception 'EPK Lite requires Creator Plus. Full EPK requires Creator Pro.'; end if;
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
    then raise exception 'EPK Lite requires Creator Plus. Full EPK requires Creator Pro.'; end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_creator_epk_profile_tier() from public, anon, authenticated;

commit;
