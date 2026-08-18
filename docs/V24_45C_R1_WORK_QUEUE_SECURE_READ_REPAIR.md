# V24.45C R1 — Work Queue Secure Read Repair

## Base
Committed base: `6676ac79`
Local expected state: uncommitted V24.45C UI installed.

## Problem found during localhost testing
The V24.45C page shell loaded, but `adminWorkService.list()` attempted a direct PostgREST SELECT from `admin_work_items`.

The table has RLS, but direct browser table access is intentionally not part of the assignment write/read contract, so the request returned HTTP 403. Because the page loaded its sources through one `Promise.all`, that failed request prevented the access/team initialization from completing, which also hid the manager-only `New work item` control.

## Repair
- Adds `public.list_admin_work_items()`.
- Requires authentication.
- Requires `admin.work_queue.read`.
- Returns only active items (`unassigned`, `assigned`, `in_progress`, `waiting`).
- Sorts urgent/high work first, then most recently updated.
- Revokes PUBLIC execution and grants execution to authenticated users.
- Changes `adminWorkService.list()` to use the protected RPC instead of direct table SELECT.

## Security
RLS is not weakened.
No direct table write access is added.
The V24.45B create/assign/update RPC boundaries remain unchanged.

## Separate issue
The hydration warning visible in the browser console is not part of this repair and is not the cause of the Work Queue 403.
