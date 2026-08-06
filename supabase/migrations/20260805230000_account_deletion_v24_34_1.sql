-- VYBE V24.34.1
-- Account deletion workflow foundation
-- Corrected for the existing V24.28 RBAC schema

BEGIN;

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  request_type text NOT NULL
    CHECK (request_type IN ('self_service', 'administrator')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'cancelled',
        'processing',
        'completed',
        'failed'
      )
    ),
  reason text,
  scheduled_for timestamptz NOT NULL,
  cancelled_at timestamptz,
  completed_at timestamptz,
  failure_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS account_deletion_one_active_request
ON public.account_deletion_requests(user_id)
WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS account_deletion_requests_status_idx
ON public.account_deletion_requests(status, scheduled_for);

CREATE TABLE IF NOT EXISTS public.account_deletion_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  target_user_id uuid,
  performed_by uuid,
  request_id uuid REFERENCES public.account_deletion_requests(id)
    ON DELETE SET NULL,
  request_type text NOT NULL
    CHECK (request_type IN ('self_service', 'administrator', 'system')),
  action text NOT NULL,
  outcome text NOT NULL,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS account_deletion_audit_target_idx
ON public.account_deletion_audit(target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS account_deletion_audit_actor_idx
ON public.account_deletion_audit(performed_by, created_at DESC);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view own deletion requests"
ON public.account_deletion_requests;

CREATE POLICY "Members view own deletion requests"
ON public.account_deletion_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Account administrators view deletion requests"
ON public.account_deletion_requests;

CREATE POLICY "Account administrators view deletion requests"
ON public.account_deletion_requests
FOR SELECT
TO authenticated
USING (
  public.has_admin_permission(
    auth.uid(),
    'admin.accounts.read'
  )
);

DROP POLICY IF EXISTS "Account administrators view deletion audit"
ON public.account_deletion_audit;

CREATE POLICY "Account administrators view deletion audit"
ON public.account_deletion_audit
FOR SELECT
TO authenticated
USING (
  public.has_admin_permission(
    auth.uid(),
    'admin.accounts.audit'
  )
);

INSERT INTO public.admin_permissions (
  code,
  name,
  description
)
VALUES
  (
    'admin.accounts.suspend',
    'Suspend accounts',
    'Temporarily restrict account access and public visibility.'
  ),
  (
    'admin.accounts.delete',
    'Delete accounts',
    'Permanently delete accounts and eligible associated content after confirmation.'
  ),
  (
    'admin.accounts.audit',
    'Review account audit history',
    'Review account-management and deletion activity.'
  )
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO public.admin_role_permissions (
  role_code,
  permission_code
)
SELECT
  'super_admin',
  p.code
FROM public.admin_permissions p
WHERE p.code IN (
  'admin.accounts.suspend',
  'admin.accounts.delete',
  'admin.accounts.audit'
)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.request_my_account_deletion_v24_34(
  _reason text DEFAULT NULL,
  _grace_days integer DEFAULT 7
)
RETURNS public.account_deletion_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  actor_id uuid := auth.uid();
  result public.account_deletion_requests;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _grace_days NOT BETWEEN 1 AND 30 THEN
    RAISE EXCEPTION 'Grace period must be between 1 and 30 days';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.account_deletion_requests
    WHERE user_id = actor_id
      AND status IN ('pending', 'processing')
  ) THEN
    RAISE EXCEPTION 'An active account deletion request already exists';
  END IF;

  INSERT INTO public.account_deletion_requests (
    user_id,
    requested_by,
    request_type,
    status,
    reason,
    scheduled_for
  )
  VALUES (
    actor_id,
    actor_id,
    'self_service',
    'pending',
    nullif(trim(coalesce(_reason, '')), ''),
    now() + make_interval(days => _grace_days)
  )
  RETURNING *
  INTO result;

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
    result.id,
    'self_service',
    'deletion_requested',
    'success',
    jsonb_build_object(
      'scheduled_for',
      result.scheduled_for,
      'grace_days',
      _grace_days
    )
  );

  RETURN result;
END;
$function$;

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

REVOKE ALL ON FUNCTION
  public.request_my_account_deletion_v24_34(text, integer)
FROM PUBLIC;

REVOKE ALL ON FUNCTION
  public.cancel_my_account_deletion_v24_34()
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION
  public.request_my_account_deletion_v24_34(text, integer)
TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION
  public.cancel_my_account_deletion_v24_34()
TO authenticated, service_role;

REVOKE ALL ON
  public.account_deletion_requests,
  public.account_deletion_audit
FROM anon, authenticated;

GRANT SELECT ON
  public.account_deletion_requests,
  public.account_deletion_audit
TO authenticated;

GRANT ALL ON
  public.account_deletion_requests,
  public.account_deletion_audit
TO service_role;

GRANT USAGE, SELECT ON SEQUENCE
  public.account_deletion_audit_id_seq
TO service_role;

COMMIT;