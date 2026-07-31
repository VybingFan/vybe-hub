-- V24.21.1: database-backed Back Office notifications and work queue.

CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN (
    'business_application', 'campaign_review', 'creative_review',
    'document_review', 'rights', 'moderation', 'membership', 'system'
  )),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  title text NOT NULL,
  message text NOT NULL,
  entity_type text,
  entity_id text,
  action_path text NOT NULL,
  status text NOT NULL DEFAULT 'unread'
    CHECK (status IN ('unread', 'read', 'resolved', 'dismissed')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (category, entity_type, entity_id, status)
);

GRANT ALL ON public.admin_notifications TO service_role;
GRANT SELECT, UPDATE ON public.admin_notifications TO authenticated;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view work queue notifications"
  ON public.admin_notifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update work queue notifications"
  ON public.admin_notifications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.notify_admin_business_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (
    category, priority, title, message, entity_type, entity_id, action_path
  ) VALUES (
    'business_application',
    'high',
    'New business application',
    NEW.public_name || ' submitted a business partnership application.',
    'business_profile',
    NEW.id::text,
    '/admin/businesses'
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_admin_on_business_application
  AFTER INSERT ON public.business_profiles
  FOR EACH ROW
  WHEN (NEW.verification_status = 'pending')
  EXECUTE FUNCTION public.notify_admin_business_application();

INSERT INTO public.admin_notifications (
  category, priority, title, message, entity_type, entity_id, action_path
)
SELECT
  'business_application',
  'high',
  'Pending business application',
  b.public_name || ' is waiting for business verification.',
  'business_profile',
  b.id::text,
  '/admin/businesses'
FROM public.business_profiles b
WHERE b.verification_status = 'pending'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_admin_work_queue_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  RETURN jsonb_build_object(
    'generated_at', now(),
    'unread', (SELECT count(*) FROM public.admin_notifications WHERE status = 'unread'),
    'urgent', (SELECT count(*) FROM public.admin_notifications WHERE status = 'unread' AND priority = 'urgent'),
    'business_applications', (
      SELECT count(*) FROM public.business_profiles WHERE verification_status = 'pending'
    ),
    'campaign_reviews', (
      SELECT count(*) FROM public.business_campaigns
      WHERE status IN ('submitted', 'under_review', 'changes_requested')
    ),
    'creative_reviews', (
      SELECT count(*) FROM public.business_campaign_creatives
      WHERE status IN ('submitted', 'changes_requested')
    ),
    'document_reviews', (
      SELECT count(*) FROM public.business_partner_documents
      WHERE status IN ('requested', 'received')
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_work_queue_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_work_queue_summary() TO authenticated;
