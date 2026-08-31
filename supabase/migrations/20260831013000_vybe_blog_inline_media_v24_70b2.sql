-- V24.70B2 - structured inline media for official VYBE Blog articles

create table if not exists public.blog_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  media_type text not null default 'image' check (media_type in ('image')),
  media_url text not null check (char_length(trim(media_url)) > 0),
  alt_text text not null check (char_length(trim(alt_text)) > 0),
  caption text,
  placement text not null default 'before_body' check (placement in ('before_body','after_heading','end_body')),
  heading_text text,
  display_style text not null default 'standard' check (display_style in ('standard','wide')),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_post_media_heading_required check (
    (placement = 'after_heading' and heading_text is not null and char_length(trim(heading_text)) > 0)
    or
    (placement <> 'after_heading' and heading_text is null)
  )
);

create index if not exists blog_post_media_post_order_idx
  on public.blog_post_media(post_id, sort_order, created_at);

create or replace function public.set_blog_post_media_updated_at_v24_70b2()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_blog_post_media_updated_at_v24_70b2 on public.blog_post_media;
create trigger set_blog_post_media_updated_at_v24_70b2
before update on public.blog_post_media
for each row execute function public.set_blog_post_media_updated_at_v24_70b2();

alter table public.blog_post_media enable row level security;

drop policy if exists "Public can read media for published blog posts" on public.blog_post_media;
create policy "Public can read media for published blog posts"
on public.blog_post_media
for select
using (
  exists (
    select 1
    from public.blog_posts p
    where p.id = blog_post_media.post_id
      and p.status = 'published'
      and p.published_at is not null
      and p.published_at <= now()
  )
);

drop policy if exists "Admins can manage blog post media" on public.blog_post_media;
create policy "Admins can manage blog post media"
on public.blog_post_media
for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

grant select on public.blog_post_media to anon, authenticated;
grant insert, update, delete on public.blog_post_media to authenticated;
