-- VYBE V24.79A1
-- Tighten creator support ticket ownership and set priority server-side.

BEGIN;

DROP POLICY IF EXISTS "creator support own" ON public.creator_support_requests;

CREATE POLICY "creator support own read"
ON public.creator_support_requests
FOR SELECT
TO authenticated
USING (creator_user_id = auth.uid());

CREATE POLICY "creator support own insert"
ON public.creator_support_requests
FOR INSERT
TO authenticated
WITH CHECK (
  creator_user_id = auth.uid()
  AND status = 'open'
);

CREATE OR REPLACE FUNCTION public.normalize_creator_support_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.creator_user_id IS DISTINCT FROM auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Cannot create a support ticket for another account';
  END IF;

  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    NEW.status := 'open';
    NEW.waiting_on := NULL;
    NEW.resolved_at := NULL;
    NEW.escalated_at := NULL;

    NEW.priority := CASE
      WHEN EXISTS (
        SELECT 1
        FROM public.account_entitlements entitlement
        WHERE entitlement.user_id = auth.uid()
          AND entitlement.status IN ('active','trialing')
          AND entitlement.plan_code IN (
            'creator_plus',
            'creator_pro',
            'creator_studio',
            'founding_beta'
          )
      )
      THEN 'priority'
      ELSE 'standard'
    END;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;
DROP TRIGGER IF EXISTS normalize_creator_support_request
ON public.creator_support_requests;

CREATE TRIGGER normalize_creator_support_request
BEFORE INSERT OR UPDATE
ON public.creator_support_requests
FOR EACH ROW
EXECUTE FUNCTION public.normalize_creator_support_request();

COMMIT;
