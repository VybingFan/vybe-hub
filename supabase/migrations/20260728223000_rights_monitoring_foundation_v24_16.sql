-- V24.16: rights-processing queue, fingerprint registry, evidence records,
-- and auditable moderation workflow.
--
-- Native audio analysis runs in a separate trusted processor. The processor
-- uses the service-role key; browsers never receive that key.

CREATE TABLE public.audio_processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL UNIQUE REFERENCES public.tracks(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'processing', 'completed', 'flagged', 'failed', 'skipped')
  ),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  processor_version text,
  queued_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audio_processing_jobs_status_queued_idx
  ON public.audio_processing_jobs(status, queued_at);
CREATE INDEX audio_processing_jobs_creator_idx
  ON public.audio_processing_jobs(creator_id, created_at DESC);

CREATE TABLE public.audio_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL UNIQUE REFERENCES public.tracks(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  chromaprint text,
  chromaprint_algorithm integer,
  duration_sec numeric CHECK (duration_sec IS NULL OR duration_sec >= 0),
  sample_rate integer CHECK (sample_rate IS NULL OR sample_rate > 0),
  bitrate integer CHECK (bitrate IS NULL OR bitrate > 0),
  file_type text,
  embedded_title text,
  embedded_artist text,
  embedded_album text,
  isrc text,
  upc text,
  processor_version text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audio_fingerprints_sha256_idx ON public.audio_fingerprints(sha256);

CREATE TABLE public.audio_match_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  candidate_track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  exact_hash_match boolean NOT NULL DEFAULT false,
  fingerprint_score numeric CHECK (
    fingerprint_score IS NULL OR fingerprint_score BETWEEN 0 AND 1
  ),
  metadata_score numeric CHECK (metadata_score IS NULL OR metadata_score BETWEEN 0 AND 1),
  combined_risk_score numeric NOT NULL DEFAULT 0 CHECK (
    combined_risk_score BETWEEN 0 AND 1
  ),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'needs_evidence', 'dismissed', 'confirmed')
  ),
  reason_codes text[] NOT NULL DEFAULT '{}',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_track_id, candidate_track_id),
  CHECK (source_track_id <> candidate_track_id)
);

CREATE INDEX audio_match_candidates_status_idx
  ON public.audio_match_candidates(status, combined_risk_score DESC);

CREATE TABLE public.moderation_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_type text NOT NULL CHECK (
    case_type IN ('duplicate_upload', 'copyright_report', 'manual_review', 'rights_document')
  ),
  track_id uuid REFERENCES public.tracks(id) ON DELETE SET NULL,
  creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  copyright_report_id uuid REFERENCES public.copyright_reports(id) ON DELETE SET NULL,
  match_candidate_id uuid REFERENCES public.audio_match_candidates(id) ON DELETE SET NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),
  status text NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'reviewing', 'awaiting_creator', 'actioned', 'closed')
  ),
  risk_score numeric CHECK (risk_score IS NULL OR risk_score BETWEEN 0 AND 1),
  reason_codes text[] NOT NULL DEFAULT '{}',
  summary text NOT NULL DEFAULT '',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decision text,
  internal_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE INDEX moderation_cases_status_idx ON public.moderation_cases(status, created_at DESC);
CREATE INDEX moderation_cases_creator_idx ON public.moderation_cases(creator_id, created_at DESC);

CREATE TABLE public.creator_rights_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid REFERENCES public.tracks(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (
    document_type IN (
      'beat_lease', 'split_sheet', 'producer_agreement',
      'copyright_registration', 'license', 'other'
    )
  ),
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  content_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 15728640),
  review_status text NOT NULL DEFAULT 'submitted' CHECK (
    review_status IN ('submitted', 'reviewing', 'accepted_for_record', 'rejected', 'expired')
  ),
  document_date date,
  expires_at date,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes text NOT NULL DEFAULT ''
);

CREATE INDEX creator_rights_documents_creator_idx
  ON public.creator_rights_documents(creator_id, submitted_at DESC);

CREATE TABLE public.moderation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.moderation_cases(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  note text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX moderation_events_case_idx
  ON public.moderation_events(case_id, created_at);

ALTER TABLE public.audio_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_match_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_rights_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.audio_processing_jobs, public.audio_fingerprints,
  public.moderation_cases, public.creator_rights_documents TO authenticated;
GRANT INSERT ON public.creator_rights_documents TO authenticated;
GRANT ALL ON public.audio_processing_jobs, public.audio_fingerprints,
  public.audio_match_candidates, public.moderation_cases,
  public.creator_rights_documents, public.moderation_events TO service_role;

CREATE POLICY "Creators view own processing jobs"
  ON public.audio_processing_jobs FOR SELECT TO authenticated
  USING (creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creators view own fingerprint records"
  ON public.audio_fingerprints FOR SELECT TO authenticated
  USING (creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage match candidates"
  ON public.audio_match_candidates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view moderation cases"
  ON public.moderation_cases FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage moderation cases"
  ON public.moderation_cases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creators view own rights documents"
  ON public.creator_rights_documents FOR SELECT TO authenticated
  USING (creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creators submit own rights documents"
  ON public.creator_rights_documents FOR INSERT TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
    AND review_status = 'submitted'
    AND reviewed_at IS NULL
    AND reviewed_by IS NULL
    AND review_notes = ''
    AND (track_id IS NULL OR EXISTS (
      SELECT 1 FROM public.tracks
      WHERE tracks.id = track_id AND tracks.creator_id = auth.uid()
    ))
  );

CREATE POLICY "Admins manage rights documents"
  ON public.creator_rights_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view moderation events"
  ON public.moderation_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.queue_track_rights_processing(target_track_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job_id uuid;
  owner_id uuid;
BEGIN
  SELECT creator_id INTO owner_id FROM public.tracks WHERE id = target_track_id;
  IF owner_id IS NULL OR (owner_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Track not found or not authorized';
  END IF;

  INSERT INTO public.audio_processing_jobs (
    track_id, creator_id, status, queued_at, started_at, completed_at, last_error
  )
  VALUES (target_track_id, owner_id, 'queued', now(), NULL, NULL, NULL)
  ON CONFLICT (track_id) DO UPDATE SET
    status = 'queued',
    queued_at = now(),
    started_at = NULL,
    completed_at = NULL,
    last_error = NULL,
    updated_at = now()
  RETURNING id INTO job_id;

  RETURN job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.queue_track_rights_processing(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_audio_processing_job(worker_version text)
RETURNS SETOF public.audio_processing_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed_id uuid;
BEGIN
  SELECT id INTO claimed_id
  FROM public.audio_processing_jobs
  WHERE status = 'queued'
  ORDER BY queued_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF claimed_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.audio_processing_jobs
  SET status = 'processing',
      attempt_count = attempt_count + 1,
      processor_version = worker_version,
      started_at = now(),
      completed_at = NULL,
      last_error = NULL,
      updated_at = now()
  WHERE id = claimed_id
  RETURNING *;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_audio_processing_job(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_audio_processing_job(text) TO service_role;

CREATE OR REPLACE FUNCTION public.complete_audio_processing_job(
  target_job_id uuid,
  file_sha256 text,
  audio_chromaprint text,
  audio_chromaprint_algorithm integer,
  measured_duration numeric,
  measured_sample_rate integer,
  measured_bitrate integer,
  measured_file_type text,
  embedded_metadata jsonb,
  worker_version text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_job public.audio_processing_jobs%ROWTYPE;
  duplicate_track_id uuid;
  candidate_id uuid;
BEGIN
  IF file_sha256 !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid SHA-256';
  END IF;

  SELECT * INTO current_job
  FROM public.audio_processing_jobs
  WHERE id = target_job_id AND status = 'processing'
  FOR UPDATE;

  IF current_job.id IS NULL THEN
    RAISE EXCEPTION 'Processing job is not claimable';
  END IF;

  SELECT track_id INTO duplicate_track_id
  FROM public.audio_fingerprints
  WHERE sha256 = file_sha256 AND track_id <> current_job.track_id
  ORDER BY created_at
  LIMIT 1;

  INSERT INTO public.audio_fingerprints (
    track_id, creator_id, sha256, chromaprint, chromaprint_algorithm,
    duration_sec, sample_rate, bitrate, file_type,
    embedded_title, embedded_artist, embedded_album, isrc, upc,
    processor_version, metadata
  )
  VALUES (
    current_job.track_id, current_job.creator_id, file_sha256,
    audio_chromaprint, audio_chromaprint_algorithm, measured_duration,
    measured_sample_rate, measured_bitrate, measured_file_type,
    embedded_metadata->>'title', embedded_metadata->>'artist',
    embedded_metadata->>'album', embedded_metadata->>'isrc',
    embedded_metadata->>'upc', worker_version, COALESCE(embedded_metadata, '{}'::jsonb)
  )
  ON CONFLICT (track_id) DO UPDATE SET
    sha256 = EXCLUDED.sha256,
    chromaprint = EXCLUDED.chromaprint,
    chromaprint_algorithm = EXCLUDED.chromaprint_algorithm,
    duration_sec = EXCLUDED.duration_sec,
    sample_rate = EXCLUDED.sample_rate,
    bitrate = EXCLUDED.bitrate,
    file_type = EXCLUDED.file_type,
    embedded_title = EXCLUDED.embedded_title,
    embedded_artist = EXCLUDED.embedded_artist,
    embedded_album = EXCLUDED.embedded_album,
    isrc = EXCLUDED.isrc,
    upc = EXCLUDED.upc,
    processor_version = EXCLUDED.processor_version,
    metadata = EXCLUDED.metadata,
    updated_at = now();

  IF duplicate_track_id IS NOT NULL THEN
    INSERT INTO public.audio_match_candidates (
      source_track_id, candidate_track_id, exact_hash_match,
      combined_risk_score, reason_codes
    )
    VALUES (
      current_job.track_id, duplicate_track_id, true, 1, ARRAY['exact_sha256_match']
    )
    ON CONFLICT (source_track_id, candidate_track_id) DO UPDATE SET
      exact_hash_match = true,
      combined_risk_score = 1,
      reason_codes = ARRAY['exact_sha256_match'],
      status = 'pending'
    RETURNING id INTO candidate_id;

    INSERT INTO public.moderation_cases (
      case_type, track_id, creator_id, match_candidate_id,
      severity, status, risk_score, reason_codes, summary
    )
    SELECT
      'duplicate_upload', current_job.track_id, current_job.creator_id, candidate_id,
      'high', 'open', 1, ARRAY['exact_sha256_match'],
      'Exact file hash matches another VYBE upload. Human review required.'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.moderation_cases
      WHERE match_candidate_id = candidate_id AND status <> 'closed'
    );
  END IF;

  UPDATE public.audio_processing_jobs
  SET status = CASE WHEN duplicate_track_id IS NULL THEN 'completed' ELSE 'flagged' END,
      completed_at = now(),
      processor_version = worker_version,
      updated_at = now()
  WHERE id = target_job_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_audio_processing_job(
  uuid, text, text, integer, numeric, integer, integer, text, jsonb, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_audio_processing_job(
  uuid, text, text, integer, numeric, integer, integer, text, jsonb, text
) TO service_role;

CREATE OR REPLACE FUNCTION public.fail_audio_processing_job(target_job_id uuid, failure text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.audio_processing_jobs
  SET status = 'failed',
      completed_at = now(),
      last_error = left(failure, 2000),
      updated_at = now()
  WHERE id = target_job_id AND status = 'processing';
$$;

REVOKE EXECUTE ON FUNCTION public.fail_audio_processing_job(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_audio_processing_job(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_new_track_for_rights_processing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audio_processing_jobs (track_id, creator_id)
  VALUES (NEW.id, NEW.creator_id)
  ON CONFLICT (track_id) DO UPDATE SET
    creator_id = EXCLUDED.creator_id,
    status = 'queued',
    queued_at = now(),
    started_at = NULL,
    completed_at = NULL,
    last_error = NULL,
    updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER enqueue_new_track_for_rights_processing
AFTER INSERT ON public.tracks
FOR EACH ROW EXECUTE FUNCTION public.enqueue_new_track_for_rights_processing();

CREATE TRIGGER requeue_replaced_track_for_rights_processing
AFTER UPDATE OF audio_url ON public.tracks
FOR EACH ROW
WHEN (OLD.audio_url IS DISTINCT FROM NEW.audio_url)
EXECUTE FUNCTION public.enqueue_new_track_for_rights_processing();

-- Preserve existing tracks without flooding a processor that has not been connected.
INSERT INTO public.audio_processing_jobs (
  track_id, creator_id, status, completed_at, last_error
)
SELECT
  id, creator_id, 'skipped', now(),
  'Existing track; manually queue after the rights processor is connected.'
FROM public.tracks
ON CONFLICT (track_id) DO NOTHING;

INSERT INTO storage.buckets (
  id, name, public, file_size_limit,
  allowed_mime_types
)
VALUES (
  'creator-rights-documents',
  'creator-rights-documents',
  false,
  15728640,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Creators upload own rights documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'creator-rights-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Creators read own rights documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'creator-rights-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );
