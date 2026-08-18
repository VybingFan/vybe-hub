# V24.44C — Remove Operations From the Main Application

## Base

- Required base commit: `1905c84edb4c7eec39afb5ab50524bede420c22c`
- Dependency: V24.44B Dedicated Back Office Authentication Boundary is already active.

## Purpose

Complete the visible and behavioral separation between ordinary VYBE and internal Operations without deleting or weakening the protected Operations system.

## Changes

1. **Identity switcher separation**
   - Removes the ordinary-app **Back Office** button from `IdentityModeBar`.
   - Removes the ability for the identity/workspace switcher to navigate into `/admin`.
   - Preserves Creator Studio, Business Studio, Explore VYBE, Supporter Mode, identity selection, and creator-mode browsing rules.
   - The internal `back_office` workspace label remains available only when the user is already on an authorized `/admin` route.

2. **Ordinary sign-in behavior**
   - Changes the ordinary default route for an account whose primary role is `admin` from `/admin` to `/home`.
   - This prevents a regular VYBE sign-in from automatically attempting to enter Operations.
   - The dedicated `/operations/sign-in` flow still starts the Operations session and explicitly routes authorized staff to `/admin`.

3. **Administrative module preloading**
   - Converts Back Office notification/team service imports in `TopNav` and `AppSidebar` to runtime dynamic imports that execute only when the current route is actually `/admin`.
   - Ordinary VYBE pages no longer eagerly load these administrative services.
   - Operations search/navigation/alerts remain intact when staff are actually inside `/admin`.

## Preserved

- `/operations/sign-in`
- Operations host validation
- Operations session creation, validation, expiry, and audit behavior
- `/admin` and all existing protected Operations subroutes
- Staff permissions and `OperationsBoundary`
- Admin invitation flows
- Creator Free / Plus / Pro / Studio membership rules
- `creator_mode.browse` gating
- Creator Studio, Business Studio, supporter/member navigation
- V24.44D Business Portal work remains separate and is not implemented here

## No database migration

V24.44C is an application-separation bundle only. It does not alter Supabase schema, RLS, functions, grants, or migrations.

## Required verification

After install/build, commit, push, and Active deployment 100%:

1. Sign into ordinary VYBE with the owner/admin account through the normal VYBE sign-in.
2. Confirm it lands in the ordinary VYBE experience rather than `/admin`.
3. Confirm no **Back Office** button appears in `IdentityModeBar` on ordinary VYBE pages.
4. Confirm ordinary VYBE search remains consumer/creator-facing and does not display Operations search language.
5. Confirm the ordinary sidebar does not show Operations navigation.
6. Confirm the owner can still enter Creator Studio and use permitted supporter/creator browsing modes.
7. Open `/admin` directly without a valid Operations session and confirm neutral denial/authorized-staff routing still applies.
8. Use `/operations/sign-in` on the allowed Operations host, authenticate as authorized staff, and confirm `/admin` and its navigation/search/alerts still work.
9. Confirm Creator `creator_mode.browse` behavior is unchanged.
10. Confirm no regressions in supporter, creator, or business ordinary navigation.

Do not begin V24.44D until V24.44C production verification passes.
