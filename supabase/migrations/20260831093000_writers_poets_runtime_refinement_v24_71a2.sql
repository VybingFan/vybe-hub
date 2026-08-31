-- V24.71A2 Writers & Poets runtime refinement
-- Permanent grants for the Writing foundation tables. RLS remains authoritative.

grant select, insert, update, delete on table
  public.creator_written_projects,
  public.creator_written_works,
  public.creator_written_work_media,
  public.creator_written_collections,
  public.creator_written_collection_items
to authenticated;

grant select on table
  public.creator_written_projects,
  public.creator_written_works,
  public.creator_written_work_media,
  public.creator_written_collections,
  public.creator_written_collection_items
to anon;
