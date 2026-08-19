-- VYBE V24.46A9R1 - Supporter Comment Table Access
-- Existing RLS remains authoritative.

begin;

grant select, insert, update on public.identity_comments to authenticated;
grant all on public.identity_comments to service_role;

commit;
