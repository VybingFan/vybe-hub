-- VYBE V24.35 - Creator music privacy, previews, and protected sharing
BEGIN;

ALTER TABLE public.tracks
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public','unlisted','private','scheduled','archived')),
  ADD COLUMN IF NOT EXISTS playback_mode text NOT NULL DEFAULT 'full'
    CHECK (playback_mode IN ('full','preview','none','membership_only','approved_listeners')),
  ADD COLUMN IF NOT EXISTS preview_duration_sec integer NOT NULL DEFAULT 30
    CHECK (preview_duration_sec IN (15,30,45,60)),
  ADD COLUMN IF NOT EXISTS preview_start_sec integer NOT NULL DEFAULT 0 CHECK (preview_start_sec >= 0),
  ADD COLUMN IF NOT EXISTS preview_audio_path text,
  ADD COLUMN IF NOT EXISTS available_from timestamptz,
  ADD COLUMN IF NOT EXISTS available_until timestamptz,
  ADD COLUMN IF NOT EXISTS required_plan_code text,
  ADD COLUMN IF NOT EXISTS allow_download boolean NOT NULL DEFAULT false;

ALTER TABLE public.playlists
  ADD COLUMN IF NOT EXISTS access_mode text NOT NULL DEFAULT 'public'
    CHECK (access_mode IN ('public','unlisted','password','approved_listeners','membership_only')),
  ADD COLUMN IF NOT EXISTS access_password_hash text,
  ADD COLUMN IF NOT EXISTS access_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS required_plan_code text,
  ADD COLUMN IF NOT EXISTS require_sign_in boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.playlist_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  email_normalized text,
  token_hash text UNIQUE,
  expires_at timestamptz,
  max_plays integer CHECK (max_plays IS NULL OR max_plays > 0),
  play_count integer NOT NULL DEFAULT 0,
  revoked_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email_normalized IS NULL OR email_normalized = lower(trim(email_normalized)))
);

CREATE TABLE IF NOT EXISTS public.track_access_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  playlist_id uuid REFERENCES public.playlists(id) ON DELETE SET NULL,
  listener_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  access_type text NOT NULL,
  seconds_played integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('music-previews','music-previews',false,52428800,ARRAY['audio/wav','audio/mpeg','audio/mp3'])
ON CONFLICT (id) DO UPDATE SET public=false;

DROP POLICY IF EXISTS "Creators manage own music previews" ON storage.objects;
CREATE POLICY "Creators manage own music previews"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id='music-previews' AND (storage.foldername(name))[1]=auth.uid()::text)
WITH CHECK (bucket_id='music-previews' AND (storage.foldername(name))[1]=auth.uid()::text);

CREATE INDEX IF NOT EXISTS tracks_public_privacy_idx
ON public.tracks(status, visibility, playback_mode, available_from);

ALTER TABLE public.playlist_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_access_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage playlist access grants"
ON public.playlist_access_grants FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.playlists p WHERE p.id=playlist_id AND p.creator_id=auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.playlists p WHERE p.id=playlist_id AND p.creator_id=auth.uid()));

CREATE POLICY "Creators view own track access events"
ON public.track_access_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.tracks t WHERE t.id=track_id AND t.creator_id=auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlist_access_grants TO authenticated;
GRANT SELECT ON public.track_access_events TO authenticated;
GRANT ALL ON public.playlist_access_grants, public.track_access_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.track_access_events_id_seq TO service_role;

COMMIT;
