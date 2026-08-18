# V24.45C — My Work / Unassigned Work UI

## Base
`6676ac79`

## Purpose
Make the V24.45B work-assignment foundation usable from the Back Office.

## Work Queue
Adds:
- My Work count and view
- Unassigned Work count and view
- All Active view
- My urgent and overdue counts
- manager assignment controls
- assignee status controls
- internal work notes
- due-date visibility
- source-record links
- manager-only manual work-item creation for testing and operational exceptions

## Existing alerts
The pre-existing `admin_notifications` system remains visible below the assignment workspace and is not replaced in this phase.

## Permissions
- `admin.work_queue.read` is required to open the page.
- Managers with `admin.team.manage` see active staff and assignment controls.
- Assigned staff can update their own active item status and notes through the protected V24.45B RPC.
- Direct client table writes are still not used.

## Next
The next integration phase can convert selected existing VYBE alerts into durable work items automatically, after the assignment UX has been tested with real staff workflow.

No Supabase migration is included in V24.45C.
