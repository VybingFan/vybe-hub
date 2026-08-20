alter table public.creator_profiles
  add column if not exists profile_theme text not null default 'vybe',
  add column if not exists profile_background_path text,
  add column if not exists profile_background_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'creator_profiles_profile_theme_check'
      and conrelid = 'public.creator_profiles'::regclass
  ) then
    alter table public.creator_profiles
      add constraint creator_profiles_profile_theme_check
      check (profile_theme in ('vybe','midnight','aurora','sunset','electric','custom'));
  end if;
end
$$;
