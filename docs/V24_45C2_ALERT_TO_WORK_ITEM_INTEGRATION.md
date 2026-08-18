# V24.45C2 — Alert to Work Item Integration

## Base
`62d9d37b`

## Purpose
Connect the existing VYBE Back Office alert system to the new durable assignment workflow.

## Behavior
When the Work Queue loads, VYBE synchronizes active `admin_notifications` into `admin_work_items`.

Each active alert becomes a durable work item with:
- source type `admin_notification`
- source id = notification id
- category
- title
- message/description
- action path
- normalized priority

The unique `(source_type, source_id)` constraint prevents duplicate work items.

## Preservation rules
If an alert-backed work item has already been assigned or moved into progress, synchronization does **not** reset its assignment/status.

Priority is refreshed only while the work item is still unassigned.

## Important
This phase does not automatically mark a work item completed when the original notification is resolved. Assignment completion remains a deliberate Back Office action for now.

That separation prevents an alert dismissal from accidentally closing operational work that is still being handled.

## Security
- authenticated user required
- `admin.work_queue.read` required
- SECURITY DEFINER RPC
- PUBLIC execution revoked
- no RLS weakening
- existing V24.45B assignment RPCs remain authoritative

## Next
After this is tested, the old alert section can be reduced in visual importance because real alert activity will already surface in Unassigned/My Work.

No frontend route rewrite is required; only the work service adds the sync call.
