# VYBE V24.42A Mixed-Media Compatibility Foundation

## Purpose

This bundle introduces the safe database and TypeScript foundation needed for film playlists while preserving all working music behavior.

## Product rules implemented

- Creator Free, Plus, Pro, and Studio remain the same memberships and retain their existing prices.
- Film receives creator-type-specific labels, features, and usage allowances.
- Prices remain centralized in `creator_plan_definitions` and are not duplicated.
- Every existing creator profile defaults to the music discipline.
- Every existing playlist defaults to music presentation.
- Existing `playlist_tracks`, music services, routes, and players are unchanged.
- A companion `playlist_items` layer can later hold tracks, videos, external Watch links, projects, and notes.
- Cross-owner track and video references are rejected.
- Private mixed-media delivery is not enabled by this bundle.
- Film screeners and commercial distribution remain disabled.

## Initial film allowance posture

The migration seeds film-specific project, link, hosted-minute, protected-review, and team-seat values under the same plan codes. Hosted minutes align with the existing shared membership video-minute posture: Free 0, Plus 30, Pro 180, and Studio 600.

These values establish a reviewable source of truth. They do not enable native hosting, private screeners, rentals, purchases, payouts, or commercial distribution.

## Database additions

- `creator_profiles.primary_creator_discipline`
- `playlists.presentation_type`
- `creator_plan_discipline_allowances`
- `playlist_items`
- `replace_playlist_items(uuid, jsonb)`

## Installation safety

The installer copies files only. It does not push the database, commit, push Git, build, or deploy.

Review the migration with a Supabase dry run before applying it remotely.

## Validation

Run:

```powershell
git diff --check; npm run build; git status --short
```

Then perform the standard Supabase dry run. After an intentional database push, regenerate Supabase TypeScript types in the repository's normal workflow.

## Expected local changes

```text
?? docs/V24_42A_MIXED_MEDIA_FOUNDATION.md
?? src/features/membership/disciplineAllowances.ts
?? src/features/playlists/mixedMedia.ts
?? supabase/migrations/20260814010000_mixed_media_playlist_foundation_v24_42a.sql
```

