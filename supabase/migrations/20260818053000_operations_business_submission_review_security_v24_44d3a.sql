-- V24.44D3A - Operations Business Submission Review Security
BEGIN;

-- Audit every controlled Operations review action.
CREATE TABLE public.business_submission_review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.business_submissions(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('start_review','approve','decline','update_response','update_internal_notes')),
  from_status text NOT NULL CHECK (from_status IN ('submitted','under_review','approved','declined')),
  to_status text NOT NULL CHECK (to_status IN ('submitted','under_review','approved','declined')),
  business_response text,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX business_submission_review_events_submission_created_idx
  ON public.business_submission_review_events (submission_id, created_at DESC);
CREATE INDEX business_submission_review_events_business_created_idx
  ON public.business_submission_review_events (business_id, created_at DESC);

ALTER TABLE public.business_submission_review_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.business_submission_review_events TO authenticated;
GRANT ALL ON public.business_submission_review_events TO service_role;

CREATE POLICY "Business administrators view submission review events"
ON public.business_submission_review_events
FOR SELECT TO authenticated
USING (public.has_admin_permission(auth.uid(), 'admin.business.read'));

-- Staff may read submissions through RLS, but review mutations now go only through the controlled RPC below.
DROP POLICY IF EXISTS "Business administrators manage submissions" ON public.business_submissions;

CREATE OR REPLACE FUNCTION public.review_business_submission(
  p_submission_id uuid,
  p_action text,
  p_business_response text DEFAULT NULL,
  p_internal_notes text DEFAULT NULL
)
RETURNS public.business_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before public.business_submissions;
  v_after public.business_submissions;
  v_to_status text;
  v_response text;
  v_notes text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_admin_permission(auth.uid(), 'admin.business.manage') THEN
    RAISE EXCEPTION 'Business management permission required';
  END IF;

  IF p_action NOT IN ('start_review','approve','decline','update_response','update_internal_notes') THEN
    RAISE EXCEPTION 'Unsupported review action';
  END IF;

  SELECT *
  INTO v_before
  FROM public.business_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business submission not found';
  END IF;

  IF v_before.status = 'draft' THEN
    RAISE EXCEPTION 'Draft submissions cannot be reviewed';
  END IF;

  IF v_before.status = 'withdrawn' THEN
    RAISE EXCEPTION 'Withdrawn submissions cannot be reviewed';
  END IF;

  v_to_status := v_before.status;
  v_response := v_before.business_response;
  v_notes := v_before.internal_notes;

  IF p_action = 'start_review' THEN
    IF v_before.status <> 'submitted' THEN
      RAISE EXCEPTION 'Only submitted requests can enter review';
    END IF;
    v_to_status := 'under_review';

  ELSIF p_action = 'approve' THEN
    IF v_before.status <> 'under_review' THEN
      RAISE EXCEPTION 'Only requests under review can be approved';
    END IF;
    v_to_status := 'approved';
    IF p_business_response IS NOT NULL THEN
      v_response := NULLIF(btrim(p_business_response), '');
    END IF;
    IF p_internal_notes IS NOT NULL THEN
      v_notes := NULLIF(btrim(p_internal_notes), '');
    END IF;

  ELSIF p_action = 'decline' THEN
    IF v_before.status <> 'under_review' THEN
      RAISE EXCEPTION 'Only requests under review can be declined';
    END IF;
    v_to_status := 'declined';
    IF p_business_response IS NOT NULL THEN
      v_response := NULLIF(btrim(p_business_response), '');
    END IF;
    IF p_internal_notes IS NOT NULL THEN
      v_notes := NULLIF(btrim(p_internal_notes), '');
    END IF;

  ELSIF p_action = 'update_response' THEN
    IF v_before.status NOT IN ('under_review','approved','declined') THEN
      RAISE EXCEPTION 'Business response can only be updated after review begins';
    END IF;
    v_response := NULLIF(btrim(coalesce(p_business_response, '')), '');

  ELSIF p_action = 'update_internal_notes' THEN
    IF v_before.status NOT IN ('under_review','approved','declined') THEN
      RAISE EXCEPTION 'Internal notes can only be updated after review begins';
    END IF;
    v_notes := NULLIF(btrim(coalesce(p_internal_notes, '')), '');
  END IF;

  UPDATE public.business_submissions
  SET status = v_to_status,
      business_response = v_response,
      internal_notes = v_notes,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_submission_id
  RETURNING * INTO v_after;

  INSERT INTO public.business_submission_review_events (
    submission_id,
    business_id,
    actor_user_id,
    action,
    from_status,
    to_status,
    business_response,
    internal_notes
  )
  VALUES (
    v_after.id,
    v_after.business_id,
    auth.uid(),
    p_action,
    v_before.status,
    v_after.status,
    CASE WHEN p_action IN ('approve','decline','update_response') THEN v_after.business_response ELSE NULL END,
    CASE WHEN p_action IN ('approve','decline','update_internal_notes') THEN v_after.internal_notes ELSE NULL END
  );

  RETURN v_after;
END;
$$;

REVOKE ALL ON FUNCTION public.review_business_submission(uuid,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_business_submission(uuid,text,text,text) TO authenticated;

COMMENT ON TABLE public.business_submission_review_events IS
  'Immutable audit history for controlled VYBE Operations review actions on external business submissions.';
COMMENT ON FUNCTION public.review_business_submission(uuid,text,text,text) IS
  'Server-controlled Operations workflow for reviewing submitted business requests. Requires admin.business.manage.';

COMMIT;
