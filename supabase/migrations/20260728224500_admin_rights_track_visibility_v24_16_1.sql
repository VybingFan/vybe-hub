-- V24.16.1: allow administrators to identify tracks in the rights-review
-- workspace. This is read-only and does not grant edit or deletion access.

CREATE POLICY "Admins view tracks for moderation"
  ON public.tracks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
