-- VYBE V24.46A6 - Identity Engagement Grants
-- Restores authenticated table privileges for identity-based supporter engagement.
-- Existing RLS policies remain authoritative.

begin;

grant select, insert, update, delete on public.identity_reactions to authenticated;
grant select, insert, update, delete on public.identity_follows to authenticated;

grant all on public.identity_reactions to service_role;
grant all on public.identity_follows to service_role;

commit;
