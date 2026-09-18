-- VYBE V24.78B
-- Route serious rights reports into the Back Office Work Queue.

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
    'Copyright / ownership report requires review',
    concat(
      'Rights owner: ', NEW.rights_owner_name,
      '. Reported VYBE content: ', NEW.content_url
    ),
    '/admin/rights',
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

DROP TRIGGER IF EXISTS queue_copyright_report_for_admin_review
ON public.copyright_reports;
CREATE TRIGGER queue_copyright_report_for_admin_review
AFTER INSERT ON public.copyright_reports
FOR EACH ROW
EXECUTE FUNCTION public.queue_copyright_report_for_admin_review();

COMMIT;
