-- VYBE V24.50C1 - Anonymous Avatar Policy Repair
-- Prevents public creator-avatar signing from failing when PostgreSQL evaluates
-- the supporter-avatar policy. Public eligibility is unchanged.

begin;

create or replace function public.public_supporter_image_is_visible_v24_50c1(
  p_object_name text
) returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.supporter_profiles sp
    where sp.avatar_path = p_object_name
  );
$$;

revoke all on function public.public_supporter_image_is_visible_v24_50c1(text) from public;
grant execute on function public.public_supporter_image_is_visible_v24_50c1(text)
  to anon, authenticated, service_role;

drop policy if exists "Supporter profile images can be signed" on storage.objects;
create policy "Supporter profile images can be signed"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'avatars'
    and public.public_supporter_image_is_visible_v24_50c1(name)
  );

commit;
