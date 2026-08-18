-- V24.44D2A1 - Verified Business Submission Gate
-- Hardens the D2A submission boundary before Business Portal write UI is connected.

BEGIN;

DROP POLICY IF EXISTS "Business owners create draft submissions" ON public.business_submissions;
CREATE POLICY "Business owners create draft submissions"
ON public.business_submissions
FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'business')
  AND created_by = auth.uid()
  AND status = 'draft'
  AND submitted_at IS NULL
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND business_response IS NULL
  AND internal_notes IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.business_profiles b
    WHERE b.id = business_submissions.business_id
      AND b.owner_user_id = auth.uid()
      AND b.verification_status = 'verified'
  )
);

DROP POLICY IF EXISTS "Business owners edit draft submissions" ON public.business_submissions;
CREATE POLICY "Business owners edit draft submissions"
ON public.business_submissions
FOR UPDATE TO authenticated
USING (
  status = 'draft'
  AND created_by = auth.uid()
  AND public.has_role(auth.uid(), 'business')
  AND EXISTS (
    SELECT 1
    FROM public.business_profiles b
    WHERE b.id = business_submissions.business_id
      AND b.owner_user_id = auth.uid()
      AND b.verification_status = 'verified'
  )
)
WITH CHECK (
  status = 'draft'
  AND created_by = auth.uid()
  AND submitted_at IS NULL
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND business_response IS NULL
  AND internal_notes IS NULL
  AND public.has_role(auth.uid(), 'business')
  AND EXISTS (
    SELECT 1
    FROM public.business_profiles b
    WHERE b.id = business_submissions.business_id
      AND b.owner_user_id = auth.uid()
      AND b.verification_status = 'verified'
  )
);

DROP POLICY IF EXISTS "Business owners delete draft submissions" ON public.business_submissions;
CREATE POLICY "Business owners delete draft submissions"
ON public.business_submissions
FOR DELETE TO authenticated
USING (
  status = 'draft'
  AND created_by = auth.uid()
  AND public.has_role(auth.uid(), 'business')
  AND EXISTS (
    SELECT 1
    FROM public.business_profiles b
    WHERE b.id = business_submissions.business_id
      AND b.owner_user_id = auth.uid()
      AND b.verification_status = 'verified'
  )
);

CREATE OR REPLACE FUNCTION public.submit_my_business_submission(p_submission_id uuid)
RETURNS public.business_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission public.business_submissions;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_role(auth.uid(), 'business') THEN
    RAISE EXCEPTION 'Business account required';
  END IF;

  SELECT s.*
  INTO v_submission
  FROM public.business_submissions s
  JOIN public.business_profiles b ON b.id = s.business_id
  WHERE s.id = p_submission_id
    AND s.status = 'draft'
    AND s.created_by = auth.uid()
    AND b.owner_user_id = auth.uid()
    AND b.verification_status = 'verified'
  FOR UPDATE OF s;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or business is not verified';
  END IF;

  UPDATE public.business_submissions
  SET status = 'submitted',
      submitted_at = now(),
      updated_at = now()
  WHERE id = p_submission_id
  RETURNING * INTO v_submission;

  RETURN v_submission;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_my_business_submission(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_my_business_submission(uuid) TO authenticated;

COMMENT ON FUNCTION public.submit_my_business_submission(uuid) IS
  'Submits only an owned draft belonging to the authenticated verified business owner.';

COMMIT;
