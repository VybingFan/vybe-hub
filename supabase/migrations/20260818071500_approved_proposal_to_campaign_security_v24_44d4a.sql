-- V24.44D4A - Approved Proposal to Campaign Security
BEGIN;

ALTER TABLE public.business_submissions
  ADD COLUMN linked_campaign_id uuid REFERENCES public.business_campaigns(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX business_submissions_linked_campaign_unique_idx
  ON public.business_submissions (linked_campaign_id)
  WHERE linked_campaign_id IS NOT NULL;

CREATE TABLE public.business_submission_campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.business_submissions(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.business_campaigns(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action text NOT NULL DEFAULT 'campaign_created' CHECK (action = 'campaign_created'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX business_submission_campaign_events_submission_unique_idx
  ON public.business_submission_campaign_events (submission_id);

ALTER TABLE public.business_submission_campaign_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.business_submission_campaign_events TO authenticated;
GRANT ALL ON public.business_submission_campaign_events TO service_role;

CREATE POLICY "Business administrators view submission campaign events"
ON public.business_submission_campaign_events
FOR SELECT TO authenticated
USING (public.has_admin_permission(auth.uid(), 'admin.business.read'));

CREATE OR REPLACE FUNCTION public.create_campaign_from_business_submission(p_submission_id uuid)
RETURNS public.business_campaigns
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission public.business_submissions;
  v_campaign public.business_campaigns;
  v_package_code text;
  v_verification_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_admin_permission(auth.uid(), 'admin.business.manage') THEN
    RAISE EXCEPTION 'Business management permission required';
  END IF;

  SELECT * INTO v_submission
  FROM public.business_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Business submission not found'; END IF;
  IF v_submission.request_type <> 'campaign_proposal' THEN
    RAISE EXCEPTION 'Only campaign proposals can create campaigns';
  END IF;
  IF v_submission.status <> 'approved' THEN
    RAISE EXCEPTION 'Only approved campaign proposals can create campaigns';
  END IF;
  IF v_submission.linked_campaign_id IS NOT NULL THEN
    RAISE EXCEPTION 'This proposal is already linked to a campaign';
  END IF;

  SELECT b.package_code, b.verification_status
  INTO v_package_code, v_verification_status
  FROM public.business_profiles b
  WHERE b.id = v_submission.business_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Business profile not found'; END IF;
  IF v_verification_status <> 'verified' THEN
    RAISE EXCEPTION 'Business must remain verified before campaign creation';
  END IF;

  INSERT INTO public.business_campaigns (business_id, package_code, name, objective)
  VALUES (v_submission.business_id, v_package_code, v_submission.title, v_submission.summary)
  RETURNING * INTO v_campaign;

  UPDATE public.business_submissions
  SET linked_campaign_id = v_campaign.id, updated_at = now()
  WHERE id = v_submission.id;

  INSERT INTO public.business_submission_campaign_events
    (submission_id, business_id, campaign_id, actor_user_id)
  VALUES
    (v_submission.id, v_submission.business_id, v_campaign.id, auth.uid());

  RETURN v_campaign;
END;
$$;

REVOKE ALL ON FUNCTION public.create_campaign_from_business_submission(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_campaign_from_business_submission(uuid) TO authenticated;

COMMENT ON COLUMN public.business_submissions.linked_campaign_id IS
  'Operations-created campaign linked to an approved external campaign proposal.';
COMMENT ON TABLE public.business_submission_campaign_events IS
  'Immutable record of approved Business Portal campaign proposals converted into Operations campaign records.';
COMMENT ON FUNCTION public.create_campaign_from_business_submission(uuid) IS
  'Creates one draft Operations campaign from one approved campaign proposal. Requires admin.business.manage.';

COMMIT;
