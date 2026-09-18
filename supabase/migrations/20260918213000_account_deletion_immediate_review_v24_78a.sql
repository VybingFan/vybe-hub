-- VYBE V24.78A
-- Account holder immediate-deletion review request -> Back Office Work Queue

BEGIN;

ALTER TABLE public.account_deletion_requests
ADD COLUMN IF NOT EXISTS immediate_requested_at timestamptz;

CREATE OR REPLACE FUNCTION public.request_my_immediate_account_deletion_review()
RETURNS public.account_deletion_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  actor_id uuid := auth.uid();
  deletion_request public.account_deletion_requests;
  work_item public.admin_work_items;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

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
    source_type,
    source_id,
    category,
    title,
    description,
    action_path,
    status,
    priority,
    due_at,
    created_by
  )
  VALUES (
    'account_deletion_request',
    deletion_request.id::text,
    'account_deletion',
    'Immediate account deletion requested',
    'An account holder with a pending 7-day deletion request asked for immediate deletion review.',
    '/admin/accounts',
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
  RETURNING *
  INTO work_item;

  INSERT INTO public.account_deletion_audit (
    target_user_id,
    performed_by,
    request_id,
    request_type,
    action,
    outcome,
    summary
  )
  VALUES (
    actor_id,
    actor_id,
    deletion_request.id,
    'self_service',
    'immediate_deletion_review_requested',
    'success',
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

CREATE OR REPLACE FUNCTION public.cancel_my_account_deletion_v24_34()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  actor_id uuid := auth.uid();
  cancelled_request_id uuid;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.account_deletion_requests
  SET
    status = 'cancelled',
    cancelled_at = now(),
    updated_at = now()
  WHERE user_id = actor_id
    AND status = 'pending'
  RETURNING id
  INTO cancelled_request_id;

  IF cancelled_request_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.admin_work_items
  SET
    status = 'cancelled',
    completed_at = NULL,
    updated_at = now(),
    notes = concat_ws(E'\n', notes, 'Automatically cancelled because the account holder cancelled the deletion request.')
  WHERE source_type = 'account_deletion_request'
    AND source_id = cancelled_request_id::text
    AND status NOT IN ('completed','cancelled');

  INSERT INTO public.account_deletion_audit (
    target_user_id,
    performed_by,
    request_id,
    request_type,
    action,
    outcome
  )
  VALUES (
    actor_id,
    actor_id,
    cancelled_request_id,
    'self_service',
    'deletion_cancelled',
    'success'
  );

  RETURN true;
END;
$function$;

COMMIT;
