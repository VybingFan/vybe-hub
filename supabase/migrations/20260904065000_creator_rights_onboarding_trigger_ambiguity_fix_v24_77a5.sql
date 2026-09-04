-- VYBE V24.77A5 - Creator Rights onboarding trigger ambiguity repair
-- Fixes SQLSTATE 42702 caused by a PL/pgSQL variable sharing the
-- acknowledgement_version name used by the acceptance table conflict target.

begin;

create or replace function public.capture_creator_rights_onboarding_acceptance_v24_77a()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_acknowledgement_version text;
begin
  if metadata->>'creator_rights_protection_accepted' <> 'true' then
    return new;
  end if;

  v_acknowledgement_version := nullif(trim(metadata->>'creator_rights_protection_version'), '');
  if v_acknowledgement_version is null then
    return new;
  end if;

  if metadata->>'creator_rights_permission_confirmed' <> 'true'
     or metadata->>'creator_rights_fingerprinting_understood' <> 'true'
     or metadata->>'creator_rights_match_limit_understood' <> 'true'
     or metadata->>'creator_rights_work_classification_accuracy_confirmed' <> 'true'
     or metadata->>'creator_rights_information_request_understood' <> 'true' then
    return new;
  end if;

  insert into public.creator_rights_onboarding_acceptances (
    user_id,
    acknowledgement_version,
    permission_confirmed,
    fingerprinting_understood,
    match_limit_understood,
    work_classification_accuracy_confirmed,
    information_request_understood,
    acceptance_source
  )
  values (
    new.id,
    v_acknowledgement_version,
    true,
    true,
    true,
    true,
    true,
    'creator_signup'
  )
  on conflict on constraint creator_rights_onboarding_acc_user_id_acknowledgement_versi_key
  do nothing;

  return new;
end;
$$;

commit;
