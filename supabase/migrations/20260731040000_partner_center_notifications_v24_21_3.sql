-- V24.21.3: route Partner Center document activity into the Back Office queue.

CREATE OR REPLACE FUNCTION public.notify_admin_partner_document()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  business_name text;
BEGIN
  IF NEW.status NOT IN ('requested', 'received', 'expired') THEN
    RETURN NEW;
  END IF;

  SELECT public_name INTO business_name
  FROM public.business_profiles
  WHERE id = NEW.business_id;

  INSERT INTO public.admin_notifications (
    category, priority, title, message, entity_type, entity_id, action_path
  ) VALUES (
    'document_review',
    CASE WHEN NEW.status = 'expired' THEN 'high' ELSE 'normal' END,
    CASE
      WHEN NEW.status = 'received' THEN 'Partner document received'
      WHEN NEW.status = 'expired' THEN 'Partner document expired'
      ELSE 'Partner document requested'
    END,
    coalesce(business_name, 'A business partner') || ': ' || NEW.title,
    'business_partner_document',
    NEW.id::text,
    '/admin/partner-center'
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_admin_on_partner_document_insert
  AFTER INSERT ON public.business_partner_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_partner_document();

CREATE TRIGGER notify_admin_on_partner_document_status
  AFTER UPDATE OF status ON public.business_partner_documents
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_admin_partner_document();
