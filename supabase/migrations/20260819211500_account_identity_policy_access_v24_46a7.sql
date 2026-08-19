-- VYBE V24.46A7 - Account Identity Policy Access
-- Allows authenticated RLS policy expressions on engagement tables to verify
-- ownership through public.account_identities.
-- Existing account_identities RLS remains authoritative.

begin;

grant select on public.account_identities to authenticated;
grant all on public.account_identities to service_role;

commit;
