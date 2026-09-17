begin;

create or replace function public.review_partner_application(
  p_partner_id uuid,
  p_status text,
  p_founding_partner boolean default false
) returns public.partner_profiles
language plpgsql security definer set search_path=public as $$
declare v_profile public.partner_profiles%rowtype;
begin
  if not public.has_role((select auth.uid()), 'admin') then raise exception 'Admin access required'; end if;
  if p_status not in ('pending','verified','rejected','suspended') then raise exception 'Invalid partner status'; end if;

  update public.partner_profiles
  set verification_status=p_status,
      founding_partner=case when p_status='verified' then p_founding_partner else false end,
      updated_at=now()
  where id=p_partner_id
  returning * into v_profile;
  if v_profile.id is null then raise exception 'Partner profile not found'; end if;

  if p_status='verified' then
    insert into public.user_roles(user_id,role) values(v_profile.owner_user_id,'partner'::public.app_role)
    on conflict(user_id,role) do nothing;
    insert into public.account_identities(owner_user_id,identity_type,display_name,subject_user_id,verified,status)
    values(v_profile.owner_user_id,'partner',v_profile.display_name,v_profile.owner_user_id,true,'active')
    on conflict(owner_user_id,identity_type,subject_user_id)
    do update set display_name=excluded.display_name,verified=true,status='active',updated_at=now();
  else
    delete from public.user_roles where user_id=v_profile.owner_user_id and role='partner'::public.app_role;
    update public.account_identities set verified=false,status=case when p_status='suspended' then 'suspended' else 'archived' end,updated_at=now()
    where owner_user_id=v_profile.owner_user_id and identity_type='partner';
  end if;
  return v_profile;
end $$;
revoke execute on function public.review_partner_application(uuid,text,boolean) from public, anon;
grant execute on function public.review_partner_application(uuid,text,boolean) to authenticated;

commit;