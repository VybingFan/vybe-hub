-- V24.7: creator video metadata, publishing, and provider-ready playback.
-- Native Cloudflare Stream uploads are activated separately after Stream billing
-- and server credentials are configured. This table also supports safe YouTube
-- and Vimeo embeds immediately.

ALTER TABLE public.creator_plan_definitions
  ADD COLUMN IF NOT EXISTS hosted_video_limit integer NOT NULL DEFAULT 0
    CHECK (hosted_video_limit >= 0);

UPDATE public.creator_plan_definitions
SET hosted_video_limit = CASE plan_code
  WHEN 'creator_free' THEN 1
  WHEN 'creator_plus' THEN 10
  WHEN 'creator_pro' THEN 50
  WHEN 'creator_studio' THEN 200
  WHEN 'founding_beta' THEN 50
  ELSE 0
END;

CREATE TABLE public.creator_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 160),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 5000),
  video_type text NOT NULL DEFAULT 'music_video'
    CHECK (video_type IN (
      'music_video', 'performance', 'interview', 'behind_the_scenes',
      'trailer', 'short_film', 'episode', 'other'
    )),
  provider text NOT NULL
    CHECK (provider IN ('youtube', 'vimeo', 'cloudflare_stream')),
  provider_video_id text NOT NULL CHECK (char_length(trim(provider_video_id)) > 0),
  source_url text,
  thumbnail_url text,
  duration_sec integer CHECK (duration_sec IS NULL OR duration_sec >= 0),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'processing', 'published', 'failed')),
  visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'unlisted', 'private')),
  rights_confirmed boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_id, provider, provider_video_id)
);

CREATE INDEX creator_videos_creator_idx
  ON public.creator_videos (creator_id, created_at DESC);
CREATE INDEX creator_videos_public_idx
  ON public.creator_videos (status, visibility, created_at DESC)
  WHERE status = 'published' AND visibility IN ('public', 'unlisted');

GRANT SELECT ON public.creator_videos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.creator_videos TO authenticated;
GRANT ALL ON public.creator_videos TO service_role;

ALTER TABLE public.creator_videos ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.enforce_creator_video_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _limit integer;
  _used integer;
BEGIN
  SELECT hosted_video_limit INTO _limit
  FROM public.creator_plan_definitions
  WHERE plan_code = public.active_creator_plan(NEW.creator_id);

  SELECT count(*) INTO _used
  FROM public.creator_videos
  WHERE creator_id = NEW.creator_id;

  IF _used >= coalesce(_limit, 0) THEN
    RAISE EXCEPTION 'Your membership video limit has been reached';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER creator_videos_enforce_limit
  BEFORE INSERT ON public.creator_videos
  FOR EACH ROW EXECUTE FUNCTION public.enforce_creator_video_limit();

CREATE POLICY "Published videos are publicly viewable"
  ON public.creator_videos FOR SELECT TO anon, authenticated
  USING (
    (status = 'published' AND visibility IN ('public', 'unlisted'))
    OR creator_id = auth.uid()
  );

CREATE POLICY "Creators insert own videos"
  ON public.creator_videos FOR INSERT TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
    AND public.has_role(auth.uid(), 'creator')
    AND rights_confirmed
  );

CREATE POLICY "Creators update own videos"
  ON public.creator_videos FOR UPDATE TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (
    creator_id = auth.uid()
    AND public.has_role(auth.uid(), 'creator')
    AND rights_confirmed
  );

CREATE POLICY "Creators delete own videos"
  ON public.creator_videos FOR DELETE TO authenticated
  USING (creator_id = auth.uid());

CREATE TRIGGER creator_videos_set_updated_at
  BEFORE UPDATE ON public.creator_videos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
