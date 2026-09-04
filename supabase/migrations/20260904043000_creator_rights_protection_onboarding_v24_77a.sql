-- VYBE V24.77A - Creator Rights & Protection Onboarding
-- Records the versioned account-level creator acknowledgement supplied during
-- creator signup. This is distinct from song-specific rights declarations.

begin;

create table if not exists public.creator_rights_onboarding_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  acknowledgement_version text not null,
  permission_confirmed boolean not null,
  fingerprinting_understood boolean not null,
  match_limit_understood boolean not null,
  work_classification_accuracy_confirmed boolean not null,
  information_request_understood boolean not null,
  acceptance_source text not null default 'creator_signup',
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, acknowledgement_version)
);

create index if not exists creator_rights_onboarding_acceptances_user_idx
  on public.creator_rights_onboarding_acceptances(user_id, accepted_at desc);

alter table public.creator_rights_onboarding_acceptances enable row level security;

drop policy if exists "creator_rights_onboarding_acceptances_select_own"
  on public.creator_rights_onboarding_acceptances;
create policy "creator_rights_onboarding_acceptances_select_own"
  on public.creator_rights_onboarding_acceptances
  for select
  to authenticated
  using (user_id = auth.uid());

grant select on public.creator_rights_onboarding_acceptances to authenticated;
grant all on public.creator_rights_onboarding_acceptances to service_role;

create or replace function public.capture_creator_rights_onboarding_acceptance_v24_77a()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  acknowledgement_version text;
begin
  if metadata->>'creator_rights_protection_accepted' <> 'true' then
    return new;
  end if;

  acknowledgement_version := nullif(trim(metadata->>'creator_rights_protection_version'), '');
  if acknowledgement_version is null then
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
    acknowledgement_version,
    true,
    true,
    true,
    true,
    true,
    'creator_signup'
  )
  on conflict (user_id, acknowledgement_version) do nothing;

  return new;
end;
$$;

drop trigger if exists capture_creator_rights_onboarding_acceptance_v24_77a on auth.users;
create trigger capture_creator_rights_onboarding_acceptance_v24_77a
after insert or update of raw_user_meta_data on auth.users
for each row execute function public.capture_creator_rights_onboarding_acceptance_v24_77a();

comment on table public.creator_rights_onboarding_acceptances is
  'Versioned account-level VYBE Rights & Protection acknowledgements. Song-specific rights declarations are stored separately.';

commit;
