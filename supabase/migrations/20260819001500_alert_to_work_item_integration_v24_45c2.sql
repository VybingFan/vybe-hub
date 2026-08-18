-- V24.45C2 - Convert active Back Office alerts into durable work items
BEGIN;

CREATE OR REPLACE FUNCTION public.sync_admin_notifications_to_work_items()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer := 0;
  v_refreshed integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_admin_permission(auth.uid(), 'admin.work_queue.read') THEN
    RAISE EXCEPTION 'Work queue read permission required';
  END IF;

  WITH active_notifications AS (
    SELECT
      n.id,
      coalesce(nullif(btrim(n.category), ''), 'general_operations') AS category,
      n.title,
      n.message,
      n.action_path,
      CASE
        WHEN n.priority IN ('low','normal','high','urgent') THEN n.priority
        ELSE 'normal'
      END AS priority
    FROM public.admin_notifications n
    WHERE n.status IN ('unread','read')
  ),
  inserted AS (
    INSERT INTO public.admin_work_items (
      source_type,
      source_id,
      category,
      title,
      description,
      action_path,
      status,
      priority,
      created_by
    )
    SELECT
      'admin_notification',
      a.id::text,
      a.category,
      a.title,
      a.message,
      a.action_path,
      'unassigned',
      a.priority,
      auth.uid()
    FROM active_notifications a
    ON CONFLICT (source_type, source_id) DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_inserted FROM inserted;

  WITH active_notifications AS (
    SELECT
      n.id,
      coalesce(nullif(btrim(n.category), ''), 'general_operations') AS category,
      n.title,
      n.message,
      n.action_path,
      CASE
        WHEN n.priority IN ('low','normal','high','urgent') THEN n.priority
        ELSE 'normal'
      END AS priority
    FROM public.admin_notifications n
    WHERE n.status IN ('unread','read')
  ),
  refreshed AS (
    UPDATE public.admin_work_items w
    SET
      category = a.category,
      title = a.title,
      description = a.message,
      action_path = a.action_path,
      priority = CASE
        WHEN w.status = 'unassigned' THEN a.priority
        ELSE w.priority
      END,
      updated_at = CASE
        WHEN w.category IS DISTINCT FROM a.category
          OR w.title IS DISTINCT FROM a.title
          OR w.description IS DISTINCT FROM a.message
          OR w.action_path IS DISTINCT FROM a.action_path
          OR (w.status = 'unassigned' AND w.priority IS DISTINCT FROM a.priority)
        THEN now()
        ELSE w.updated_at
      END
    FROM active_notifications a
    WHERE w.source_type = 'admin_notification'
      AND w.source_id = a.id::text
    RETURNING w.id
  )
  SELECT count(*) INTO v_refreshed FROM refreshed;

  INSERT INTO public.admin_work_item_events (
    work_item_id,
    actor_user_id,
    action,
    to_status,
    details
  )
  SELECT
    w.id,
    auth.uid(),
    'alert_synced',
    w.status,
    jsonb_build_object('notification_id', w.source_id)
  FROM public.admin_work_items w
  WHERE w.source_type = 'admin_notification'
    AND w.created_at = w.updated_at
    AND w.created_at >= now() - interval '5 seconds';

  RETURN jsonb_build_object(
    'inserted', v_inserted,
    'refreshed', v_refreshed
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sync_admin_notifications_to_work_items() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_admin_notifications_to_work_items() TO authenticated;

COMMENT ON FUNCTION public.sync_admin_notifications_to_work_items() IS
  'Creates or refreshes durable Back Office work items from active admin_notifications without weakening existing assignment security.';

COMMIT;
