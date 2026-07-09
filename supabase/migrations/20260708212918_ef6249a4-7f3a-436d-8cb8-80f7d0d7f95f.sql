
-- ============ Supporter profiles ============
CREATE TABLE public.supporter_profiles (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  username text NOT NULL,
  bio text NOT NULL DEFAULT '',
  avatar_url text,
  location text NOT NULL DEFAULT '',
  favorite_genres text[] NOT NULL DEFAULT '{}',
  favorite_artists text[] NOT NULL DEFAULT '{}',
  website text,
  instagram text,
  x text,
  tiktok text,
  personal_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX supporter_profiles_username_key ON public.supporter_profiles (lower(username));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supporter_profiles TO authenticated;
GRANT ALL ON public.supporter_profiles TO service_role;
ALTER TABLE public.supporter_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supporter profiles viewable by authenticated"
  ON public.supporter_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own supporter profile"
  ON public.supporter_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own supporter profile"
  ON public.supporter_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own supporter profile"
  ON public.supporter_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER supporter_profiles_set_updated_at
  BEFORE UPDATE ON public.supporter_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Content status enum ============
CREATE TYPE public.content_status AS ENUM ('draft', 'published');

-- ============ Albums ============
CREATE TABLE public.albums (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_url text,
  genre text NOT NULL DEFAULT '',
  release_date date,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX albums_creator_idx ON public.albums (creator_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.albums TO authenticated;
GRANT ALL ON public.albums TO service_role;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published albums viewable by authenticated"
  ON public.albums FOR SELECT TO authenticated
  USING (status = 'published' OR creator_id = auth.uid());
CREATE POLICY "Creators insert own albums"
  ON public.albums FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id AND public.has_role(auth.uid(), 'creator'));
CREATE POLICY "Creators update own albums"
  ON public.albums FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators delete own albums"
  ON public.albums FOR DELETE TO authenticated USING (auth.uid() = creator_id);

CREATE TRIGGER albums_set_updated_at
  BEFORE UPDATE ON public.albums
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Tracks ============
CREATE TABLE public.tracks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  album_id uuid REFERENCES public.albums(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  audio_url text NOT NULL,
  cover_url text,
  genre text NOT NULL DEFAULT '',
  release_date date,
  duration_sec integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  status public.content_status NOT NULL DEFAULT 'draft',
  track_number integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tracks_creator_idx ON public.tracks (creator_id);
CREATE INDEX tracks_album_idx ON public.tracks (album_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracks TO authenticated;
GRANT ALL ON public.tracks TO service_role;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published tracks viewable by authenticated"
  ON public.tracks FOR SELECT TO authenticated
  USING (status = 'published' OR creator_id = auth.uid());
CREATE POLICY "Creators insert own tracks"
  ON public.tracks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id AND public.has_role(auth.uid(), 'creator'));
CREATE POLICY "Creators update own tracks"
  ON public.tracks FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators delete own tracks"
  ON public.tracks FOR DELETE TO authenticated USING (auth.uid() = creator_id);

CREATE TRIGGER tracks_set_updated_at
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Follows ============
CREATE TABLE public.follows (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, creator_id)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows viewable by authenticated"
  ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own follows"
  ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users delete own follows"
  ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- ============ Track likes ============
CREATE TABLE public.track_likes (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, track_id)
);
GRANT SELECT, INSERT, DELETE ON public.track_likes TO authenticated;
GRANT ALL ON public.track_likes TO service_role;
ALTER TABLE public.track_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Track likes viewable by authenticated"
  ON public.track_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own track likes"
  ON public.track_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own track likes"
  ON public.track_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
