-- V24.17: secure Back Office metrics and creator operations directory.

CREATE OR REPLACE FUNCTION public.get_admin_back_office_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  RETURN jsonb_build_object(
    'generated_at', now(),
    'accounts', jsonb_build_object(
      'total', (SELECT count(*) FROM public.profiles),
      'creators', (
        SELECT count(DISTINCT user_id) FROM public.user_roles WHERE role = 'creator'
      ),
      'supporters', (
        SELECT count(DISTINCT user_id) FROM public.user_roles WHERE role = 'supporter'
      ),
      'new_last_7_days', (
        SELECT count(*) FROM public.profiles WHERE created_at >= now() - interval '7 days'
      )
    ),
    'content', jsonb_build_object(
      'tracks_total', (SELECT count(*) FROM public.tracks),
      'tracks_published', (
        SELECT count(*) FROM public.tracks WHERE status = 'published'
      ),
      'tracks_draft', (
        SELECT count(*) FROM public.tracks WHERE status = 'draft'
      ),
      'playlists_total', (SELECT count(*) FROM public.playlists),
      'playlists_published', (
        SELECT count(*) FROM public.playlists WHERE is_published
      ),
      'videos_total', (SELECT count(*) FROM public.creator_videos),
      'videos_published', (
        SELECT count(*) FROM public.creator_videos
        WHERE status = 'published'
      ),
      'merch_total', (SELECT count(*) FROM public.merch_products),
      'merch_active', (
        SELECT count(*) FROM public.merch_products WHERE is_active
      )
    ),
    'attention', jsonb_build_object(
      'rights_jobs_queued', (
        SELECT count(*) FROM public.audio_processing_jobs WHERE status = 'queued'
      ),
      'rights_jobs_failed', (
        SELECT count(*) FROM public.audio_processing_jobs WHERE status = 'failed'
      ),
      'rights_jobs_flagged', (
        SELECT count(*) FROM public.audio_processing_jobs WHERE status = 'flagged'
      ),
      'moderation_cases_open', (
        SELECT count(*) FROM public.moderation_cases
        WHERE status IN ('open', 'reviewing', 'awaiting_creator')
      ),
      'copyright_reports_open', (
        SELECT count(*) FROM public.copyright_reports
        WHERE status IN ('received', 'reviewing', 'counter_notice')
      ),
      'invitations_ready', (
        SELECT count(*) FROM public.creator_invites
        WHERE redeemed_at IS NULL AND revoked_at IS NULL AND expires_at > now()
      )
    ),
    'memberships', COALESCE((
      SELECT jsonb_object_agg(plan_code, member_count)
      FROM (
        SELECT plan_code, count(*) AS member_count
        FROM public.account_entitlements
        WHERE status = 'active'
        GROUP BY plan_code
      ) plan_counts
    ), '{}'::jsonb)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_back_office_summary()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_back_office_summary()
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_creator_directory(
  search_text text DEFAULT NULL,
  result_limit integer DEFAULT 100
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  email text,
  joined_at timestamptz,
  roles text[],
  plan_code text,
  entitlement_status text,
  track_count bigint,
  published_track_count bigint,
  playlist_count bigint,
  video_count bigint,
  merch_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.email,
    p.created_at,
    COALESCE((
      SELECT array_agg(ur.role::text ORDER BY ur.role::text)
      FROM public.user_roles ur
      WHERE ur.user_id = p.id
    ), '{}'::text[]),
    COALESCE(ae.plan_code, 'none'),
    COALESCE(ae.status, 'none'),
    (SELECT count(*) FROM public.tracks t WHERE t.creator_id = p.id),
    (
      SELECT count(*) FROM public.tracks t
      WHERE t.creator_id = p.id AND t.status = 'published'
    ),
    (SELECT count(*) FROM public.playlists pl WHERE pl.creator_id = p.id),
    (SELECT count(*) FROM public.creator_videos cv WHERE cv.creator_id = p.id),
    (SELECT count(*) FROM public.merch_products mp WHERE mp.creator_id = p.id)
  FROM public.profiles p
  LEFT JOIN public.account_entitlements ae ON ae.user_id = p.id
  WHERE
    search_text IS NULL
    OR trim(search_text) = ''
    OR p.display_name ILIKE '%' || trim(search_text) || '%'
    OR p.email ILIKE '%' || trim(search_text) || '%'
  ORDER BY p.created_at DESC
  LIMIT LEAST(GREATEST(result_limit, 1), 250);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_creator_directory(text, integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_creator_directory(text, integer)
  TO authenticated;
