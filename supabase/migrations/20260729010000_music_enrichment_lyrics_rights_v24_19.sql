-- V24.19: fast music uploads, renewable creator rights certification,
-- optional discovery enrichment, and creator-controlled lyric transcription.

ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS discovery_metadata jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(discovery_metadata) = 'object');

CREATE TABLE public.creator_music_rights_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_version text NOT NULL,
  default_rights_basis text NOT NULL CHECK (
    default_rights_basis IN (
      'entirely_original',
      'licensed_beat',
      'collaboration_permission',
      'cover_song',
      'contains_samples',
      'public_domain',
      'other_licensed'
    )
  ),
  certification_statement boolean NOT NULL CHECK (certification_statement),
  certified_track_count integer NOT NULL CHECK (certified_track_count >= 0),
  renewal_interval integer NOT NULL DEFAULT 15 CHECK (renewal_interval BETWEEN 10 AND 20),
  certified_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE INDEX creator_music_rights_certifications_creator_idx
  ON public.creator_music_rights_certifications(creator_id, certified_at DESC);

ALTER TABLE public.creator_music_rights_certifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.creator_music_rights_certifications TO authenticated;
GRANT ALL ON public.creator_music_rights_certifications TO service_role;

CREATE POLICY "Creators view own music rights certifications"
  ON public.creator_music_rights_certifications FOR SELECT TO authenticated
  USING (auth.uid() = creator_id);

CREATE OR REPLACE FUNCTION public.certify_creator_music_rights(
  requested_policy_version text,
  requested_default_basis text,
  statement_confirmed boolean
)
RETURNS public.creator_music_rights_certifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  certification public.creator_music_rights_certifications;
  current_track_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in before certifying music rights.';
  END IF;
  IF requested_policy_version <> '2026-07-29-music-v2' THEN
    RAISE EXCEPTION 'The current music rights policy must be accepted.';
  END IF;
  IF requested_default_basis NOT IN (
    'entirely_original',
    'licensed_beat',
    'collaboration_permission',
    'cover_song',
    'contains_samples',
    'public_domain',
    'other_licensed'
  ) THEN
    RAISE EXCEPTION 'Choose a valid usual rights category.';
  END IF;
  IF statement_confirmed IS NOT TRUE THEN
    RAISE EXCEPTION 'The music rights certification must be confirmed.';
  END IF;

  SELECT count(*)::integer INTO current_track_count
  FROM public.tracks
  WHERE creator_id = auth.uid();

  INSERT INTO public.creator_music_rights_certifications (
    creator_id,
    policy_version,
    default_rights_basis,
    certification_statement,
    certified_track_count,
    renewal_interval
  )
  VALUES (
    auth.uid(),
    requested_policy_version,
    requested_default_basis,
    true,
    current_track_count,
    15
  )
  RETURNING * INTO certification;

  RETURN certification;
END;
$$;

REVOKE ALL ON FUNCTION public.certify_creator_music_rights(text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certify_creator_music_rights(text, text, boolean)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.creator_music_rights_status()
RETURNS TABLE (
  active boolean,
  policy_version text,
  default_rights_basis text,
  certified_at timestamptz,
  uploads_since_certification integer,
  uploads_until_renewal integer
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH latest AS (
    SELECT *
    FROM public.creator_music_rights_certifications
    WHERE creator_id = auth.uid()
      AND revoked_at IS NULL
    ORDER BY certified_at DESC
    LIMIT 1
  ),
  usage AS (
    SELECT count(*)::integer AS current_track_count
    FROM public.tracks
    WHERE creator_id = auth.uid()
  )
  SELECT
    (
      latest.policy_version = '2026-07-29-music-v2'
      AND usage.current_track_count - latest.certified_track_count < latest.renewal_interval
    ) AS active,
    latest.policy_version,
    latest.default_rights_basis,
    latest.certified_at,
    GREATEST(usage.current_track_count - latest.certified_track_count, 0),
    GREATEST(
      latest.renewal_interval - (usage.current_track_count - latest.certified_track_count),
      0
    )
  FROM latest CROSS JOIN usage;
$$;

REVOKE ALL ON FUNCTION public.creator_music_rights_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.creator_music_rights_status() TO authenticated;

CREATE OR REPLACE FUNCTION public.apply_creator_music_rights_certification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  certification public.creator_music_rights_certifications;
  uploads_after_certification integer;
BEGIN
  SELECT * INTO certification
  FROM public.creator_music_rights_certifications
  WHERE creator_id = NEW.creator_id
    AND revoked_at IS NULL
  ORDER BY certified_at DESC
  LIMIT 1;

  SELECT count(*)::integer INTO uploads_after_certification
  FROM public.tracks
  WHERE creator_id = NEW.creator_id;

  IF certification.id IS NULL
    OR certification.policy_version <> '2026-07-29-music-v2'
    OR uploads_after_certification - certification.certified_track_count
      >= certification.renewal_interval
  THEN
    RAISE EXCEPTION
      'Renew your creator music rights certification before uploading more songs.';
  END IF;

  NEW.rights_confirmed := true;
  NEW.rights_policy_version := certification.policy_version;
  NEW.rights_confirmed_at := certification.certified_at;
  IF NEW.rights_basis IS NULL OR NEW.rights_basis = '' THEN
    NEW.rights_basis := certification.default_rights_basis;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_creator_music_rights_certification ON public.tracks;
CREATE TRIGGER apply_creator_music_rights_certification
BEFORE INSERT ON public.tracks
FOR EACH ROW EXECUTE FUNCTION public.apply_creator_music_rights_certification();

CREATE TABLE public.track_lyrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL UNIQUE REFERENCES public.tracks(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transcript_draft text NOT NULL DEFAULT '',
  refined_lyrics text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'private' CHECK (
    visibility IN ('public', 'search_only', 'private')
  ),
  transcription_status text NOT NULL DEFAULT 'not_requested' CHECK (
    transcription_status IN ('not_requested', 'queued', 'processing', 'ready', 'failed')
  ),
  transcription_error text NOT NULL DEFAULT '',
  transcription_requested_at timestamptz,
  transcription_completed_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX track_lyrics_creator_idx ON public.track_lyrics(creator_id, updated_at DESC);
CREATE INDEX track_lyrics_search_idx
  ON public.track_lyrics USING gin (to_tsvector('english', refined_lyrics))
  WHERE visibility IN ('public', 'search_only') AND refined_lyrics <> '';

ALTER TABLE public.track_lyrics ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.track_lyrics TO authenticated;
GRANT ALL ON public.track_lyrics TO service_role;

CREATE POLICY "Creators manage own track lyrics"
  ON public.track_lyrics FOR ALL TO authenticated
  USING (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = track_lyrics.track_id
        AND tracks.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = track_lyrics.track_id
        AND tracks.creator_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage track lyrics"
  ON public.track_lyrics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER track_lyrics_set_updated_at
  BEFORE UPDATE ON public.track_lyrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.queue_track_lyrics_transcription(target_track_id uuid)
RETURNS public.track_lyrics
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lyrics_record public.track_lyrics;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.tracks
    WHERE id = target_track_id AND creator_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You can request transcription only for your own song.';
  END IF;

  INSERT INTO public.track_lyrics (
    track_id,
    creator_id,
    transcription_status,
    transcription_requested_at
  )
  VALUES (target_track_id, auth.uid(), 'queued', now())
  ON CONFLICT (track_id) DO UPDATE SET
    transcription_status = 'queued',
    transcription_requested_at = now(),
    transcription_error = ''
  RETURNING * INTO lyrics_record;

  RETURN lyrics_record;
END;
$$;

REVOKE ALL ON FUNCTION public.queue_track_lyrics_transcription(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.queue_track_lyrics_transcription(uuid) TO authenticated;

COMMENT ON TABLE public.track_lyrics IS
  'Creator-reviewed lyrics. search_only permits discovery indexing but never public lyric display.';
COMMENT ON COLUMN public.track_lyrics.transcript_draft IS
  'Machine transcription draft. A private processor populates this field.';
COMMENT ON COLUMN public.track_lyrics.refined_lyrics IS
  'Creator-reviewed lyrics used according to the selected visibility.';
