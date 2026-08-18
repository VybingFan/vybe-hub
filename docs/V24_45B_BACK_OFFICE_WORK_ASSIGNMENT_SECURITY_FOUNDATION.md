# V24.45B R1 — Back Office Work Assignment Security Foundation

Corrects the pre-push V24.45B migration before it reaches Supabase.

## Important R1 correction
The original draft could clear a manager-set due date when a manager updated status or notes without also resending `due_at`.

R1 changes due-date handling so:
- omitted due dates remain unchanged;
- a new non-null due date may be set explicitly by an administrator manager;
- `p_clear_due_at = true` explicitly clears it;
- non-managers cannot change priority or due date.

R1 also prevents an ordinary assignee from reopening completed/cancelled work; an administrator manager may do so.

## Workflow
`unassigned → assigned → in_progress → waiting → completed`

`cancelled` is supported for work closed without completion.

## Security
- RLS enabled.
- Read requires `admin.work_queue.read`.
- No direct table writes.
- Create/assign/unassign requires `admin.team.manage`.
- Assignee may update status/notes on their own active work.
- Manager controls assignee, priority, and due date.
- Audit events record assignment and status changes.

Existing `admin_notifications` remain unchanged until the UI/integration phase.
