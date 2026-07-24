-- V24.8: Stripe-backed creator membership billing.
-- No key, Price ID, or webhook secret is stored in the database.

ALTER TABLE public.account_entitlements
  ADD COLUMN IF NOT EXISTS stripe_subscription_status text
    CHECK (
      stripe_subscription_status IS NULL OR
      stripe_subscription_status IN (
        'active', 'canceled', 'incomplete', 'incomplete_expired',
        'past_due', 'paused', 'trialing', 'unpaid'
      )
    ),
  ADD COLUMN IF NOT EXISTS last_billing_event_created bigint NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  event_created bigint NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('processed', 'ignored')),
  processed_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.stripe_webhook_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.stripe_webhook_events TO service_role;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

UPDATE public.creator_plan_definitions
SET billing_state = 'active', updated_at = now()
WHERE plan_code IN ('creator_plus', 'creator_pro', 'creator_studio');

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
    'billing', jsonb_build_object(
      'provider', ae.billing_provider,
      'interval', ae.billing_interval,
      'customer_ref', ae.billing_customer_ref,
      'subscription_ref', ae.billing_subscription_ref,
      'subscription_status', ae.stripe_subscription_status,
      'current_period_end', ae.current_period_end,
      'cancel_at_period_end', coalesce(ae.cancel_at_period_end, false),
      'adjustment_ends_at', ae.adjustment_ends_at
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

