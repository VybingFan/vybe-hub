-- VYBE V24.31.1 Creator EPK & Industry Kit foundation
-- REVIEW ONLY. Apply only after dry-run and explicit authorization.

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'creator-epk-assets',
    'creator-epk-assets',
    false,
    26214400,
    ARRAY[
      'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
      'application/pdf'
    ]::text[]
  ),
  (
    'creator-audio-masters',
    'creator-audio-masters',
    false,
    209715200,
    ARRAY['audio/wav', 'audio/x-wav']::text[]
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS public.creator_epk_profiles (
  creator_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  visibility text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'unlisted', 'public')),
  slug text UNIQUE,
  short_bio text NOT NULL DEFAULT '' CHECK (char_length(short_bio) <= 1000),
  medium_bio text NOT NULL DEFAULT '' CHECK (char_length(medium_bio) <= 3000),
  long_bio text NOT NULL DEFAULT '' CHECK (char_length(long_bio) <= 10000),
  business_email text NOT NULL DEFAULT '' CHECK (char_length(business_email) <= 320),
  booking_email text NOT NULL DEFAULT '' CHECK (char_length(booking_email) <= 320),
  booking_phone text NOT NULL DEFAULT '' CHECK (char_length(booking_phone) <= 40),
  booking_contact_name text NOT NULL DEFAULT '' CHECK (char_length(booking_contact_name) <= 160),
  management_name text NOT NULL DEFAULT '' CHECK (char_length(management_name) <= 160),
  management_email text NOT NULL DEFAULT '' CHECK (char_length(management_email) <= 320),
  publicist_name text NOT NULL DEFAULT '' CHECK (char_length(publicist_name) <= 160),
  publicist_email text NOT NULL DEFAULT '' CHECK (char_length(publicist_email) <= 320),
  bandcamp_url text NOT NULL DEFAULT '' CHECK (char_length(bandcamp_url) <= 500),
  primary_color text NOT NULL DEFAULT ''
    CHECK (primary_color = '' OR primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color text NOT NULL DEFAULT ''
    CHECK (secondary_color = '' OR secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color text NOT NULL DEFAULT ''
    CHECK (accent_color = '' OR accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  public_business_email boolean NOT NULL DEFAULT false,
  public_booking_email boolean NOT NULL DEFAULT true,
  public_booking_phone boolean NOT NULL DEFAULT false,
  public_management_contact boolean NOT NULL DEFAULT false,
  public_publicist_contact boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (slug IS NULL OR slug ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  CHECK (status <> 'published' OR visibility <> 'private')
);

CREATE TABLE IF NOT EXISTS public.creator_epk_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type text NOT NULL
    CHECK (asset_type IN ('press_photo', 'logo', 'show_flyer', 'tech_rider', 'press_document', 'other')),
  storage_bucket text NOT NULL DEFAULT 'creator-epk-assets'
    CHECK (storage_bucket = 'creator-epk-assets'),
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL CHECK (char_length(original_filename) BETWEEN 1 AND 255),
  content_type text NOT NULL CHECK (char_length(content_type) BETWEEN 1 AND 150),
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 26214400),
  orientation text CHECK (orientation IS NULL OR orientation IN ('horizontal', 'vertical', 'square', 'document')),
  title text NOT NULL DEFAULT '' CHECK (char_length(title) <= 200),
  caption text NOT NULL DEFAULT '' CHECK (char_length(caption) <= 1000),
  alt_text text NOT NULL DEFAULT '' CHECK (char_length(alt_text) <= 500),
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  is_featured boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (storage_path LIKE creator_id::text || '/%')
);

CREATE TABLE IF NOT EXISTS public.creator_audio_masters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  storage_bucket text NOT NULL DEFAULT 'creator-audio-masters'
    CHECK (storage_bucket = 'creator-audio-masters'),
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL CHECK (char_length(original_filename) BETWEEN 1 AND 255),
  content_type text NOT NULL CHECK (content_type IN ('audio/wav', 'audio/x-wav')),
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 209715200),
  sample_rate_hz integer CHECK (sample_rate_hz IS NULL OR sample_rate_hz BETWEEN 8000 AND 384000),
  bit_depth integer CHECK (bit_depth IS NULL OR bit_depth IN (16, 24, 32)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_id, track_id),
  CHECK (storage_path LIKE creator_id::text || '/%')
);

CREATE TABLE IF NOT EXISTS public.creator_track_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  credit_role text NOT NULL
    CHECK (credit_role IN ('writer', 'producer', 'featured_artist', 'performer', 'engineer', 'mixer', 'mastering', 'publisher', 'label', 'other')),
  credited_name text NOT NULL CHECK (char_length(trim(credited_name)) BETWEEN 1 AND 200),
  details text NOT NULL DEFAULT '' CHECK (char_length(details) <= 1000),
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_epk_featured_tracks (
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  spotify_url text NOT NULL DEFAULT '' CHECK (char_length(spotify_url) <= 500),
  apple_music_url text NOT NULL DEFAULT '' CHECK (char_length(apple_music_url) <= 500),
  bandcamp_url text NOT NULL DEFAULT '' CHECK (char_length(bandcamp_url) <= 500),
  include_lyrics boolean NOT NULL DEFAULT true,
  include_credits boolean NOT NULL DEFAULT true,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (creator_id, track_id)
);

CREATE TABLE IF NOT EXISTS public.creator_epk_press_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  highlight_type text NOT NULL
    CHECK (highlight_type IN ('press_quote', 'playlist_placement', 'radio', 'show', 'award', 'milestone', 'other')),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 240),
  source_name text NOT NULL DEFAULT '' CHECK (char_length(source_name) <= 200),
  quote_text text NOT NULL DEFAULT '' CHECK (char_length(quote_text) <= 2000),
  source_url text NOT NULL DEFAULT '' CHECK (char_length(source_url) <= 500),
  occurred_on date,
  asset_id uuid REFERENCES public.creator_epk_assets(id) ON DELETE SET NULL,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creator_epk_assets_creator_order_idx
  ON public.creator_epk_assets (creator_id, asset_type, display_order, created_at);
CREATE INDEX IF NOT EXISTS creator_audio_masters_creator_track_idx
  ON public.creator_audio_masters (creator_id, track_id);
CREATE INDEX IF NOT EXISTS creator_track_credits_track_order_idx
  ON public.creator_track_credits (track_id, display_order, created_at);
CREATE INDEX IF NOT EXISTS creator_epk_featured_tracks_order_idx
  ON public.creator_epk_featured_tracks (creator_id, display_order, created_at);
CREATE INDEX IF NOT EXISTS creator_epk_press_highlights_order_idx
  ON public.creator_epk_press_highlights (creator_id, display_order, created_at);

CREATE OR REPLACE FUNCTION public.touch_creator_epk_updated_at_v24_31()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_creator_epk_updated_at_v24_31() FROM PUBLIC;

DO $$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'creator_epk_profiles',
    'creator_epk_assets',
    'creator_audio_masters',
    'creator_track_credits',
    'creator_epk_featured_tracks',
    'creator_epk_press_highlights'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'touch_' || target_table || '_updated_at', target_table);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_creator_epk_updated_at_v24_31()',
      'touch_' || target_table || '_updated_at',
      target_table
    );
  END LOOP;
END
$$;

ALTER TABLE public.creator_epk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_epk_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_audio_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_track_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_epk_featured_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_epk_press_highlights ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'creator_epk_profiles',
    'creator_epk_assets',
    'creator_audio_masters',
    'creator_track_credits',
    'creator_epk_featured_tracks',
    'creator_epk_press_highlights'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Creators manage own ' || target_table, target_table);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (creator_id = auth.uid() OR public.has_admin_permission(auth.uid(), ''admin.creator.manage'')) WITH CHECK (creator_id = auth.uid() OR public.has_admin_permission(auth.uid(), ''admin.creator.manage''))',
      'Creators manage own ' || target_table,
      target_table
    );
  END LOOP;
END
$$;

DROP POLICY IF EXISTS "Creators read own EPK storage" ON storage.objects;
CREATE POLICY "Creators read own EPK storage"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('creator-epk-assets', 'creator-audio-masters')
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_admin_permission(auth.uid(), 'admin.creator.manage')
  )
);

DROP POLICY IF EXISTS "Creators upload own EPK storage" ON storage.objects;
CREATE POLICY "Creators upload own EPK storage"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('creator-epk-assets', 'creator-audio-masters')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Creators update own EPK storage" ON storage.objects;
CREATE POLICY "Creators update own EPK storage"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('creator-epk-assets', 'creator-audio-masters')
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id IN ('creator-epk-assets', 'creator-audio-masters')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Creators delete own EPK storage" ON storage.objects;
CREATE POLICY "Creators delete own EPK storage"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('creator-epk-assets', 'creator-audio-masters')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public EPK asset access is intentionally deferred until the public EPK read model is built.
-- Contact information therefore remains creator/admin only in this foundation release.

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.creator_epk_profiles,
  public.creator_epk_assets,
  public.creator_audio_masters,
  public.creator_track_credits,
  public.creator_epk_featured_tracks,
  public.creator_epk_press_highlights
TO authenticated;

GRANT ALL ON
  public.creator_epk_profiles,
  public.creator_epk_assets,
  public.creator_audio_masters,
  public.creator_track_credits,
  public.creator_epk_featured_tracks,
  public.creator_epk_press_highlights
TO service_role;

COMMENT ON TABLE public.creator_epk_profiles IS
  'Creator-owned professional contact, branding, biography override, publication, and visibility settings for the VYBE EPK.';
COMMENT ON TABLE public.creator_epk_assets IS
  'Creator-owned press photos, logos, flyers, technical riders, and supporting EPK documents.';
COMMENT ON TABLE public.creator_audio_masters IS
  'Creator-owned WAV master associated with an existing VYBE track; never public by default.';
COMMENT ON TABLE public.creator_track_credits IS
  'Structured writer, producer, performer, engineering, publishing, label, and other track credits.';
COMMENT ON TABLE public.creator_epk_featured_tracks IS
  'Creator-selected VYBE tracks and per-track external streaming links for the EPK.';
COMMENT ON TABLE public.creator_epk_press_highlights IS
  'Creator-owned press quotes, placements, performances, awards, and milestones selected for the EPK.';

COMMIT;
