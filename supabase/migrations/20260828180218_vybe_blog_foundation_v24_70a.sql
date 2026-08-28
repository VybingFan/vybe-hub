-- V24.70A - official VYBE Blog publishing foundation
create extension if not exists pgcrypto;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 3 and 220),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text,
  body text not null,
  category text,
  tags text[] not null default '{}',
  author_name text not null default 'VYBE Editorial',
  hero_image_url text,
  hero_image_alt text,
  status text not null default 'draft' check (status in ('draft','published')),
  is_featured boolean not null default false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_published_at_required check (status <> 'published' or published_at is not null)
);

create index if not exists blog_posts_publication_idx on public.blog_posts(status, published_at desc);
create index if not exists blog_posts_featured_idx on public.blog_posts(is_featured, published_at desc);

create or replace function public.set_blog_post_updated_at_v24_70a()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_blog_post_updated_at_v24_70a on public.blog_posts;
create trigger set_blog_post_updated_at_v24_70a before update on public.blog_posts
for each row execute function public.set_blog_post_updated_at_v24_70a();

alter table public.blog_posts enable row level security;

drop policy if exists "Public can read published blog posts" on public.blog_posts;
create policy "Public can read published blog posts" on public.blog_posts
for select using (status = 'published' and published_at is not null and published_at <= now());

drop policy if exists "Admins can manage blog posts" on public.blog_posts;
create policy "Admins can manage blog posts" on public.blog_posts
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;
