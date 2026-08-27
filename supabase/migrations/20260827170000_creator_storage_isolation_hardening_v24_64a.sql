-- VYBE V24.64A
-- Creator Storage Isolation Hardening
--
-- Goal:
-- Replace the legacy broad authenticated SELECT policy on private creator media
-- with owner/admin-scoped access while preserving the existing specific public
-- visibility policies for published tracks, playlists, merch, thumbnails, and
-- public profile/supporter images.

begin;

drop policy if exists "Authenticated read music/avatar buckets" on storage.objects;

create policy "Owners and authorized admins read private music avatar buckets"
on storage.objects
for select
to authenticated
using (
  bucket_id = any (array['music-audio'::text, 'music-covers'::text, 'avatars'::text])
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or has_admin_permission(auth.uid(), 'admin.creator.read'::text)
    or has_admin_permission(auth.uid(), 'admin.creator.manage'::text)
    or has_admin_permission(auth.uid(), 'admin.content.read'::text)
    or has_admin_permission(auth.uid(), 'admin.rights.read'::text)
  )
);

comment on policy "Owners and authorized admins read private music avatar buckets"
on storage.objects
is 'V24.64A: signed-in users may read only their own private music-audio/music-covers/avatar objects unless they hold an explicit VYBE admin review permission. Existing object-specific public SELECT policies remain responsible for published/public media.';

commit;
