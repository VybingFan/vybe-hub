-- VYBE V24.78D
-- Deep-link account deletion work items to the exact account row.

BEGIN;

CREATE OR REPLACE FUNCTION public.request_my_immediate_account_deletion_review()
RETURNS public.account_deletion_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  actor_id uuid := auth.uid();
  actor_email text;
  deletion_request public.account_deletion_requests;
  work_item public.admin_work_items;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT email INTO actor_email
  FROM auth.users
  WHERE id = actor_id;

  SELECT *
  INTO deletion_request
  FROM public.account_deletion_requests
  WHERE user_id = actor_id
    AND request_type = 'self_service'
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;
  IF deletion_request.id IS NULL THEN
    RAISE EXCEPTION 'A pending self-service deletion request is required';
  END IF;

  UPDATE public.account_deletion_requests
  SET
    immediate_requested_at = COALESCE(immediate_requested_at, now()),
    updated_at = now()
  WHERE id = deletion_request.id
  RETURNING *
  INTO deletion_request;

  INSERT INTO public.admin_work_items (
    source_type, source_id, category, title, description,
    action_path, status, priority, due_at, created_by
  )
  VALUES (
    'account_deletion_request',
    deletion_request.id::text,
    'account_deletion',
    concat('Immediate account deletion: ', COALESCE(actor_email, actor_id::text)),
    concat(
      'Account holder ', COALESCE(actor_email, actor_id::text),
      ' asked for immediate deletion during the 7-day cancellation period.'
    ),
    concat('/admin/accounts?attention=', actor_id::text),
    'unassigned',
    'urgent',
    now(),
    actor_id
  )
  ON CONFLICT (source_type, source_id)
  DO UPDATE SET
    category = EXCLUDED.category,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    action_path = EXCLUDED.action_path,
    priority = 'urgent',
    due_at = now(),
    status = CASE
      WHEN public.admin_work_items.status IN ('completed','cancelled')
        THEN 'unassigned'
      ELSE public.admin_work_items.status
    END,
    completed_at = CASE
      WHEN public.admin_work_items.status IN ('completed','cancelled')
        THEN NULL
      ELSE public.admin_work_items.completed_at
    END,
    updated_at = now()
  RETURNING * INTO work_item;

  INSERT INTO public.account_deletion_audit (
    target_user_id, performed_by, request_id, request_type,
    action, outcome, summary
  )
  VALUES (
    actor_id, actor_id, deletion_request.id, 'self_service',
    'immediate_deletion_review_requested', 'success',
    jsonb_build_object('work_item_id', work_item.id)
  );

  RETURN deletion_request;
END;
$function$;
REVOKE ALL ON FUNCTION
  public.request_my_immediate_account_deletion_review()
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION
  public.request_my_immediate_account_deletion_review()
TO authenticated, service_role;

UPDATE public.admin_work_items awi
SET
  action_path = concat('/admin/accounts?attention=', adr.user_id::text),
  updated_at = now()
FROM public.account_deletion_requests adr
WHERE awi.source_type = 'account_deletion_request'
  AND awi.source_id = adr.id::text;

COMMIT;
