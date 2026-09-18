-- VYBE V24.79A
-- Creator Help Center + support ticket foundation.

BEGIN;

ALTER TABLE public.creator_support_requests
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS waiting_on text,
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.creator_support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.creator_support_requests(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_role text NOT NULL CHECK (author_role IN ('creator','admin','system')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creator_support_messages_request_created_idx
  ON public.creator_support_messages(request_id, created_at);

ALTER TABLE public.creator_support_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "creator support admin read" ON public.creator_support_requests;
CREATE POLICY "creator support admin read"
ON public.creator_support_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "creator support admin update" ON public.creator_support_requests;
CREATE POLICY "creator support admin update"
ON public.creator_support_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "creator support messages own read" ON public.creator_support_messages;
CREATE POLICY "creator support messages own read"
ON public.creator_support_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.creator_support_requests request
    WHERE request.id = request_id
      AND request.creator_user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "creator support messages admin read" ON public.creator_support_messages;
CREATE POLICY "creator support messages admin read"
ON public.creator_support_messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "creator support messages creator insert" ON public.creator_support_messages;
CREATE POLICY "creator support messages creator insert"
ON public.creator_support_messages
FOR INSERT
TO authenticated
WITH CHECK (
  author_user_id = auth.uid()
  AND author_role = 'creator'
  AND EXISTS (
    SELECT 1
    FROM public.creator_support_requests request
    WHERE request.id = request_id
      AND request.creator_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "creator support messages admin insert" ON public.creator_support_messages;
CREATE POLICY "creator support messages admin insert"
ON public.creator_support_messages
FOR INSERT
TO authenticated
WITH CHECK (
  author_user_id = auth.uid()
  AND author_role = 'admin'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
CREATE OR REPLACE FUNCTION public.escalate_creator_support_request(
  p_request_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS public.admin_work_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  actor_id uuid := auth.uid();
  support_request public.creator_support_requests;
  work_item public.admin_work_items;
BEGIN
  IF actor_id IS NULL OR NOT public.has_role(actor_id, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  SELECT *
  INTO support_request
  FROM public.creator_support_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF support_request.id IS NULL THEN
    RAISE EXCEPTION 'Support ticket not found';
  END IF;

  INSERT INTO public.admin_work_items (
    source_type, source_id, category, title, description,
    action_path, status, priority, due_at, created_by
  )
  VALUES (
    'creator_support_request',
    support_request.id::text,
    'support_escalation',
    concat('Creator support escalation: ', support_request.subject),
    COALESCE(NULLIF(trim(p_reason), ''), support_request.details),
    concat('/admin/support?ticket=', support_request.id::text),
    'unassigned',
    CASE WHEN support_request.priority = 'priority' THEN 'high' ELSE 'normal' END,
    now() + interval '1 day',
    actor_id
  )
  ON CONFLICT (source_type, source_id)
  DO UPDATE SET
    description = EXCLUDED.description,
    action_path = EXCLUDED.action_path,
    priority = EXCLUDED.priority,
    due_at = EXCLUDED.due_at,
    status = CASE
      WHEN public.admin_work_items.status IN ('completed','cancelled') THEN 'unassigned'
      ELSE public.admin_work_items.status
    END,
    completed_at = CASE
      WHEN public.admin_work_items.status IN ('completed','cancelled') THEN NULL
      ELSE public.admin_work_items.completed_at
    END,
    updated_at = now()
  RETURNING * INTO work_item;

  UPDATE public.creator_support_requests
  SET escalated_at = COALESCE(escalated_at, now()), updated_at = now()
  WHERE id = support_request.id;

  RETURN work_item;
END;
$function$;
REVOKE ALL ON FUNCTION public.escalate_creator_support_request(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.escalate_creator_support_request(uuid,text)
TO authenticated, service_role;

COMMIT;
