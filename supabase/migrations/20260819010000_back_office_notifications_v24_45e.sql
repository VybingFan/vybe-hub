-- V24.45E - Back Office notification preferences foundation
BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  notify_assigned boolean NOT NULL DEFAULT true,
  notify_urgent boolean NOT NULL DEFAULT true,
  notify_overdue boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Administrators view own notification preferences"
  ON public.admin_notification_preferences;
DROP POLICY IF EXISTS "Administrators update own notification preferences"
  ON public.admin_notification_preferences;

CREATE POLICY "Administrators view own notification preferences"
ON public.admin_notification_preferences
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  AND public.has_admin_permission(auth.uid(), 'admin.work_queue.read')
);

CREATE POLICY "Administrators update own notification preferences"
ON public.admin_notification_preferences
FOR ALL TO authenticated
USING (
  user_id = auth.uid()
  AND public.has_admin_permission(auth.uid(), 'admin.work_queue.read')
)
WITH CHECK (
  user_id = auth.uid()
  AND public.has_admin_permission(auth.uid(), 'admin.work_queue.read')
);

CREATE OR REPLACE FUNCTION public.get_my_admin_notification_preferences()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.admin_notification_preferences%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_admin_permission(auth.uid(), 'admin.work_queue.read') THEN
    RAISE EXCEPTION 'Work queue read permission required';
  END IF;

  INSERT INTO public.admin_notification_preferences (user_id)
  VALUES (auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT *
  INTO v_row
  FROM public.admin_notification_preferences
  WHERE user_id = auth.uid();

  RETURN jsonb_build_object(
    'enabled', v_row.enabled,
    'notify_assigned', v_row.notify_assigned,
    'notify_urgent', v_row.notify_urgent,
    'notify_overdue', v_row.notify_overdue,
    'updated_at', v_row.updated_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_my_admin_notification_preferences(
  p_enabled boolean DEFAULT NULL,
  p_notify_assigned boolean DEFAULT NULL,
  p_notify_urgent boolean DEFAULT NULL,
  p_notify_overdue boolean DEFAULT NULL
)
RETURNS jsonb
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

  INSERT INTO public.admin_notification_preferences (
    user_id,
    enabled,
    notify_assigned,
    notify_urgent,
    notify_overdue,
    updated_at
  )
  VALUES (
    auth.uid(),
    coalesce(p_enabled, false),
    coalesce(p_notify_assigned, true),
    coalesce(p_notify_urgent, true),
    coalesce(p_notify_overdue, true),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    enabled = coalesce(p_enabled, admin_notification_preferences.enabled),
    notify_assigned = coalesce(p_notify_assigned, admin_notification_preferences.notify_assigned),
    notify_urgent = coalesce(p_notify_urgent, admin_notification_preferences.notify_urgent),
    notify_overdue = coalesce(p_notify_overdue, admin_notification_preferences.notify_overdue),
    updated_at = now();

  RETURN public.get_my_admin_notification_preferences();
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_admin_notification_preferences() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_my_admin_notification_preferences(boolean, boolean, boolean, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_my_admin_notification_preferences() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_my_admin_notification_preferences(boolean, boolean, boolean, boolean) TO authenticated;

COMMENT ON TABLE public.admin_notification_preferences IS
  'Per-administrator Back Office device notification preferences.';

COMMENT ON FUNCTION public.get_my_admin_notification_preferences() IS
  'Returns or initializes the current administrator notification preferences.';

COMMENT ON FUNCTION public.update_my_admin_notification_preferences(boolean, boolean, boolean, boolean) IS
  'Updates the current administrator notification preferences.';

COMMIT;
