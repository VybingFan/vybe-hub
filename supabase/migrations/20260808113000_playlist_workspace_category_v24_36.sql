alter table public.playlists
  add column if not exists workspace_category text;

update public.playlists
set workspace_category = case
  when occasion in ('Exclusive preview') then 'upcoming'
  when occasion in ('Behind the music', 'Family or friends review', 'Producer review') then 'work_in_progress'
  when occasion in ('Collaboration session') then 'collaboration'
  when occasion in ('Label or business pitch', 'Radio submission') then 'commercial_preview'
  else 'released'
end
where workspace_category is null;

alter table public.playlists
  alter column workspace_category set default 'released',
  alter column workspace_category set not null;

alter table public.playlists
  drop constraint if exists playlists_workspace_category_check;

alter table public.playlists
  add constraint playlists_workspace_category_check
  check (
    workspace_category in (
      'released',
      'upcoming',
      'work_in_progress',
      'collaboration',
      'rights_pending',
      'commercial_preview',
      'archived'
    )
  );

comment on column public.playlists.workspace_category is
  'Creator workspace organization. Independent from playlist purpose and listener access.';
