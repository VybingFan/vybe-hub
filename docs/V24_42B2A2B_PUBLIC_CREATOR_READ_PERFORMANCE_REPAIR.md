# V24.42B2A2B Public Creator Read Performance Repair

## Base

- Expected base commit: `ed6950745711112f8bf2dd6f2130c71cb2586c3d`
- Preceding repair: V24.42B2A2A Public Creator Profile Access Repair

## Production symptom

After V24.42B2A2A restored public creator access, signed-out creator pages eventually loaded but could remain blank/spinning for tens of seconds. Browser diagnostics showed:

- `creator_profiles?...username=ilike.jerzofficial` returning PostgreSQL `57014` (`canceling statement due to statement timeout`) after roughly 39 seconds before a later successful request.
- Multiple anonymous storage signing requests for creator music returning `544` after similarly long waits.

The live database contains only two creator profile rows and sixteen playlists, so table size is not the explanation. The live RLS catalog showed anonymous policies that recursively enter other RLS-protected public tables during creator/profile/media eligibility checks.

## Repair

This migration adds narrowly scoped `SECURITY DEFINER` boolean helpers and rewrites the existing public policies to use them. The helpers preserve the predicates that already controlled public access, including calls to `creator_entity_is_publicly_available(...)` wherever the prior nested RLS path enforced membership/content-continuity eligibility.

The repair covers:

- the `Published playlist creators are public` creator-profile fallback;
- public named-creator track eligibility;
- public named-creator merch eligibility;
- public creator avatar/cover signing;
- public creator track audio/cover signing;
- public playlist audio/cover signing;
- public playlist cover signing;
- visible merch image signing.

## Membership behavior preserved

- Creator Free remains publicly discoverable through its named creator profile.
- Creator Free video access is not restored or broadened.
- Existing restrictive video membership policies remain untouched.
- Existing track, playlist, merch, and video content-continuity policies remain in place.
- The helper functions return booleans only; they do not return private creator/content rows.

## Migration

`20260818014500_public_creator_read_performance_v24_42b2a2b.sql`

The installer copies the migration and this document only. It does not apply the migration, commit, push, or deploy.

## Required verification

After migration, commit, push, and Cloudflare Active deployment 100%:

1. Open a private/signed-out browser window.
2. Verify `/artist/jerzofficial` and `/creator/jerzofficial` load without the prior long blank wait.
3. Verify `/artist/soundwavemane` and `/creator/soundwavemane` likewise load.
4. In Network, confirm the anonymous `creator_profiles` lookup returns 200 without a `57014` timeout.
5. Confirm creator avatar/cover and allowed public track media signing no longer produces the prior long `544` waits.
6. Confirm Creator Free shows no Videos section/access.
7. Confirm Pro/Founding-style creator presentation remains intact.
8. Confirm Discover creator cards and track links open the correct creator.

Do not start V24.44C until this production verification passes.
