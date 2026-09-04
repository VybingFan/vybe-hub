-- VYBE V24.77B1 - Lightweight per-upload rights declaration
-- Applied to linked Supabase on 2026-09-04 as remote migration version 20260904081524.
begin;

alter table public.tracks
  add column if not exists upload_rights_declaration_version text,
  add column if not exists upload_rights_declaration_confirmed boolean not null default false,
  add column if not exists upload_rights_declared_at timestamptz,
  add column if not exists upload_rights_declaration_note text;

alter table public.tracks
  drop constraint if exists tracks_upload_rights_declaration_note_length_check;

alter table public.tracks
  add constraint tracks_upload_rights_declaration_note_length_check
  check (upload_rights_declaration_note is null or char_length(upload_rights_declaration_note) <= 1000);

comment on column public.tracks.upload_rights_declaration_version is
  'Version of the song-specific upload rights declaration explicitly accepted by the uploader.';
comment on column public.tracks.upload_rights_declaration_confirmed is
  'True only when the uploader explicitly confirmed the song-specific rights declaration.';
comment on column public.tracks.upload_rights_declared_at is
  'Timestamp of the song-specific upload rights declaration.';
comment on column public.tracks.upload_rights_declaration_note is
  'Optional creator-provided context for collaboration, cover, license, sample, public-domain, or other rights basis.';

commit;
