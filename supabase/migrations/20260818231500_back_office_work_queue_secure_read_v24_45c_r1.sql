-- V24.45C R1 - Secure Back Office Work Queue Read RPC
BEGIN;

CREATE OR REPLACE FUNCTION public.list_admin_work_items()
RETURNS SETOF public.admin_work_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_admin_permission(auth.uid(), 'admin.work_queue.read') THEN
    RAISE EXCEPTION 'Work queue read permission required';
  END IF;

  RETURN QUERY
  SELECT w.*
  FROM public.admin_work_items w
  WHERE w.status NOT IN ('completed', 'cancelled')
  ORDER BY
    CASE w.priority
      WHEN 'urgent' THEN 4
      WHEN 'high' THEN 3
      WHEN 'normal' THEN 2
      WHEN 'low' THEN 1
      ELSE 0
    END DESC,
    w.updated_at DESC
  LIMIT 200;
END;
$$;

REVOKE ALL ON FUNCTION public.list_admin_work_items() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_admin_work_items() TO authenticated;

COMMENT ON FUNCTION public.list_admin_work_items() IS
  'Permission-checked Back Office active work-item reader for V24.45C.';

COMMIT;
