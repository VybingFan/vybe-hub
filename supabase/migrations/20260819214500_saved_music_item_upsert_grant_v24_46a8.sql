-- VYBE V24.46A8 - Saved Music Item Upsert Grant
-- The current supporter save flow uses Supabase upsert on supporter_music_list_items.
-- INSERT was granted previously, but UPDATE was omitted.
-- Upsert requires UPDATE privilege when resolving a unique conflict.

begin;

grant update on public.supporter_music_list_items to authenticated;
grant all on public.supporter_music_list_items to service_role;

commit;
