-- VYBE V24.27.1 - Business Self-Service Campaign and Offer Builder
-- Adds narrowly scoped RPCs. Existing table RLS policies remain unchanged.

BEGIN;

CREATE OR REPLACE FUNCTION public.create_my_business_campaign_draft_v24_27_1(
  p_name text,
  p_objective text,
  p_target_audience text DEFAULT NULL,
  p_target_genres text[] DEFAULT ARRAY[]::text[],
  p_target_regions text[] DEFAULT ARRAY[]::text[],
  p_disclosure_text text DEFAULT '',
  p_starts_at timestamptz DEFAULT NULL,
  p_ends_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid := auth.uid();
  business_row public.business_profiles%ROWTYPE;
  package_limit integer;
  open_campaign_count integer;
  new_campaign_id uuid;
BEGIN
  IF actor_id IS NULL OR NOT public.has_role(actor_id, 'business'::public.app_role) THEN
    RAISE EXCEPTION 'A verified business account is required';
  END IF;

  SELECT b.*
  INTO business_row
  FROM public.business_profiles b
  WHERE b.owner_user_id = actor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business profile was not found';
  END IF;
  IF business_row.verification_status <> 'verified' THEN
    RAISE EXCEPTION 'Business verification is required';
  END IF;
  IF business_row.package_code IS NULL THEN
    RAISE EXCEPTION 'An active business package is required';
  END IF;
  IF business_row.package_ends_at IS NOT NULL AND business_row.package_ends_at <= now() THEN
    RAISE EXCEPTION 'The business package has expired';
  END IF;

  SELECT p.active_campaign_limit
  INTO package_limit
  FROM public.business_packages p
  WHERE p.code = business_row.package_code;

  IF package_limit IS NULL THEN
    RAISE EXCEPTION 'The assigned business package is invalid';
  END IF;

  SELECT count(*)::integer
  INTO open_campaign_count
  FROM public.business_campaigns c
  WHERE c.business_id = business_row.id
    AND c.status NOT IN ('completed', 'rejected', 'cancelled', 'archived');

  IF open_campaign_count >= package_limit THEN
    RAISE EXCEPTION 'The active campaign limit for this package has been reached';
  END IF;

  IF length(trim(coalesce(p_name, ''))) NOT BETWEEN 1 AND 120 THEN
    RAISE EXCEPTION 'Campaign name must be between 1 and 120 characters';
  END IF;
  IF length(trim(coalesce(p_objective, ''))) NOT BETWEEN 1 AND 1200 THEN
    RAISE EXCEPTION 'Campaign objective must be between 1 and 1200 characters';
  END IF;
  IF length(trim(coalesce(p_target_audience, ''))) > 1000 THEN
    RAISE EXCEPTION 'Target audience must not exceed 1000 characters';
  END IF;
  IF length(trim(coalesce(p_disclosure_text, ''))) > 2000 THEN
    RAISE EXCEPTION 'Disclosure text must not exceed 2000 characters';
  END IF;
  IF cardinality(coalesce(p_target_genres, ARRAY[]::text[])) > 20
     OR cardinality(coalesce(p_target_regions, ARRAY[]::text[])) > 20 THEN
    RAISE EXCEPTION 'No more than 20 genres or regions may be selected';
  END IF;
  IF p_starts_at IS NOT NULL AND p_ends_at IS NOT NULL AND p_ends_at <= p_starts_at THEN
    RAISE EXCEPTION 'Campaign end must be after its start';
  END IF;

  INSERT INTO public.business_campaigns (
    business_id, package_code, name, objective, target_audience,
    target_genres, target_regions, disclosure_text, starts_at, ends_at,
    status, created_by
  ) VALUES (
    business_row.id,
    business_row.package_code,
    trim(p_name),
    trim(p_objective),
    nullif(trim(coalesce(p_target_audience, '')), ''),
    coalesce(p_target_genres, ARRAY[]::text[]),
    coalesce(p_target_regions, ARRAY[]::text[]),
    trim(coalesce(p_disclosure_text, '')),
    p_starts_at,
    p_ends_at,
    'draft',
    actor_id
  )
  RETURNING id INTO new_campaign_id;

  INSERT INTO public.business_audit_log (
    actor_user_id, business_id, campaign_id, action, entity_type, entity_id, details
  ) VALUES (
    actor_id, business_row.id, new_campaign_id,
    'business_campaign_draft_created', 'business_campaign', new_campaign_id,
    jsonb_build_object('package_code', business_row.package_code)
  );

  RETURN new_campaign_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_my_business_campaign_draft_v24_27_1(
  p_campaign_id uuid,
  p_name text,
  p_objective text,
  p_target_audience text DEFAULT NULL,
  p_target_genres text[] DEFAULT ARRAY[]::text[],
  p_target_regions text[] DEFAULT ARRAY[]::text[],
  p_disclosure_text text DEFAULT '',
  p_starts_at timestamptz DEFAULT NULL,
  p_ends_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid := auth.uid();
  campaign_row public.business_campaigns%ROWTYPE;
BEGIN
  IF actor_id IS NULL OR NOT public.has_role(actor_id, 'business'::public.app_role) THEN
    RAISE EXCEPTION 'A business account is required';
  END IF;

  SELECT c.*
  INTO campaign_row
  FROM public.business_campaigns c
  JOIN public.business_profiles b ON b.id = c.business_id
  WHERE c.id = p_campaign_id
    AND b.owner_user_id = actor_id
    AND b.verification_status = 'verified'
    AND b.package_code IS NOT NULL
    AND (b.package_ends_at IS NULL OR b.package_ends_at > now())
  FOR UPDATE OF c;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Editable campaign was not found';
  END IF;
  IF campaign_row.status NOT IN ('draft', 'changes_requested') THEN
    RAISE EXCEPTION 'Only draft or changes-requested campaigns may be edited';
  END IF;
  IF length(trim(coalesce(p_name, ''))) NOT BETWEEN 1 AND 120
     OR length(trim(coalesce(p_objective, ''))) NOT BETWEEN 1 AND 1200 THEN
    RAISE EXCEPTION 'Campaign name or objective is invalid';
  END IF;
  IF length(trim(coalesce(p_target_audience, ''))) > 1000
     OR length(trim(coalesce(p_disclosure_text, ''))) > 2000 THEN
    RAISE EXCEPTION 'Campaign text exceeds its limit';
  END IF;
  IF cardinality(coalesce(p_target_genres, ARRAY[]::text[])) > 20
     OR cardinality(coalesce(p_target_regions, ARRAY[]::text[])) > 20 THEN
    RAISE EXCEPTION 'No more than 20 genres or regions may be selected';
  END IF;
  IF p_starts_at IS NOT NULL AND p_ends_at IS NOT NULL AND p_ends_at <= p_starts_at THEN
    RAISE EXCEPTION 'Campaign end must be after its start';
  END IF;

  UPDATE public.business_campaigns
  SET name = trim(p_name),
      objective = trim(p_objective),
      target_audience = nullif(trim(coalesce(p_target_audience, '')), ''),
      target_genres = coalesce(p_target_genres, ARRAY[]::text[]),
      target_regions = coalesce(p_target_regions, ARRAY[]::text[]),
      disclosure_text = trim(coalesce(p_disclosure_text, '')),
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      status = 'draft',
      updated_at = now()
  WHERE id = campaign_row.id;

  INSERT INTO public.business_audit_log (
    actor_user_id, business_id, campaign_id, action, entity_type, entity_id, details
  ) VALUES (
    actor_id, campaign_row.business_id, campaign_row.id,
    'business_campaign_draft_updated', 'business_campaign', campaign_row.id,
    jsonb_build_object('previous_status', campaign_row.status)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_my_business_campaign_offer_v24_27_1(
  p_campaign_id uuid,
  p_title text,
  p_description text,
  p_terms text DEFAULT NULL,
  p_starts_at timestamptz DEFAULT NULL,
  p_ends_at timestamptz DEFAULT NULL,
  p_max_redemptions integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid := auth.uid();
  campaign_row public.business_campaigns%ROWTYPE;
  offer_row public.business_offers%ROWTYPE;
  resulting_offer_id uuid;
BEGIN
  IF actor_id IS NULL OR NOT public.has_role(actor_id, 'business'::public.app_role) THEN
    RAISE EXCEPTION 'A business account is required';
  END IF;

  SELECT c.*
  INTO campaign_row
  FROM public.business_campaigns c
  JOIN public.business_profiles b ON b.id = c.business_id
  WHERE c.id = p_campaign_id
    AND b.owner_user_id = actor_id
    AND b.verification_status = 'verified'
    AND b.package_code IS NOT NULL
    AND (b.package_ends_at IS NULL OR b.package_ends_at > now())
  FOR UPDATE OF c;

  IF NOT FOUND OR campaign_row.status NOT IN ('draft', 'changes_requested') THEN
    RAISE EXCEPTION 'An editable campaign was not found';
  END IF;
  IF length(trim(coalesce(p_title, ''))) NOT BETWEEN 1 AND 120
     OR length(trim(coalesce(p_description, ''))) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'Offer title or description is invalid';
  END IF;
  IF length(trim(coalesce(p_terms, ''))) > 3000 THEN
    RAISE EXCEPTION 'Offer terms must not exceed 3000 characters';
  END IF;
  IF p_max_redemptions IS NOT NULL AND p_max_redemptions <= 0 THEN
    RAISE EXCEPTION 'Maximum redemptions must be greater than zero';
  END IF;
  IF p_starts_at IS NOT NULL AND p_ends_at IS NOT NULL AND p_ends_at <= p_starts_at THEN
    RAISE EXCEPTION 'Offer end must be after its start';
  END IF;

  IF campaign_row.offer_id IS NULL THEN
    INSERT INTO public.business_offers (
      business_id, title, description, terms, starts_at, ends_at,
      max_redemptions, status
    ) VALUES (
      campaign_row.business_id, trim(p_title), trim(p_description),
      nullif(trim(coalesce(p_terms, '')), ''), p_starts_at, p_ends_at,
      p_max_redemptions, 'draft'
    ) RETURNING id INTO resulting_offer_id;

    UPDATE public.business_campaigns
    SET offer_id = resulting_offer_id,
        status = 'draft',
        updated_at = now()
    WHERE id = campaign_row.id;
  ELSE
    SELECT o.* INTO offer_row
    FROM public.business_offers o
    WHERE o.id = campaign_row.offer_id
      AND o.business_id = campaign_row.business_id
    FOR UPDATE;

    IF NOT FOUND OR offer_row.status NOT IN ('draft', 'rejected') THEN
      RAISE EXCEPTION 'The attached offer cannot be edited';
    END IF;

    UPDATE public.business_offers
    SET title = trim(p_title),
        description = trim(p_description),
        terms = nullif(trim(coalesce(p_terms, '')), ''),
        starts_at = p_starts_at,
        ends_at = p_ends_at,
        max_redemptions = p_max_redemptions,
        status = 'draft',
        updated_at = now()
    WHERE id = offer_row.id;
    resulting_offer_id := offer_row.id;

    UPDATE public.business_campaigns
    SET status = 'draft', updated_at = now()
    WHERE id = campaign_row.id;
  END IF;

  INSERT INTO public.business_audit_log (
    actor_user_id, business_id, campaign_id, action, entity_type, entity_id, details
  ) VALUES (
    actor_id, campaign_row.business_id, campaign_row.id,
    'business_campaign_offer_saved', 'business_offer', resulting_offer_id,
    jsonb_build_object('campaign_id', campaign_row.id)
  );

  RETURN resulting_offer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_my_business_campaign_v24_27_1(
  p_campaign_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid := auth.uid();
  campaign_row public.business_campaigns%ROWTYPE;
  offer_row public.business_offers%ROWTYPE;
BEGIN
  IF actor_id IS NULL OR NOT public.has_role(actor_id, 'business'::public.app_role) THEN
    RAISE EXCEPTION 'A business account is required';
  END IF;

  SELECT c.*
  INTO campaign_row
  FROM public.business_campaigns c
  JOIN public.business_profiles b ON b.id = c.business_id
  WHERE c.id = p_campaign_id
    AND b.owner_user_id = actor_id
    AND b.verification_status = 'verified'
    AND b.package_code IS NOT NULL
    AND (b.package_ends_at IS NULL OR b.package_ends_at > now())
  FOR UPDATE OF c;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign was not found';
  END IF;
  IF campaign_row.status NOT IN ('draft', 'changes_requested') THEN
    RAISE EXCEPTION 'This campaign cannot be submitted from its current status';
  END IF;
  IF length(trim(campaign_row.name)) = 0 OR length(trim(campaign_row.objective)) = 0 THEN
    RAISE EXCEPTION 'Campaign name and objective are required';
  END IF;

  IF campaign_row.offer_id IS NOT NULL THEN
    SELECT o.* INTO offer_row
    FROM public.business_offers o
    WHERE o.id = campaign_row.offer_id
      AND o.business_id = campaign_row.business_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'The attached offer is invalid';
    END IF;
    IF offer_row.status NOT IN ('draft', 'rejected') THEN
      RAISE EXCEPTION 'The attached offer cannot be submitted from its current status';
    END IF;
    IF length(trim(offer_row.title)) = 0 OR length(trim(offer_row.description)) = 0 THEN
      RAISE EXCEPTION 'Offer title and description are required';
    END IF;

    UPDATE public.business_offers
    SET status = 'submitted', updated_at = now()
    WHERE id = offer_row.id;
  END IF;

  UPDATE public.business_campaigns
  SET status = 'submitted', updated_at = now()
  WHERE id = campaign_row.id;

  INSERT INTO public.business_audit_log (
    actor_user_id, business_id, campaign_id, action, entity_type, entity_id, details
  ) VALUES (
    actor_id, campaign_row.business_id, campaign_row.id,
    'business_campaign_submitted', 'business_campaign', campaign_row.id,
    jsonb_build_object('offer_id', campaign_row.offer_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_my_business_campaign_draft_v24_27_1(
  text, text, text, text[], text[], text, timestamptz, timestamptz
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_my_business_campaign_draft_v24_27_1(
  uuid, text, text, text, text[], text[], text, timestamptz, timestamptz
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_my_business_campaign_offer_v24_27_1(
  uuid, text, text, text, timestamptz, timestamptz, integer
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_my_business_campaign_v24_27_1(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_my_business_campaign_draft_v24_27_1(
  text, text, text, text[], text[], text, timestamptz, timestamptz
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_my_business_campaign_draft_v24_27_1(
  uuid, text, text, text, text[], text[], text, timestamptz, timestamptz
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_my_business_campaign_offer_v24_27_1(
  uuid, text, text, text, timestamptz, timestamptz, integer
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_my_business_campaign_v24_27_1(uuid) TO authenticated;

COMMENT ON FUNCTION public.create_my_business_campaign_draft_v24_27_1(
  text, text, text, text[], text[], text, timestamptz, timestamptz
) IS 'Creates one package-limited draft campaign for the verified authenticated business owner.';
COMMENT ON FUNCTION public.update_my_business_campaign_draft_v24_27_1(
  uuid, text, text, text, text[], text[], text, timestamptz, timestamptz
) IS 'Updates only business-editable fields on an owned draft or changes-requested campaign.';
COMMENT ON FUNCTION public.upsert_my_business_campaign_offer_v24_27_1(
  uuid, text, text, text, timestamptz, timestamptz, integer
) IS 'Creates or updates the single draft offer attached to an owned editable campaign.';
COMMENT ON FUNCTION public.submit_my_business_campaign_v24_27_1(uuid)
IS 'Submits an owned campaign and its attached draft offer for administrator review.';

COMMIT;
