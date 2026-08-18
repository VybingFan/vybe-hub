-- V24.45B R1 - Back Office Work Assignment Security Foundation
BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_work_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id text NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text NULL,
  action_path text NULL,
  status text NOT NULL DEFAULT 'unassigned'
    CHECK (status IN ('unassigned','assigned','in_progress','waiting','completed','cancelled')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to uuid NULL,
  assigned_by uuid NULL,
  assigned_at timestamptz NULL,
  due_at timestamptz NULL,
  notes text NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  UNIQUE (source_type, source_id)
);

CREATE INDEX IF NOT EXISTS admin_work_items_status_idx
  ON public.admin_work_items(status, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_work_items_assigned_to_idx
  ON public.admin_work_items(assigned_to, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS admin_work_items_category_idx
  ON public.admin_work_items(category, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_work_item_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id uuid NOT NULL REFERENCES public.admin_work_items(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL,
  action text NOT NULL,
  from_status text NULL,
  to_status text NULL,
  from_assigned_to uuid NULL,
  to_assigned_to uuid NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_work_item_events_item_idx
  ON public.admin_work_item_events(work_item_id, created_at DESC);

ALTER TABLE public.admin_work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_work_item_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Administrators view work items" ON public.admin_work_items;
CREATE POLICY "Administrators view work items"
ON public.admin_work_items
FOR SELECT TO authenticated
USING (public.has_admin_permission(auth.uid(), 'admin.work_queue.read'));

DROP POLICY IF EXISTS "Administrators view work item events" ON public.admin_work_item_events;
CREATE POLICY "Administrators view work item events"
ON public.admin_work_item_events
FOR SELECT TO authenticated
USING (public.has_admin_permission(auth.uid(), 'admin.work_queue.read'));

-- Writes are intentionally RPC-only. No INSERT/UPDATE/DELETE RLS policies are granted.

CREATE OR REPLACE FUNCTION public.create_admin_work_item(
  p_source_type text,
  p_source_id text,
  p_category text,
  p_title text,
  p_description text DEFAULT NULL,
  p_action_path text DEFAULT NULL,
  p_priority text DEFAULT 'normal',
  p_due_at timestamptz DEFAULT NULL
)
RETURNS public.admin_work_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item public.admin_work_items;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_admin_permission(auth.uid(), 'admin.team.manage') THEN
    RAISE EXCEPTION 'Administrator management permission required';
  END IF;

  IF p_priority NOT IN ('low','normal','high','urgent') THEN
    RAISE EXCEPTION 'Invalid priority';
  END IF;

  INSERT INTO public.admin_work_items (
    source_type, source_id, category, title, description, action_path,
    priority, due_at, created_by
  )
  VALUES (
    btrim(p_source_type), nullif(btrim(p_source_id), ''), btrim(p_category),
    btrim(p_title), nullif(btrim(p_description), ''), nullif(btrim(p_action_path), ''),
    p_priority, p_due_at, auth.uid()
  )
  ON CONFLICT (source_type, source_id)
  DO UPDATE SET
    category = EXCLUDED.category,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    action_path = EXCLUDED.action_path,
    priority = EXCLUDED.priority,
    due_at = COALESCE(EXCLUDED.due_at, public.admin_work_items.due_at),
    updated_at = now()
  RETURNING * INTO v_item;

  INSERT INTO public.admin_work_item_events (
    work_item_id, actor_user_id, action, to_status, details
  )
  VALUES (
    v_item.id, auth.uid(), 'created_or_refreshed', v_item.status,
    jsonb_build_object('source_type', v_item.source_type, 'source_id', v_item.source_id)
  );

  RETURN v_item;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_admin_work_item(
  p_work_item_id uuid,
  p_assigned_to uuid
)
RETURNS public.admin_work_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before public.admin_work_items;
  v_after public.admin_work_items;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_admin_permission(auth.uid(), 'admin.team.manage') THEN
    RAISE EXCEPTION 'Administrator management permission required';
  END IF;

  IF p_assigned_to IS NULL OR NOT public.has_role(p_assigned_to, 'admin') THEN
    RAISE EXCEPTION 'Assignee must be an administrator';
  END IF;

  SELECT * INTO v_before
  FROM public.admin_work_items
  WHERE id = p_work_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Work item not found';
  END IF;

  IF v_before.status IN ('completed','cancelled') THEN
    RAISE EXCEPTION 'Completed or cancelled work cannot be reassigned';
  END IF;

  UPDATE public.admin_work_items
  SET assigned_to = p_assigned_to,
      assigned_by = auth.uid(),
      assigned_at = now(),
      status = CASE WHEN status = 'unassigned' THEN 'assigned' ELSE status END,
      updated_at = now()
  WHERE id = p_work_item_id
  RETURNING * INTO v_after;

  INSERT INTO public.admin_work_item_events (
    work_item_id, actor_user_id, action,
    from_status, to_status, from_assigned_to, to_assigned_to
  )
  VALUES (
    v_after.id, auth.uid(), 'assigned',
    v_before.status, v_after.status, v_before.assigned_to, v_after.assigned_to
  );

  RETURN v_after;
END;
$$;

CREATE OR REPLACE FUNCTION public.unassign_admin_work_item(p_work_item_id uuid)
RETURNS public.admin_work_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before public.admin_work_items;
  v_after public.admin_work_items;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT public.has_admin_permission(auth.uid(), 'admin.team.manage') THEN
    RAISE EXCEPTION 'Administrator management permission required';
  END IF;

  SELECT * INTO v_before
  FROM public.admin_work_items
  WHERE id = p_work_item_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Work item not found'; END IF;
  IF v_before.status IN ('completed','cancelled') THEN
    RAISE EXCEPTION 'Completed or cancelled work cannot be unassigned';
  END IF;

  UPDATE public.admin_work_items
  SET assigned_to = NULL,
      assigned_by = NULL,
      assigned_at = NULL,
      status = 'unassigned',
      updated_at = now()
  WHERE id = p_work_item_id
  RETURNING * INTO v_after;

  INSERT INTO public.admin_work_item_events (
    work_item_id, actor_user_id, action,
    from_status, to_status, from_assigned_to, to_assigned_to
  )
  VALUES (
    v_after.id, auth.uid(), 'unassigned',
    v_before.status, v_after.status, v_before.assigned_to, NULL
  );

  RETURN v_after;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_admin_work_item(
  p_work_item_id uuid,
  p_status text DEFAULT NULL,
  p_priority text DEFAULT NULL,
  p_due_at timestamptz DEFAULT NULL,
  p_clear_due_at boolean DEFAULT false,
  p_notes text DEFAULT NULL
)
RETURNS public.admin_work_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before public.admin_work_items;
  v_after public.admin_work_items;
  v_can_manage boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT * INTO v_before
  FROM public.admin_work_items
  WHERE id = p_work_item_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Work item not found'; END IF;

  v_can_manage := public.has_admin_permission(auth.uid(), 'admin.team.manage');

  IF NOT v_can_manage AND v_before.assigned_to IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the assignee or an administrator manager may update this work';
  END IF;

  IF v_before.status IN ('completed','cancelled') AND NOT v_can_manage THEN
    RAISE EXCEPTION 'Completed or cancelled work may only be reopened by an administrator manager';
  END IF;

  IF p_status IS NOT NULL
     AND p_status NOT IN ('assigned','in_progress','waiting','completed','cancelled') THEN
    RAISE EXCEPTION 'Invalid status transition target';
  END IF;

  IF p_status = 'assigned' AND v_before.assigned_to IS NULL THEN
    RAISE EXCEPTION 'Work must have an assignee before using assigned status';
  END IF;

  IF p_priority IS NOT NULL AND p_priority NOT IN ('low','normal','high','urgent') THEN
    RAISE EXCEPTION 'Invalid priority';
  END IF;

  IF NOT v_can_manage AND (p_priority IS NOT NULL OR p_due_at IS NOT NULL OR p_clear_due_at) THEN
    RAISE EXCEPTION 'Only an administrator manager may change priority or due date';
  END IF;

  UPDATE public.admin_work_items
  SET status = COALESCE(p_status, status),
      priority = COALESCE(p_priority, priority),
      due_at = CASE
        WHEN v_can_manage AND p_clear_due_at THEN NULL
        WHEN v_can_manage AND p_due_at IS NOT NULL THEN p_due_at
        ELSE due_at
      END,
      notes = COALESCE(NULLIF(btrim(p_notes), ''), notes),
      completed_at = CASE
        WHEN p_status = 'completed' THEN now()
        WHEN p_status IS NOT NULL AND p_status <> 'completed' THEN NULL
        ELSE completed_at
      END,
      updated_at = now()
  WHERE id = p_work_item_id
  RETURNING * INTO v_after;

  INSERT INTO public.admin_work_item_events (
    work_item_id, actor_user_id, action,
    from_status, to_status, from_assigned_to, to_assigned_to, details
  )
  VALUES (
    v_after.id, auth.uid(), 'updated',
    v_before.status, v_after.status, v_before.assigned_to, v_after.assigned_to,
    jsonb_build_object(
      'priority_before', v_before.priority,
      'priority_after', v_after.priority,
      'due_at_before', v_before.due_at,
      'due_at_after', v_after.due_at,
      'notes_changed', v_before.notes IS DISTINCT FROM v_after.notes
    )
  );

  RETURN v_after;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_admin_work_summary()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL OR NOT public.has_admin_permission(auth.uid(), 'admin.work_queue.read')
      THEN jsonb_build_object('authorized', false)
    ELSE jsonb_build_object(
      'authorized', true,
      'my_open', (
        SELECT count(*) FROM public.admin_work_items
        WHERE assigned_to = auth.uid()
          AND status IN ('assigned','in_progress','waiting')
      ),
      'my_urgent', (
        SELECT count(*) FROM public.admin_work_items
        WHERE assigned_to = auth.uid()
          AND priority = 'urgent'
          AND status IN ('assigned','in_progress','waiting')
      ),
      'unassigned', (
        SELECT count(*) FROM public.admin_work_items
        WHERE assigned_to IS NULL AND status = 'unassigned'
      ),
      'overdue', (
        SELECT count(*) FROM public.admin_work_items
        WHERE assigned_to = auth.uid()
          AND due_at IS NOT NULL
          AND due_at < now()
          AND status IN ('assigned','in_progress','waiting')
      )
    )
  END;
$$;

REVOKE ALL ON FUNCTION public.create_admin_work_item(text,text,text,text,text,text,text,timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_admin_work_item(uuid,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unassign_admin_work_item(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_admin_work_item(uuid,text,text,timestamptz,boolean,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_admin_work_summary() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_admin_work_item(text,text,text,text,text,text,text,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_admin_work_item(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unassign_admin_work_item(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_work_item(uuid,text,text,timestamptz,boolean,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_admin_work_summary() TO authenticated;

COMMIT;
