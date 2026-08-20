alter table public.profiles
  add column if not exists appearance_theme text not null default 'system';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_appearance_theme_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_appearance_theme_check
      check (appearance_theme in ('system','vybe-dark','vybe-light','midnight-blue','warm-stage'));
  end if;
end
$$;

comment on column public.profiles.appearance_theme is
  'Saved VYBE interface appearance preference for signed-in users.';
