-- V24.70B2A - private Blog media uploads with publication-aware signed access

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-media', 'blog-media', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.blog_post_media
  add column if not exists storage_path text;

alter table public.blog_post_media
  alter column media_url drop not null;

alter table public.blog_post_media
  drop constraint if exists blog_post_media_media_url_check;

alter table public.blog_post_media
  drop constraint if exists blog_post_media_source_required;

alter table public.blog_post_media
  add constraint blog_post_media_source_required check (
    (storage_path is not null and char_length(trim(storage_path)) > 0 and media_url is null)
    or
    (storage_path is null and media_url is not null and char_length(trim(media_url)) > 0)
  );

create index if not exists blog_post_media_storage_path_idx
  on public.blog_post_media(storage_path)
  where storage_path is not null;

drop policy if exists "Admins can read Blog media uploads" on storage.objects;
create policy "Admins can read Blog media uploads"
on storage.objects for select to authenticated
using (
  bucket_id = 'blog-media'
  and public.has_role(auth.uid(), 'admin')
);

drop policy if exists "Published Blog media uploads can be read" on storage.objects;
create policy "Published Blog media uploads can be read"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'blog-media'
  and exists (
    select 1
    from public.blog_post_media m
    join public.blog_posts p on p.id = m.post_id
    where m.storage_path = storage.objects.name
      and p.status = 'published'
      and p.published_at is not null
      and p.published_at <= now()
  )
);

drop policy if exists "Admins can upload Blog media" on storage.objects;
create policy "Admins can upload Blog media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'blog-media'
  and public.has_role(auth.uid(), 'admin')
  and exists (
    select 1 from public.blog_posts p
    where p.id::text = (storage.foldername(name))[1]
  )
);

drop policy if exists "Admins can update Blog media" on storage.objects;
create policy "Admins can update Blog media"
on storage.objects for update to authenticated
using (
  bucket_id = 'blog-media'
  and public.has_role(auth.uid(), 'admin')
)
with check (
  bucket_id = 'blog-media'
  and public.has_role(auth.uid(), 'admin')
  and exists (
    select 1 from public.blog_posts p
    where p.id::text = (storage.foldername(name))[1]
  )
);

drop policy if exists "Admins can delete Blog media" on storage.objects;
create policy "Admins can delete Blog media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'blog-media'
  and public.has_role(auth.uid(), 'admin')
);
