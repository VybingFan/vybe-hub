-- V24.44D2A — Business Submission Security Foundation
BEGIN;

CREATE TABLE public.business_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('campaign_proposal','offer_proposal','sponsorship_placement','creative_brief')),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 180),
  summary text NOT NULL CHECK (length(btrim(summary)) BETWEEN 1 AND 4000),
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(request_payload) = 'object'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','approved','declined','withdrawn')),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE RESTRICT,
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  business_response text,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((status = 'draft' AND submitted_at IS NULL) OR (status <> 'draft' AND submitted_at IS NOT NULL)),
  CHECK ((reviewed_at IS NULL AND reviewed_by IS NULL) OR (reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL))
);

CREATE INDEX business_submissions_business_created_idx ON public.business_submissions (business_id, created_at DESC);
CREATE INDEX business_submissions_status_created_idx ON public.business_submissions (status, created_at DESC);
CREATE INDEX business_submissions_type_created_idx ON public.business_submissions (request_type, created_at DESC);

ALTER TABLE public.business_submissions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_submissions TO authenticated;
GRANT ALL ON public.business_submissions TO service_role;

CREATE POLICY "Business owners view their submissions" ON public.business_submissions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'business') AND EXISTS (SELECT 1 FROM public.business_profiles b WHERE b.id = business_submissions.business_id AND b.owner_user_id = auth.uid()));

CREATE POLICY "Business owners create draft submissions" ON public.business_submissions FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'business') AND created_by = auth.uid() AND status = 'draft'
  AND submitted_at IS NULL AND reviewed_by IS NULL AND reviewed_at IS NULL
  AND business_response IS NULL AND internal_notes IS NULL
  AND EXISTS (SELECT 1 FROM public.business_profiles b WHERE b.id = business_submissions.business_id AND b.owner_user_id = auth.uid())
);

CREATE POLICY "Business owners edit draft submissions" ON public.business_submissions FOR UPDATE TO authenticated
USING (
  status = 'draft' AND created_by = auth.uid() AND public.has_role(auth.uid(), 'business')
  AND EXISTS (SELECT 1 FROM public.business_profiles b WHERE b.id = business_submissions.business_id AND b.owner_user_id = auth.uid())
)
WITH CHECK (
  status = 'draft' AND created_by = auth.uid() AND submitted_at IS NULL
  AND reviewed_by IS NULL AND reviewed_at IS NULL AND business_response IS NULL AND internal_notes IS NULL
  AND public.has_role(auth.uid(), 'business')
  AND EXISTS (SELECT 1 FROM public.business_profiles b WHERE b.id = business_submissions.business_id AND b.owner_user_id = auth.uid())
);

CREATE POLICY "Business owners delete draft submissions" ON public.business_submissions FOR DELETE TO authenticated
USING (
  status = 'draft' AND created_by = auth.uid() AND public.has_role(auth.uid(), 'business')
  AND EXISTS (SELECT 1 FROM public.business_profiles b WHERE b.id = business_submissions.business_id AND b.owner_user_id = auth.uid())
);

CREATE POLICY "Business administrators view submissions" ON public.business_submissions FOR SELECT TO authenticated
USING (public.has_admin_permission(auth.uid(), 'admin.business.read'));

CREATE POLICY "Business administrators manage submissions" ON public.business_submissions FOR ALL TO authenticated
USING (public.has_admin_permission(auth.uid(), 'admin.business.manage'))
WITH CHECK (public.has_admin_permission(auth.uid(), 'admin.business.manage'));

CREATE OR REPLACE FUNCTION public.submit_my_business_submission(p_submission_id uuid)
RETURNS public.business_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission public.business_submissions;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT public.has_role(auth.uid(), 'business') THEN RAISE EXCEPTION 'Business account required'; END IF;

  SELECT s.* INTO v_submission
  FROM public.business_submissions s
  JOIN public.business_profiles b ON b.id = s.business_id
  WHERE s.id = p_submission_id AND s.status = 'draft' AND s.created_by = auth.uid() AND b.owner_user_id = auth.uid()
  FOR UPDATE OF s;

  IF NOT FOUND THEN RAISE EXCEPTION 'Submission not found or not available to submit'; END IF;

  UPDATE public.business_submissions
  SET status = 'submitted', submitted_at = now(), updated_at = now()
  WHERE id = p_submission_id
  RETURNING * INTO v_submission;

  RETURN v_submission;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_my_business_submission(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_my_business_submission(uuid) TO authenticated;

COMMENT ON TABLE public.business_submissions IS 'External Business Portal draft/submission layer. Operational campaigns, offers, creatives, placements, reports, and approvals remain controlled by VYBE Operations.';
COMMENT ON FUNCTION public.submit_my_business_submission(uuid) IS 'Safely submits the authenticated business owner''s draft without granting direct status-update authority.';

COMMIT;
