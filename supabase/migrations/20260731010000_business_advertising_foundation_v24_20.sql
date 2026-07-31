-- V24.20: admin-managed business advertising foundation.
-- Public ad rendering remains disabled until an approved placement surface is connected.

CREATE TABLE public.business_packages (
  code text PRIMARY KEY,
  name text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  billing_interval text NOT NULL CHECK (billing_interval IN ('free', 'annual', 'custom')),
  duration_days integer CHECK (duration_days IS NULL OR duration_days > 0),
  active_campaign_limit integer NOT NULL DEFAULT 1 CHECK (active_campaign_limit > 0),
  spotlight_limit integer NOT NULL DEFAULT 1 CHECK (spotlight_limit >= 0),
  sponsored_experience_limit integer NOT NULL DEFAULT 0 CHECK (sponsored_experience_limit >= 0),
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.business_packages (
  code, name, price_cents, billing_interval, duration_days,
  active_campaign_limit, spotlight_limit, sponsored_experience_limit, is_public
) VALUES
  ('founding_preview', 'Founding Business Preview', 0, 'free', 60, 1, 1, 0, false),
  ('founding_partner', 'Founding Business Partner', 49900, 'annual', 365, 2, 2, 1, false),
  ('custom_campaign', 'Custom Campaign or Sponsorship', 0, 'custom', NULL, 10, 10, 10, false)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  price_cents = EXCLUDED.price_cents,
  billing_interval = EXCLUDED.billing_interval,
  duration_days = EXCLUDED.duration_days,
  active_campaign_limit = EXCLUDED.active_campaign_limit,
  spotlight_limit = EXCLUDED.spotlight_limit,
  sponsored_experience_limit = EXCLUDED.sponsored_experience_limit;

CREATE TABLE public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  legal_name text,
  public_name text NOT NULL,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  category text NOT NULL,
  description text,
  website_url text,
  logo_path text,
  cover_path text,
  contact_name text,
  contact_email text NOT NULL,
  contact_phone text,
  service_area text,
  target_audience text,
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  partner_status text NOT NULL DEFAULT 'prospect'
    CHECK (partner_status IN ('prospect', 'preview', 'annual', 'custom', 'paused', 'ended')),
  package_code text REFERENCES public.business_packages(code),
  package_started_at timestamptz,
  package_ends_at timestamptz,
  founding_partner boolean NOT NULL DEFAULT false,
  internal_notes text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX business_profiles_status_idx
  ON public.business_profiles(verification_status, partner_status);
CREATE INDEX business_profiles_owner_idx ON public.business_profiles(owner_user_id);

CREATE TABLE public.business_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  offer_code text,
  destination_url text,
  redemption_instructions text,
  terms text,
  starts_at timestamptz,
  ends_at timestamptz,
  max_redemptions integer CHECK (max_redemptions IS NULL OR max_redemptions > 0),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'active', 'paused', 'expired', 'rejected')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.business_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  package_code text REFERENCES public.business_packages(code),
  name text NOT NULL,
  objective text NOT NULL,
  target_audience text,
  target_genres text[] NOT NULL DEFAULT '{}',
  target_regions text[] NOT NULL DEFAULT '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'submitted', 'under_review', 'changes_requested', 'approved',
      'scheduled', 'active', 'paused', 'completed', 'rejected', 'cancelled', 'archived'
    )),
  offer_id uuid REFERENCES public.business_offers(id) ON DELETE SET NULL,
  disclosure_text text NOT NULL DEFAULT 'Sponsored by a VYBE business partner.',
  internal_notes text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX business_campaigns_business_idx
  ON public.business_campaigns(business_id, status, created_at DESC);

CREATE TABLE public.business_campaign_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.business_campaigns(id) ON DELETE CASCADE,
  format text NOT NULL CHECK (format IN (
    'partner_card', 'spotlight', 'member_offer', 'sponsored_story',
    'sponsored_interview', 'sponsored_poll', 'sponsored_trivia',
    'sponsored_playlist', 'listening_experience', 'event_sponsorship'
  )),
  headline text NOT NULL,
  body text NOT NULL,
  call_to_action text,
  destination_url text,
  image_path text,
  video_path text,
  alt_text text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'changes_requested', 'approved', 'rejected', 'archived')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.business_campaign_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.business_campaigns(id) ON DELETE CASCADE,
  creative_id uuid NOT NULL REFERENCES public.business_campaign_creatives(id) ON DELETE CASCADE,
  surface text NOT NULL CHECK (surface IN (
    'home', 'explore', 'play', 'trivia_result', 'poll_result',
    'creator_spotlight', 'story', 'playlist', 'listening_experience',
    'business_directory', 'member_dashboard'
  )),
  slot_key text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  frequency_cap_per_day integer CHECK (frequency_cap_per_day IS NULL OR frequency_cap_per_day > 0),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX business_placements_surface_idx
  ON public.business_campaign_placements(surface, slot_key, status, starts_at, ends_at);

CREATE TABLE public.business_campaign_events (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.business_campaigns(id) ON DELETE CASCADE,
  creative_id uuid REFERENCES public.business_campaign_creatives(id) ON DELETE SET NULL,
  placement_id uuid REFERENCES public.business_campaign_placements(id) ON DELETE SET NULL,
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'ad_impression', 'ad_click', 'offer_view', 'offer_claim', 'offer_redemption',
    'business_profile_view', 'sponsored_content_view', 'sponsored_activity_start',
    'sponsored_activity_complete', 'creator_opportunity_view',
    'creator_opportunity_response', 'campaign_conversion'
  )),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  attribution_code text,
  referrer_path text,
  device_category text,
  is_internal boolean NOT NULL DEFAULT false,
  is_valid boolean NOT NULL DEFAULT true,
  invalid_reason text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX business_events_campaign_idx
  ON public.business_campaign_events(campaign_id, occurred_at DESC);
CREATE INDEX business_events_dedupe_idx
  ON public.business_campaign_events(placement_id, event_type, session_id, occurred_at DESC);

CREATE TABLE public.business_offer_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.business_offers(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  redemption_code text,
  status text NOT NULL DEFAULT 'claimed'
    CHECK (status IN ('claimed', 'verified', 'rejected', 'cancelled')),
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.business_partner_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.business_campaigns(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN (
    'application', 'qualification_review', 'preview_terms', 'annual_agreement',
    'invoice', 'payment_record', 'campaign_brief', 'asset_checklist',
    'tracking_plan', 'campaign_report', 'case_study_approval',
    'roadmap_status', 'brand_guidelines', 'other'
  )),
  title text NOT NULL,
  storage_path text,
  external_url text,
  version_label text,
  visibility text NOT NULL DEFAULT 'internal'
    CHECK (visibility IN ('internal', 'partner')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'requested', 'received', 'approved', 'signed', 'expired', 'archived')),
  effective_at timestamptz,
  expires_at timestamptz,
  uploaded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.business_audit_log (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  business_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.business_campaigns(id) ON DELETE SET NULL,
  actor_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON
  public.business_packages,
  public.business_profiles,
  public.business_offers,
  public.business_campaigns,
  public.business_campaign_creatives,
  public.business_campaign_placements,
  public.business_campaign_events,
  public.business_offer_redemptions,
  public.business_partner_documents,
  public.business_audit_log
TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.business_packages,
  public.business_profiles,
  public.business_offers,
  public.business_campaigns,
  public.business_campaign_creatives,
  public.business_campaign_placements,
  public.business_campaign_events,
  public.business_offer_redemptions,
  public.business_partner_documents,
  public.business_audit_log
TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE
  public.business_campaign_events_id_seq,
  public.business_audit_log_id_seq
TO authenticated, service_role;

ALTER TABLE public.business_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_campaign_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_campaign_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_offer_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_partner_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage business packages"
  ON public.business_packages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage business profiles"
  ON public.business_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage business offers"
  ON public.business_offers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage business campaigns"
  ON public.business_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage business creatives"
  ON public.business_campaign_creatives FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage business placements"
  ON public.business_campaign_placements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage business campaign events"
  ON public.business_campaign_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage business redemptions"
  ON public.business_offer_redemptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage partner documents"
  ON public.business_partner_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins view business audit log"
  ON public.business_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins add business audit log"
  ON public.business_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_admin_business_summary()
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
    'businesses', jsonb_build_object(
      'total', (SELECT count(*) FROM public.business_profiles),
      'pending', (SELECT count(*) FROM public.business_profiles WHERE verification_status = 'pending'),
      'verified', (SELECT count(*) FROM public.business_profiles WHERE verification_status = 'verified'),
      'preview', (SELECT count(*) FROM public.business_profiles WHERE partner_status = 'preview'),
      'annual', (SELECT count(*) FROM public.business_profiles WHERE partner_status = 'annual')
    ),
    'campaigns', jsonb_build_object(
      'total', (SELECT count(*) FROM public.business_campaigns),
      'review', (SELECT count(*) FROM public.business_campaigns WHERE status IN ('submitted', 'under_review', 'changes_requested')),
      'approved', (SELECT count(*) FROM public.business_campaigns WHERE status IN ('approved', 'scheduled')),
      'active', (SELECT count(*) FROM public.business_campaigns WHERE status = 'active')
    ),
    'operations', jsonb_build_object(
      'active_offers', (SELECT count(*) FROM public.business_offers WHERE status = 'active'),
      'scheduled_placements', (SELECT count(*) FROM public.business_campaign_placements WHERE status = 'scheduled'),
      'documents_missing_path', (
        SELECT count(*) FROM public.business_partner_documents
        WHERE storage_path IS NULL AND external_url IS NULL
      ),
      'valid_events', (SELECT count(*) FROM public.business_campaign_events WHERE is_valid AND NOT is_internal)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_business_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_business_summary() TO authenticated;

CREATE OR REPLACE FUNCTION public.record_business_campaign_event(
  p_placement_id uuid,
  p_event_type text,
  p_session_id text,
  p_referrer_path text DEFAULT NULL,
  p_device_category text DEFAULT NULL,
  p_attribution_code text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target record;
BEGIN
  IF p_event_type NOT IN (
    'ad_impression', 'ad_click', 'offer_view', 'offer_claim',
    'business_profile_view', 'sponsored_content_view',
    'sponsored_activity_start', 'sponsored_activity_complete'
  ) THEN
    RAISE EXCEPTION 'Unsupported public campaign event';
  END IF;

  SELECT
    p.id AS placement_id,
    p.creative_id,
    p.campaign_id,
    c.business_id
  INTO target
  FROM public.business_campaign_placements p
  JOIN public.business_campaigns c ON c.id = p.campaign_id
  JOIN public.business_campaign_creatives cr ON cr.id = p.creative_id
  WHERE p.id = p_placement_id
    AND p.status IN ('scheduled', 'active')
    AND c.status IN ('scheduled', 'active')
    AND cr.status = 'approved'
    AND now() BETWEEN p.starts_at AND p.ends_at;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF p_event_type = 'ad_impression' AND EXISTS (
    SELECT 1
    FROM public.business_campaign_events e
    WHERE e.placement_id = target.placement_id
      AND e.event_type = p_event_type
      AND e.session_id = p_session_id
      AND e.occurred_at >= now() - interval '30 minutes'
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.business_campaign_events (
    campaign_id, creative_id, placement_id, business_id, event_type,
    user_id, session_id, attribution_code, referrer_path, device_category
  ) VALUES (
    target.campaign_id, target.creative_id, target.placement_id, target.business_id,
    p_event_type, auth.uid(), p_session_id, p_attribution_code,
    p_referrer_path, p_device_category
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.record_business_campaign_event(uuid, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_business_campaign_event(uuid, text, text, text, text, text)
  TO anon, authenticated;
