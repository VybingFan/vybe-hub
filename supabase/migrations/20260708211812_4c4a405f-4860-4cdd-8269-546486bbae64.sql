
CREATE TABLE public.creator_profiles (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_name text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  genre text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  avatar_url text,
  cover_url text,
  website text,
  instagram text,
  facebook text,
  tiktok text,
  youtube text,
  spotify text,
  apple_music text,
  x text,
  personal_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_profiles TO authenticated;
GRANT ALL ON public.creator_profiles TO service_role;

ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator profiles viewable by authenticated users"
  ON public.creator_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Creators can insert own profile"
  ON public.creator_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Creators can update own profile"
  ON public.creator_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can delete own profile"
  ON public.creator_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER creator_profiles_set_updated_at
  BEFORE UPDATE ON public.creator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
