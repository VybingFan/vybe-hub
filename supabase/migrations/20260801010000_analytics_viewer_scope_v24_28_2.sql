-- VYBE V24.28.2
-- Restrict Analytics Viewer to the read-only analytics and released-report workspace.

BEGIN;

DELETE FROM public.admin_role_permissions
WHERE role_code = 'analytics_viewer'
  AND permission_code <> 'admin.analytics.read';

DO $$
DECLARE
  mapping_count integer;
BEGIN
  SELECT count(*)
  INTO mapping_count
  FROM public.admin_role_permissions
  WHERE role_code = 'analytics_viewer';

  IF mapping_count <> 1 OR NOT EXISTS (
    SELECT 1
    FROM public.admin_role_permissions
    WHERE role_code = 'analytics_viewer'
      AND permission_code = 'admin.analytics.read'
  ) THEN
    RAISE EXCEPTION 'Analytics Viewer must have exactly admin.analytics.read';
  END IF;
END;
$$;

COMMIT;
