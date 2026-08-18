# V24.45A R1 — Back Office Action Dashboard Foundation

Corrected installer built against the exact local `admin.tsx` structure shown after the first preflight-only failure.

## Changes
- Adds a simple `Open Back Office` staff entry when an admin is elsewhere in the authenticated app.
- Renames admin sidebar `Overview` to `Back Office Home`.
- Replaces the old generic Work areas block with an action-oriented Back Office launchpad:
  - Needs Attention
  - Creator Operations
  - Business Operations
  - Rights & Content
  - Accounts & Memberships
  - Platform Health
  - Admin Team (when permitted)
- Keeps the existing summary metrics, work-queue alert, detailed workspaces, and creator invitation management intact.
- Uses existing counts/data only; no assignment schema yet.

No Supabase migration.
No role/permission changes.
No Creator Studio, Business Portal, or Operations security-boundary changes.
