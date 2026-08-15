-- VYBE V24.42B2B - Film project media and private-review foundation.
begin;

create table public.film_project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.film_projects(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.creator_videos(id) on delete restrict,
  media_role text not null check(media_role in ('trailer','clip','scene','rough_cut','teaser','behind_the_scenes','other')),
  completion_state text not null default 'unfinished' check(completion_state in ('unfinished','finished')),
  creator_note text not null default '' check(char_length(creator_note)<=3000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(project_id,video_id)
);
create index film_project_media_project_order_idx on public.film_project_media(project_id,sort_order,created_at);

create table public.film_project_review_briefs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.film_projects(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  title text not null check(char_length(trim(title)) between 1 and 160),
  purpose text not null default 'creative_review' check(purpose in ('creative_review','rough_cut_review','scene_review','music_match','festival_review','other')),
  instructions text not null default '' check(char_length(instructions)<=5000),
  status text not null default 'draft' check(status in ('draft','revoked')),
  playlist_id uuid references public.playlists(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index film_project_review_briefs_creator_idx on public.film_project_review_briefs(creator_id,created_at desc);

grant select,insert,update,delete on public.film_project_media,public.film_project_review_briefs to authenticated;
grant all on public.film_project_media,public.film_project_review_briefs to service_role;
alter table public.film_project_media enable row level security;
alter table public.film_project_review_briefs enable row level security;

create policy "Film creators manage own project media" on public.film_project_media for all to authenticated
using(creator_id=auth.uid() and public.creator_has_focus(auth.uid(),'film'))
with check(creator_id=auth.uid() and public.creator_has_focus(auth.uid(),'film')
  and exists(select 1 from public.film_projects p where p.id=project_id and p.creator_id=auth.uid())
  and exists(select 1 from public.creator_videos v where v.id=video_id and v.creator_id=auth.uid()));
create policy "Film creators manage own review briefs" on public.film_project_review_briefs for all to authenticated
using(creator_id=auth.uid() and public.creator_has_focus(auth.uid(),'film'))
with check(creator_id=auth.uid() and public.creator_has_focus(auth.uid(),'film')
  and exists(select 1 from public.film_projects p where p.id=project_id and p.creator_id=auth.uid())
  and (playlist_id is null or exists(select 1 from public.playlists pl where pl.id=playlist_id and pl.creator_id=auth.uid() and pl.presentation_type='film')));

create or replace function public.validate_film_project_media()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.film_projects p where p.id=new.project_id and p.creator_id=new.creator_id) then raise exception 'Film project ownership could not be verified'; end if;
  if not exists(select 1 from public.creator_videos v where v.id=new.video_id and v.creator_id=new.creator_id) then raise exception 'Video ownership could not be verified'; end if;
  return new;
end; $$;
create trigger validate_film_project_media_trigger before insert or update on public.film_project_media
for each row execute function public.validate_film_project_media();

comment on table public.film_project_media is 'Trailers, clips, scenes, rough cuts, and other Video Library items assigned to a Film project.';
comment on table public.film_project_review_briefs is 'Private-review planning records. External sharing remains disabled until secure mixed-media delivery is activated.';
commit;
