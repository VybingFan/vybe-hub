# V24.44D2A1 — Verified Business Submission Gate

## Base
`1a6e86f008036325a9cec3429cf15473ef52f266`

## Purpose
Harden V24.44D2A before the Business Portal receives proposal/request write UI.

D2A created the safe submission layer. D2A1 adds the missing business-verification gate so a pending, rejected, or suspended business cannot create, edit, delete, or submit proposal drafts.

## Changes
The existing owner SELECT policy remains unchanged so an owner may still see submissions belonging to their business.

The owner INSERT, UPDATE, and DELETE policies now additionally require the owning `business_profiles` row to have:

`verification_status = 'verified'`

`submit_my_business_submission(uuid)` now applies the same verified-business requirement.

Operations policies remain unchanged.

## Safety
The installer does not apply the migration.

Required sequence:
1. install locally;
2. build must pass;
3. inspect migration and run `git diff --check`;
4. `npx supabase db push --dry-run`;
5. confirm only the D2A1 migration;
6. `npx supabase db push`;
7. verify live policies/function;
8. stage intended files only;
9. commit and push;
10. confirm upstream `0 0`;
11. wait for Cloudflare Active deployment 100%;
12. then begin V24.44D2B.
