ALTER TABLE public.creator_profiles
  ADD COLUMN genres text[] NOT NULL DEFAULT '{}',
  ADD COLUMN avatar_path text,
  ADD COLUMN cover_path text;

UPDATE public.creator_profiles SET genres = ARRAY[genre]
WHERE genre <> '' AND cardinality(genres) = 0;

ALTER TABLE public.creator_profiles
  ADD CONSTRAINT creator_profiles_genres_limit CHECK (cardinality(genres) <= 5);

CREATE TABLE public.merch_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Other',
  image_url text,
  price_cents integer CHECK (price_cents IS NULL OR price_cents >= 0),
  currency text NOT NULL DEFAULT 'USD',
  purchase_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX merch_products_creator_idx ON public.merch_products (creator_id, created_at DESC);
GRANT SELECT ON public.merch_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.merch_products TO authenticated;
GRANT ALL ON public.merch_products TO service_role;
ALTER TABLE public.merch_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active merch on named artist pages is public"
  ON public.merch_products FOR SELECT TO anon, authenticated
  USING (is_active AND EXISTS (
    SELECT 1 FROM public.creator_profiles cp
    WHERE cp.user_id = creator_id AND cp.username IS NOT NULL
  ) OR creator_id = auth.uid());
CREATE POLICY "Creators insert own merch"
  ON public.merch_products FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid() AND public.has_role(auth.uid(), 'creator'));
CREATE POLICY "Creators update own merch"
  ON public.merch_products FOR UPDATE TO authenticated
  USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Creators delete own merch"
  ON public.merch_products FOR DELETE TO authenticated USING (creator_id = auth.uid());

CREATE TRIGGER merch_products_set_updated_at
  BEFORE UPDATE ON public.merch_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public artist pages may request signed versions of only the avatar/banner
-- objects explicitly attached to a named public creator profile.
CREATE POLICY "Named creator profile images can be signed"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'avatars' AND EXISTS (
    SELECT 1 FROM public.creator_profiles cp
    WHERE cp.username IS NOT NULL AND (cp.avatar_path = name OR cp.cover_path = name)
  ));
