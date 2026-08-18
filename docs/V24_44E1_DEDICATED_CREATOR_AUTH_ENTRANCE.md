# V24.44E1 - Dedicated Creator Authentication Entrance

Base: `0e696fc6a773164a82ffc0d0c5018359e8816ddb`

## Purpose
Separate the professional Creator Studio entrance from the main supporter-facing VYBE authentication experience.

## Adds
- `/creator/sign-in`
- `/creator/sign-up`
- Creator-specific professional authentication copy and navigation.
- Creator signup assigns the existing `creator` role through the current `assignInitialRole` flow.
- Creator signup enters Creator Studio after account creation.
- Creator sign-in enters `/dashboard`.
- Creator accounts still use the existing VYBE identity/auth system and can browse VYBE as supporters.

## Main VYBE alignment
- The public creator marketing CTA points to `/creator/sign-up`.
- The public navigation exposes a dedicated Creator Sign In.
- The ordinary signup/onboarding default is changed from creator-first to supporter-first.
- Existing `/auth/sign-in` remains the supporter/member entrance.
- Existing Operations and Business Portal boundaries are untouched.

## No migration
This phase reuses the existing role/auth/onboarding model and contains no Supabase migration.
