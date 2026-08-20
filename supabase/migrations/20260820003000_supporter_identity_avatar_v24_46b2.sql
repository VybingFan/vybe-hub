-- VYBE V24.46B2 - Supporter identity avatar foundation
begin;

alter table public.supporter_profiles add column if not exists avatar_path text;

drop policy if exists "Supporter profile images can be signed" on storage.objects;
create policy "Supporter profile images can be signed"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (
        select 1 from public.supporter_profiles sp
        where sp.avatar_path = name
      )
    )
  );

commit;
