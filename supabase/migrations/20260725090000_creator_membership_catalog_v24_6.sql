-- V24.6: full creator membership catalog and billing-readiness metadata.
-- This migration does not activate billing or grant a paid membership.

ALTER TABLE public.creator_plan_definitions
  DROP CONSTRAINT IF EXISTS creator_plan_definitions_plan_code_check;
ALTER TABLE public.creator_plan_definitions
  ADD CONSTRAINT creator_plan_definitions_plan_code_check
  CHECK (plan_code IN (
    'creator_free', 'creator_plus', 'creator_pro', 'creator_studio', 'founding_beta'
  ));

ALTER TABLE public.account_entitlements
  DROP CONSTRAINT IF EXISTS account_entitlements_plan_code_check;
ALTER TABLE public.account_entitlements
  ADD CONSTRAINT account_entitlements_plan_code_check
  CHECK (plan_code IN (
    'creator_free', 'creator_plus', 'creator_pro', 'creator_studio', 'founding_beta'
  ));

ALTER TABLE public.account_entitlements
  ADD COLUMN IF NOT EXISTS billing_interval text
    CHECK (billing_interval IS NULL OR billing_interval IN ('monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS billing_provider text
    CHECK (billing_provider IS NULL OR billing_provider = 'stripe'),
  ADD COLUMN IF NOT EXISTS billing_customer_ref text,
  ADD COLUMN IF NOT EXISTS billing_subscription_ref text,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_plan_code text
    CHECK (
      scheduled_plan_code IS NULL OR
      scheduled_plan_code IN ('creator_free', 'creator_plus', 'creator_pro', 'creator_studio')
    ),
  ADD COLUMN IF NOT EXISTS adjustment_ends_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS account_entitlements_billing_customer_key
  ON public.account_entitlements (billing_customer_ref)
  WHERE billing_customer_ref IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS account_entitlements_billing_subscription_key
  ON public.account_entitlements (billing_subscription_ref)
  WHERE billing_subscription_ref IS NOT NULL;

ALTER TABLE public.creator_invites
  DROP CONSTRAINT IF EXISTS creator_invites_assigned_plan_check;
ALTER TABLE public.creator_invites
  ADD CONSTRAINT creator_invites_assigned_plan_check
  CHECK (assigned_plan IN (
    'creator_free', 'creator_plus', 'creator_pro', 'creator_studio', 'founding_beta'
  ));

ALTER TABLE public.creator_plan_definitions
  ADD COLUMN IF NOT EXISTS monthly_price_cents integer NOT NULL DEFAULT 0
    CHECK (monthly_price_cents >= 0),
  ADD COLUMN IF NOT EXISTS annual_price_cents integer NOT NULL DEFAULT 0
    CHECK (annual_price_cents >= 0),
  ADD COLUMN IF NOT EXISTS pioneer_monthly_price_cents integer
    CHECK (pioneer_monthly_price_cents IS NULL OR pioneer_monthly_price_cents >= 0),
  ADD COLUMN IF NOT EXISTS pioneer_annual_price_cents integer
    CHECK (pioneer_annual_price_cents IS NULL OR pioneer_annual_price_cents >= 0),
  ADD COLUMN IF NOT EXISTS written_post_limit integer NOT NULL DEFAULT 0
    CHECK (written_post_limit >= 0),
  ADD COLUMN IF NOT EXISTS video_storage_minutes integer NOT NULL DEFAULT 0
    CHECK (video_storage_minutes >= 0),
  ADD COLUMN IF NOT EXISTS ai_action_limit integer NOT NULL DEFAULT 0
    CHECK (ai_action_limit >= 0),
  ADD COLUMN IF NOT EXISTS analytics_history_days integer
    CHECK (analytics_history_days IS NULL OR analytics_history_days > 0),
  ADD COLUMN IF NOT EXISTS team_member_limit integer NOT NULL DEFAULT 1
    CHECK (team_member_limit > 0),
  ADD COLUMN IF NOT EXISTS adjustment_period_days integer NOT NULL DEFAULT 30
    CHECK (adjustment_period_days >= 0),
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS billing_state text NOT NULL DEFAULT 'planned'
    CHECK (billing_state IN ('free', 'planned', 'active', 'invitation_only')),
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

INSERT INTO public.creator_plan_definitions (
  plan_code, public_name, description, uploaded_track_limit, published_track_limit,
  max_track_duration_sec, max_audio_bytes, published_playlist_limit,
  playlist_track_limit, merch_item_limit, active_connection_limit,
  monthly_price_cents, annual_price_cents,
  pioneer_monthly_price_cents, pioneer_annual_price_cents,
  written_post_limit, video_storage_minutes, ai_action_limit,
  analytics_history_days, team_member_limit, adjustment_period_days,
  is_public, billing_state, sort_order
) VALUES
  (
    'creator_free', 'Creator Free',
    'Start a real creator home and share your work with no credit card required.',
    15, 10, 300, 15728640, 8, 10, 2, 100,
    0, 0, NULL, NULL, 10, 0, 5, 30, 1, 30, true, 'free', 10
  ),
  (
    'creator_plus', 'Creator Plus',
    'More releases, audience tools, and capacity for independent creators who are growing.',
    75, 50, 600, 52428800, 30, 50, 10, 2500,
    1200, 12000, 900, 8400, 50, 30, 30, 90, 1, 30, true, 'planned', 20
  ),
  (
    'creator_pro', 'Creator Pro',
    'Multimedia releases, campaigns, analytics, and professional creator growth tools.',
    250, 200, 1200, 52428800, 100, 100, 50, 10000,
    2400, 24000, 1900, 18000, 250, 180, 100, 365, 1, 30, true, 'planned', 30
  ),
  (
    'creator_studio', 'Creator Studio',
    'Team, production, catalog, and partnership tools for professional creator organizations.',
    500, 400, 1800, 52428800, 250, 250, 150, 50000,
    4900, 49000, 3900, 39000, 1000, 600, 300, NULL, 5, 30, true, 'planned', 40
  ),
  (
    'founding_beta', 'Founding Creator',
    'Invitation-only testing access tied to an approved founding commitment.',
    100, 75, 1200, 52428800, 60, 50, 25, 10000,
    0, 0, NULL, NULL, 250, 180, 100, NULL, 1, 30, false, 'invitation_only', 90
  )
ON CONFLICT (plan_code) DO UPDATE SET
  public_name = EXCLUDED.public_name,
  description = EXCLUDED.description,
  uploaded_track_limit = EXCLUDED.uploaded_track_limit,
  published_track_limit = EXCLUDED.published_track_limit,
  max_track_duration_sec = EXCLUDED.max_track_duration_sec,
  max_audio_bytes = EXCLUDED.max_audio_bytes,
  published_playlist_limit = EXCLUDED.published_playlist_limit,
  playlist_track_limit = EXCLUDED.playlist_track_limit,
  merch_item_limit = EXCLUDED.merch_item_limit,
  active_connection_limit = EXCLUDED.active_connection_limit,
  monthly_price_cents = EXCLUDED.monthly_price_cents,
  annual_price_cents = EXCLUDED.annual_price_cents,
  pioneer_monthly_price_cents = EXCLUDED.pioneer_monthly_price_cents,
  pioneer_annual_price_cents = EXCLUDED.pioneer_annual_price_cents,
  written_post_limit = EXCLUDED.written_post_limit,
  video_storage_minutes = EXCLUDED.video_storage_minutes,
  ai_action_limit = EXCLUDED.ai_action_limit,
  analytics_history_days = EXCLUDED.analytics_history_days,
  team_member_limit = EXCLUDED.team_member_limit,
  adjustment_period_days = EXCLUDED.adjustment_period_days,
  is_public = EXCLUDED.is_public,
  billing_state = EXCLUDED.billing_state,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

ALTER TABLE public.account_entitlements
  DROP CONSTRAINT IF EXISTS first_wave_requires_creator_plus,
  DROP CONSTRAINT IF EXISTS account_entitlements_recognition_check;

UPDATE public.account_entitlements
SET recognition_code = 'vybe_pioneer'
WHERE recognition_code = 'first_wave';

ALTER TABLE public.account_entitlements
  ADD CONSTRAINT account_entitlements_recognition_check
    CHECK (recognition_code IS NULL OR recognition_code = 'vybe_pioneer'),
  ADD CONSTRAINT vybe_pioneer_requires_public_paid_plan
    CHECK (
      recognition_code IS NULL OR
      plan_code IN ('creator_plus', 'creator_pro', 'creator_studio')
    );

CREATE OR REPLACE FUNCTION public.create_creator_invite(
  _email text,
  _recipient_name text DEFAULT NULL,
  _assigned_plan text DEFAULT 'creator_free',
  _expires_in_days integer DEFAULT 7,
  _internal_note text DEFAULT NULL
)
RETURNS TABLE(invite_id uuid, invite_token text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _token text;
  _id uuid;
  _expires timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  IF trim(coalesce(_email, '')) = '' OR position('@' in _email) < 2 THEN
    RAISE EXCEPTION 'A valid recipient email is required';
  END IF;
  IF _assigned_plan NOT IN (
    'creator_free', 'creator_plus', 'creator_pro', 'creator_studio', 'founding_beta'
  ) THEN
    RAISE EXCEPTION 'Invalid creator plan';
  END IF;
  IF _expires_in_days < 1 OR _expires_in_days > 30 THEN
    RAISE EXCEPTION 'Invitation expiration must be between 1 and 30 days';
  END IF;

  _token := encode(gen_random_bytes(32), 'hex');
  _expires := now() + make_interval(days => _expires_in_days);

  INSERT INTO public.creator_invites (
    email_normalized, recipient_name, token_hash, assigned_plan,
    issued_by, expires_at, internal_note
  ) VALUES (
    lower(trim(_email)), nullif(trim(_recipient_name), ''),
    encode(digest(_token, 'sha256'), 'hex'), _assigned_plan,
    auth.uid(), _expires, nullif(trim(_internal_note), '')
  ) RETURNING id INTO _id;

  RETURN QUERY SELECT _id, _token, _expires;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_creator_membership()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'plan_code', p.plan_code,
    'public_name', p.public_name,
    'description', p.description,
    'recognition_code', ae.recognition_code,
    'billing_state', p.billing_state,
    'pricing', jsonb_build_object(
      'monthly_cents', p.monthly_price_cents,
      'annual_cents', p.annual_price_cents,
      'pioneer_monthly_cents', p.pioneer_monthly_price_cents,
      'pioneer_annual_cents', p.pioneer_annual_price_cents
    ),
    'future_allowances', jsonb_build_object(
      'written_posts', p.written_post_limit,
      'video_storage_minutes', p.video_storage_minutes,
      'ai_actions', p.ai_action_limit,
      'analytics_history_days', p.analytics_history_days,
      'team_members', p.team_member_limit
    ),
    'downgrade', jsonb_build_object(
      'adjustment_period_days', p.adjustment_period_days,
      'automatic_deletion', false
    ),
    'limits', jsonb_build_object(
      'uploaded_tracks', p.uploaded_track_limit,
      'published_tracks', p.published_track_limit,
      'track_duration_sec', p.max_track_duration_sec,
      'audio_bytes', p.max_audio_bytes,
      'published_playlists', p.published_playlist_limit,
      'playlist_tracks', p.playlist_track_limit,
      'merch_items', p.merch_item_limit,
      'active_connections', p.active_connection_limit
    ),
    'usage', jsonb_build_object(
      'uploaded_tracks', (SELECT count(*) FROM public.tracks WHERE creator_id = auth.uid()),
      'published_tracks', (SELECT count(*) FROM public.tracks WHERE creator_id = auth.uid() AND status = 'published'),
      'published_playlists', (SELECT count(*) FROM public.playlists WHERE creator_id = auth.uid() AND is_published),
      'merch_items', (SELECT count(*) FROM public.merch_products WHERE creator_id = auth.uid()),
      'active_connections', (SELECT count(*) FROM public.listener_connections WHERE creator_id = auth.uid() AND status <> 'archived')
    )
  )
  FROM public.creator_plan_definitions p
  LEFT JOIN public.account_entitlements ae
    ON ae.user_id = auth.uid()
   AND ae.plan_code = p.plan_code
   AND ae.status = 'active'
   AND (ae.expires_at IS NULL OR ae.expires_at > now())
  WHERE p.plan_code = public.active_creator_plan(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.get_my_creator_membership() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_creator_membership() TO authenticated;
