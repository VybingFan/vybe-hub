# V24.44E2A R1 — Public Header Role Boundary Correction

Corrected installer for the current uncommitted E1/E1A/E2 source.

## Fixes
- Removes top-level `Creator Sign In` from the signed-out desktop public header.
- Removes the extra `Creator Start` button from the signed-out mobile auth area.
- Keeps `Supporter Sign In` and `Create Free Account` as the public community auth actions.
- Keeps `Build With VYBE` available through the More menu.
- Removes `Open Admin` from the public/community header.
- Shows `Open Creator Studio` only for creator primary role.
- Shows `Open Business Portal` only for business primary role.
- Supporter and admin primary roles see `My VYBE` without an extra public professional/admin CTA.

No authentication, role assignment, Supabase, Creator Studio, Business Portal, or Operations permission logic is changed.
No migration.
