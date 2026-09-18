-- VYBE V24.78E
-- Deep-link copyright Work Queue items to the exact focused report review.

BEGIN;

CREATE OR REPLACE FUNCTION public.queue_copyright_report_for_admin_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
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
    'copyright_report',
    NEW.id::text,
    'rights_ownership',
    concat('Rights report: ', NEW.rights_owner_name),
    concat(
      'Copyright / ownership report from ', NEW.reporter_name,
      ' regarding ', NEW.content_url
    ),
    concat('/admin/rights?report=', NEW.id::text),
    'unassigned',
    'high',
    now() + interval '1 day',
    auth.uid()
  )
  ON CONFLICT (source_type, source_id)
  DO UPDATE SET
    category = EXCLUDED.category,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    action_path = EXCLUDED.action_path,
    priority = 'high',
    due_at = LEAST(
      COALESCE(public.admin_work_items.due_at, EXCLUDED.due_at),
      EXCLUDED.due_at
    ),
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
    updated_at = now();

  RETURN NEW;
END;
$function$;

UPDATE public.admin_work_items awi
SET
  title = concat('Rights report: ', cr.rights_owner_name),
  description = concat(
    'Copyright / ownership report from ', cr.reporter_name,
    ' regarding ', cr.content_url
  ),
  action_path = concat('/admin/rights?report=', cr.id::text),
  updated_at = now()
FROM public.copyright_reports cr
WHERE awi.source_type = 'copyright_report'
  AND awi.source_id = cr.id::text;

COMMIT;
