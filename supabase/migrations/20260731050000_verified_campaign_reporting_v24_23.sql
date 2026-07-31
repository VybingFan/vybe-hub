-- V24.23: verified campaign analytics, tracking state, and auditable report releases.

ALTER TABLE public.business_campaigns
  ADD COLUMN conversion_tracking_status text NOT NULL DEFAULT 'not_connected'
    CHECK (conversion_tracking_status IN ('not_connected', 'testing', 'connected'));

CREATE TABLE public.business_campaign_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.business_campaigns(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  range_start timestamptz NOT NULL,
  range_end timestamptz NOT NULL,
  metrics jsonb NOT NULL,
  methodology jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'released', 'superseded')),
  prepared_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  released_by uuid DEFAULT auth.uid() REFERENCES auth.users(id),
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (range_end > range_start)
);

CREATE INDEX business_campaign_reports_campaign_idx
  ON public.business_campaign_reports(campaign_id, created_at DESC);

GRANT SELECT, INSERT ON public.business_campaign_reports TO authenticated;
GRANT ALL ON public.business_campaign_reports TO service_role;
ALTER TABLE public.business_campaign_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view campaign reports"
  ON public.business_campaign_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins create campaign reports"
  ON public.business_campaign_reports FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_admin_campaign_analytics(
  requested_campaign_id uuid,
  requested_start timestamptz,
  requested_end timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  IF requested_end <= requested_start THEN
    RAISE EXCEPTION 'Report end must be after report start';
  END IF;

  WITH selected_events AS (
    SELECT *
    FROM public.business_campaign_events
    WHERE campaign_id = requested_campaign_id
      AND occurred_at >= requested_start
      AND occurred_at < requested_end
  ),
  valid_events AS (
    SELECT *
    FROM selected_events
    WHERE is_valid = true AND is_internal = false
  ),
  totals AS (
    SELECT
      count(*) FILTER (WHERE event_type = 'ad_impression') AS impressions,
      count(*) FILTER (WHERE event_type = 'ad_click') AS clicks,
      count(*) FILTER (WHERE event_type = 'offer_claim') AS offer_claims,
      count(*) FILTER (WHERE event_type = 'offer_redemption') AS redemptions,
      count(*) FILTER (WHERE event_type = 'campaign_conversion') AS conversions
    FROM valid_events
  )
  SELECT jsonb_build_object(
    'generated_at', now(),
    'campaign_id', c.id,
    'campaign_name', c.name,
    'business_id', c.business_id,
    'business_name', b.public_name,
    'range_start', requested_start,
    'range_end', requested_end,
    'conversion_tracking_status', c.conversion_tracking_status,
    'metrics', jsonb_build_object(
      'impressions', t.impressions,
      'clicks', t.clicks,
      'click_through_rate',
        CASE WHEN t.impressions > 0
          THEN round((t.clicks::numeric / t.impressions::numeric) * 100, 2)
          ELSE 0
        END,
      'offer_claims', t.offer_claims,
      'redemptions', t.redemptions,
      'conversions',
        CASE WHEN c.conversion_tracking_status = 'connected' THEN t.conversions ELSE 0 END
    ),
    'quality', jsonb_build_object(
      'events_total', (SELECT count(*) FROM selected_events),
      'events_valid', (SELECT count(*) FROM valid_events),
      'events_internal', (SELECT count(*) FROM selected_events WHERE is_internal = true),
      'events_invalid', (SELECT count(*) FROM selected_events WHERE is_valid = false)
    ),
    'invalid_reasons', coalesce((
      SELECT jsonb_object_agg(reason, reason_count)
      FROM (
        SELECT coalesce(invalid_reason, 'unspecified') AS reason, count(*) AS reason_count
        FROM selected_events
        WHERE is_valid = false
        GROUP BY coalesce(invalid_reason, 'unspecified')
      ) reasons
    ), '{}'::jsonb),
    'daily', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', event_day,
          'impressions', impressions,
          'clicks', clicks,
          'offer_claims', offer_claims,
          'redemptions', redemptions,
          'conversions', conversions
        ) ORDER BY event_day
      )
      FROM (
        SELECT
          occurred_at::date AS event_day,
          count(*) FILTER (WHERE event_type = 'ad_impression') AS impressions,
          count(*) FILTER (WHERE event_type = 'ad_click') AS clicks,
          count(*) FILTER (WHERE event_type = 'offer_claim') AS offer_claims,
          count(*) FILTER (WHERE event_type = 'offer_redemption') AS redemptions,
          count(*) FILTER (WHERE event_type = 'campaign_conversion') AS conversions
        FROM valid_events
        GROUP BY occurred_at::date
      ) daily_rows
    ), '[]'::jsonb)
  ) INTO result
  FROM public.business_campaigns c
  JOIN public.business_profiles b ON b.id = c.business_id
  CROSS JOIN totals t
  WHERE c.id = requested_campaign_id;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_campaign_analytics(uuid, timestamptz, timestamptz)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_campaign_analytics(uuid, timestamptz, timestamptz)
  TO authenticated;
