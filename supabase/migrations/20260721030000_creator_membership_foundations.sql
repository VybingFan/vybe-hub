-- V23.7: data-driven creator plans, First Wave recognition, and server-enforced limits.
-- Founding Creator remains invitation-only. First Wave is recognition on Creator Plus,
-- never a public self-selected plan.

CREATE TABLE public.creator_plan_definitions (
  plan_code text PRIMARY KEY CHECK (plan_code IN ('creator_free', 'creator_plus', 'founding_beta')),
  public_name text NOT NULL,
  description text NOT NULL,
  uploaded_track_limit integer NOT NULL CHECK (uploaded_track_limit > 0),
  published_track_limit integer NOT NULL CHECK (published_track_limit > 0 AND published_track_limit <= uploaded_track_limit),
  max_track_duration_sec integer NOT NULL CHECK (max_track_duration_sec > 0),
  max_audio_bytes integer NOT NULL CHECK (max_audio_bytes > 0),
  published_playlist_limit integer NOT NULL CHECK (published_playlist_limit > 0),
  playlist_track_limit integer NOT NULL CHECK (playlist_track_limit > 0),
  merch_item_limit integer NOT NULL CHECK (merch_item_limit > 0),
  active_connection_limit integer NOT NULL CHECK (active_connection_limit > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.creator_plan_definitions (
  plan_code, public_name, description, uploaded_track_limit, published_track_limit,
  max_track_duration_sec, max_audio_bytes, published_playlist_limit,
  playlist_track_limit, merch_item_limit, active_connection_limit
) VALUES
  ('creator_free', 'Creator Free', 'Build and share a creator home with no credit card required.', 15, 10, 300, 15728640, 8, 10, 2, 100),
  ('creator_plus', 'Creator Plus', 'More capacity for creators actively growing their audience.', 40, 30, 300, 20971520, 20, 25, 10, 2500),
  ('founding_beta', 'Founding Creator', 'Invitation-only testing access tied to an approved founding commitment.', 100, 75, 1200, 52428800, 60, 50, 25, 10000)
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
  updated_at = now();

GRANT SELECT ON public.creator_plan_definitions TO authenticated;
GRANT ALL ON public.creator_plan_definitions TO service_role;
ALTER TABLE public.creator_plan_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in members can read creator plans"
  ON public.creator_plan_definitions FOR SELECT TO authenticated USING (true);
CREATE TRIGGER creator_plan_definitions_set_updated_at
  BEFORE UPDATE ON public.creator_plan_definitions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.account_entitlements
  ADD COLUMN recognition_code text,
  ADD CONSTRAINT account_entitlements_recognition_check
    CHECK (recognition_code IS NULL OR recognition_code = 'first_wave'),
  ADD CONSTRAINT first_wave_requires_creator_plus
    CHECK (recognition_code IS NULL OR plan_code = 'creator_plus');

CREATE OR REPLACE FUNCTION public.active_creator_plan(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.has_role(_user_id, 'admin') THEN 'founding_beta'
    ELSE coalesce(
      (SELECT ae.plan_code FROM public.account_entitlements ae
       WHERE ae.user_id = _user_id
         AND ae.status = 'active'
         AND (ae.expires_at IS NULL OR ae.expires_at > now())),
      'creator_free'
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.creator_plan_limit(_user_id uuid, _limit_name text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _limit_name
    WHEN 'uploaded_tracks' THEN p.uploaded_track_limit
    WHEN 'published_tracks' THEN p.published_track_limit
    WHEN 'track_duration_sec' THEN p.max_track_duration_sec
    WHEN 'audio_bytes' THEN p.max_audio_bytes
    WHEN 'published_playlists' THEN p.published_playlist_limit
    WHEN 'playlist_tracks' THEN p.playlist_track_limit
    WHEN 'merch_items' THEN p.merch_item_limit
    WHEN 'active_connections' THEN p.active_connection_limit
    ELSE NULL
  END
  FROM public.creator_plan_definitions p
  WHERE p.plan_code = public.active_creator_plan(_user_id);
$$;

-- Keep profile imagery independent while making music and merch storage economical.
UPDATE storage.buckets SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp3']
WHERE id = 'music-audio';
UPDATE storage.buckets SET file_size_limit = 2097152
WHERE id = 'music-covers';

DROP POLICY IF EXISTS "Users write own folder in music/avatar buckets" ON storage.objects;
CREATE POLICY "Users write own folder in music/avatar buckets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid()::text = (storage.foldername(name))[1]
    AND (
      (bucket_id = 'avatars'
        AND (metadata ->> 'size')::bigint <= 8388608
        AND (metadata ->> 'mimetype') IN ('image/jpeg', 'image/png', 'image/webp'))
      OR
      (bucket_id = 'music-covers'
        AND (metadata ->> 'size')::bigint <= 2097152
        AND (metadata ->> 'mimetype') IN ('image/jpeg', 'image/png', 'image/webp'))
      OR
      (bucket_id = 'music-audio'
        AND (metadata ->> 'size')::bigint <= public.creator_plan_limit(auth.uid(), 'audio_bytes')
        AND (metadata ->> 'mimetype') IN ('audio/mpeg', 'audio/mp3'))
    )
  );

CREATE OR REPLACE FUNCTION public.enforce_creator_track_limits()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  uploaded_count integer;
  published_count integer;
BEGIN
  IF NEW.duration_sec > public.creator_plan_limit(NEW.creator_id, 'track_duration_sec') THEN
    RAISE EXCEPTION 'This song exceeds your plan''s maximum track length';
  END IF;
  IF TG_OP = 'INSERT' THEN
    SELECT count(*) INTO uploaded_count FROM public.tracks WHERE creator_id = NEW.creator_id;
    IF uploaded_count >= public.creator_plan_limit(NEW.creator_id, 'uploaded_tracks') THEN
      RAISE EXCEPTION 'Your music library is full for this plan';
    END IF;
  END IF;
  IF NEW.status = 'published' AND
     (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status <> 'published')) THEN
    SELECT count(*) INTO published_count FROM public.tracks
      WHERE creator_id = NEW.creator_id AND status = 'published';
    IF published_count >= public.creator_plan_limit(NEW.creator_id, 'published_tracks') THEN
      RAISE EXCEPTION 'You have reached your published-song limit; unpublish one song or upgrade';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER enforce_creator_track_limits
  BEFORE INSERT OR UPDATE OF status, duration_sec ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_creator_track_limits();

CREATE OR REPLACE FUNCTION public.enforce_creator_playlist_limits()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_published AND
     (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.is_published IS DISTINCT FROM true)) AND
     (SELECT count(*) FROM public.playlists WHERE creator_id = NEW.creator_id AND is_published) >=
       public.creator_plan_limit(NEW.creator_id, 'published_playlists') THEN
    RAISE EXCEPTION 'You have reached your published-playlist limit';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER enforce_creator_playlist_limits
  BEFORE INSERT OR UPDATE OF is_published ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION public.enforce_creator_playlist_limits();

CREATE OR REPLACE FUNCTION public.enforce_playlist_track_limit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE owner_id uuid;
BEGIN
  SELECT creator_id INTO owner_id FROM public.playlists WHERE id = NEW.playlist_id;
  IF (SELECT count(*) FROM public.playlist_tracks WHERE playlist_id = NEW.playlist_id) >=
     public.creator_plan_limit(owner_id, 'playlist_tracks') THEN
    RAISE EXCEPTION 'This playlist has reached your plan''s song limit';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER enforce_playlist_track_limit
  BEFORE INSERT ON public.playlist_tracks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_playlist_track_limit();

CREATE OR REPLACE FUNCTION public.enforce_creator_merch_limit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.merch_products WHERE creator_id = NEW.creator_id) >=
     public.creator_plan_limit(NEW.creator_id, 'merch_items') THEN
    RAISE EXCEPTION 'You have reached your merchandise showcase limit';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER enforce_creator_merch_limit
  BEFORE INSERT ON public.merch_products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_creator_merch_limit();

CREATE OR REPLACE FUNCTION public.enforce_creator_connection_limit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status <> 'archived' AND
     (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status = 'archived')) AND
     (SELECT count(*) FROM public.listener_connections
      WHERE creator_id = NEW.creator_id AND status <> 'archived') >=
       public.creator_plan_limit(NEW.creator_id, 'active_connections') THEN
    RAISE EXCEPTION 'This creator has reached the active connection limit';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER enforce_creator_connection_limit
  BEFORE INSERT OR UPDATE OF status ON public.listener_connections
  FOR EACH ROW EXECUTE FUNCTION public.enforce_creator_connection_limit();

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

REVOKE ALL ON FUNCTION public.active_creator_plan(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.active_creator_plan(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.creator_plan_limit(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.creator_plan_limit(uuid, text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_my_creator_membership() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_creator_membership() TO authenticated;
