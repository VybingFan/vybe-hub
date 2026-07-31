-- V24.24: internal business pilot operations for a controlled 3-5 partner pilot.

ALTER TABLE public.admin_notifications
  DROP CONSTRAINT admin_notifications_category_check;

ALTER TABLE public.admin_notifications
  ADD CONSTRAINT admin_notifications_category_check CHECK (category IN (
    'business_application', 'campaign_review', 'creative_review',
    'document_review', 'pilot_follow_up', 'pilot_blocker',
    'rights', 'moderation', 'membership', 'system'
  ));

CREATE TABLE public.business_pilot_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'prospect' CHECK (stage IN (
    'prospect', 'contacted', 'applied', 'qualified', 'onboarding',
    'campaign_ready', 'pilot_active', 'reporting', 'completed',
    'paused', 'declined'
  )),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  next_action text,
  follow_up_at timestamptz,
  qualification_status text NOT NULL DEFAULT 'not_started' CHECK (
    qualification_status IN ('not_started', 'in_progress', 'complete', 'blocked')
  ),
  onboarding_status text NOT NULL DEFAULT 'not_started' CHECK (
    onboarding_status IN ('not_started', 'in_progress', 'complete', 'blocked')
  ),
  pilot_notes text,
  blockers text,
  decisions text,
  outcomes text,
  paused_declined_reason text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX business_pilot_stage_follow_up_idx
  ON public.business_pilot_records(stage, follow_up_at);
CREATE INDEX business_pilot_assignee_idx
  ON public.business_pilot_records(assigned_to, stage);

CREATE TABLE public.business_pilot_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id uuid NOT NULL REFERENCES public.business_pilot_records(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN (
    'call', 'email', 'meeting', 'note', 'application', 'qualification',
    'document', 'campaign', 'decision', 'outcome', 'follow_up'
  )),
  summary text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  next_action text,
  follow_up_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX business_pilot_activity_history_idx
  ON public.business_pilot_activities(pilot_id, occurred_at DESC);

GRANT ALL ON public.business_pilot_records, public.business_pilot_activities TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.business_pilot_records, public.business_pilot_activities TO authenticated;

ALTER TABLE public.business_pilot_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_pilot_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage business pilot records"
  ON public.business_pilot_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage business pilot activities"
  ON public.business_pilot_activities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.audit_business_pilot_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  change_details jsonb := '{}'::jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    change_details := jsonb_build_object('stage', NEW.stage, 'assigned_to', NEW.assigned_to);
  ELSE
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
      change_details := change_details || jsonb_build_object(
        'stage_from', OLD.stage, 'stage_to', NEW.stage
      );
    END IF;
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      change_details := change_details || jsonb_build_object(
        'assigned_from', OLD.assigned_to, 'assigned_to', NEW.assigned_to
      );
    END IF;
  END IF;

  IF TG_OP = 'INSERT' OR change_details <> '{}'::jsonb THEN
    INSERT INTO public.business_audit_log (
      business_id, actor_user_id, action, entity_type, entity_id, details
    ) VALUES (
      NEW.business_id,
      COALESCE(auth.uid(), NEW.created_by),
      CASE WHEN TG_OP = 'INSERT' THEN 'pilot_record_created' ELSE 'pilot_control_changed' END,
      'business_pilot_record',
      NEW.id::text,
      change_details
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_business_pilot_record
  AFTER INSERT OR UPDATE OF stage, assigned_to ON public.business_pilot_records
  FOR EACH ROW EXECUTE FUNCTION public.audit_business_pilot_change();

CREATE OR REPLACE FUNCTION public.sync_business_pilot_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  INSERT INTO public.admin_notifications (
    category, priority, title, message, entity_type, entity_id, action_path
  )
  SELECT
    'pilot_follow_up',
    CASE WHEN p.follow_up_at < now() - interval '3 days' THEN 'urgent' ELSE 'high' END,
    'Pilot follow-up overdue',
    b.public_name || ': ' || COALESCE(p.next_action, 'Follow-up action required.'),
    'business_pilot_record',
    p.id::text,
    '/admin/businesses'
  FROM public.business_pilot_records p
  JOIN public.business_profiles b ON b.id = p.business_id
  WHERE p.follow_up_at < now()
    AND p.stage NOT IN ('completed', 'declined')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.admin_notifications (
    category, priority, title, message, entity_type, entity_id, action_path
  )
  SELECT
    'pilot_blocker',
    'high',
    'Pilot onboarding blocked',
    b.public_name || ': ' || left(p.blockers, 220),
    'business_pilot_record',
    p.id::text,
    '/admin/businesses'
  FROM public.business_pilot_records p
  JOIN public.business_profiles b ON b.id = p.business_id
  WHERE nullif(trim(p.blockers), '') IS NOT NULL
    AND p.stage NOT IN ('completed', 'declined')
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_business_pilot_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  PERFORM public.sync_business_pilot_notifications();

  SELECT COALESCE(jsonb_agg(to_jsonb(row_data) ORDER BY row_data.updated_at DESC), '[]'::jsonb)
  INTO result
  FROM (
    SELECT
      p.id,
      p.business_id,
      b.public_name AS business_name,
      b.contact_name,
      b.contact_email,
      b.verification_status,
      b.package_code,
      p.stage,
      p.assigned_to,
      COALESCE(u.raw_user_meta_data->>'display_name', u.email) AS assigned_name,
      p.next_action,
      p.follow_up_at,
      p.qualification_status,
      p.onboarding_status,
      p.pilot_notes,
      p.blockers,
      p.decisions,
      p.outcomes,
      p.paused_declined_reason,
      p.started_at,
      p.completed_at,
      p.updated_at,
      (
        SELECT count(*)::integer
        FROM public.business_partner_documents d
        WHERE d.business_id = b.id
          AND d.document_type IN (
            'application', 'qualification_review', 'preview_terms', 'annual_agreement',
            'campaign_brief', 'asset_checklist', 'tracking_plan'
          )
          AND d.status IN ('approved', 'signed')
      ) AS completed_documents,
      7 AS required_documents,
      round(100.0 * (
        SELECT count(*)
        FROM public.business_partner_documents d
        WHERE d.business_id = b.id
          AND d.document_type IN (
            'application', 'qualification_review', 'preview_terms', 'annual_agreement',
            'campaign_brief', 'asset_checklist', 'tracking_plan'
          )
          AND d.status IN ('approved', 'signed')
      ) / 7)::integer AS document_completion_percent,
      (
        (CASE WHEN b.verification_status = 'verified' THEN 20 ELSE 0 END) +
        (CASE WHEN b.package_code IS NOT NULL THEN 10 ELSE 0 END) +
        (CASE WHEN EXISTS (
          SELECT 1 FROM public.business_campaigns c
          WHERE c.business_id = b.id AND c.status IN ('approved', 'scheduled', 'active')
        ) THEN 20 ELSE 0 END) +
        (CASE WHEN EXISTS (
          SELECT 1 FROM public.business_campaigns c
          JOIN public.business_campaign_creatives cr ON cr.campaign_id = c.id
          WHERE c.business_id = b.id AND cr.status = 'approved'
        ) THEN 15 ELSE 0 END) +
        (CASE WHEN EXISTS (
          SELECT 1 FROM public.business_campaigns c
          JOIN public.business_campaign_placements pl ON pl.campaign_id = c.id
          WHERE c.business_id = b.id AND pl.status IN ('approved', 'scheduled', 'active')
        ) THEN 20 ELSE 0 END) +
        (CASE WHEN EXISTS (
          SELECT 1 FROM public.business_partner_documents d
          WHERE d.business_id = b.id AND d.document_type = 'tracking_plan'
            AND d.status IN ('approved', 'signed')
        ) THEN 15 ELSE 0 END)
      )::integer AS campaign_readiness_score,
      (SELECT count(*)::integer FROM public.business_pilot_activities a WHERE a.pilot_id = p.id)
        AS activity_count
    FROM public.business_pilot_records p
    JOIN public.business_profiles b ON b.id = p.business_id
    LEFT JOIN auth.users u ON u.id = p.assigned_to
  ) row_data;

  RETURN jsonb_build_object(
    'generated_at', now(),
    'pilot_count', (SELECT count(*) FROM public.business_pilot_records),
    'active_count', (
      SELECT count(*) FROM public.business_pilot_records
      WHERE stage NOT IN ('completed', 'declined', 'paused')
    ),
    'overdue_count', (
      SELECT count(*) FROM public.business_pilot_records
      WHERE follow_up_at < now() AND stage NOT IN ('completed', 'declined')
    ),
    'blocked_count', (
      SELECT count(*) FROM public.business_pilot_records
      WHERE nullif(trim(blockers), '') IS NOT NULL AND stage NOT IN ('completed', 'declined')
    ),
    'records', result
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sync_business_pilot_notifications() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_business_pilot_dashboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_business_pilot_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_pilot_dashboard() TO authenticated;
