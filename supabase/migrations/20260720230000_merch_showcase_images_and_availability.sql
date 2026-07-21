ALTER TABLE public.merch_products
  ADD COLUMN image_path text,
  ADD COLUMN availability text NOT NULL DEFAULT 'coming_soon'
    CHECK (availability IN ('coming_soon', 'available_externally', 'unavailable', 'sold_out'));

-- Public artist pages may sign only images attached to visible merch products.
CREATE POLICY "Visible merch images can be signed"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'music-covers' AND EXISTS (
    SELECT 1 FROM public.merch_products product
    JOIN public.creator_profiles creator ON creator.user_id = product.creator_id
    WHERE product.image_path = name
      AND product.is_active
      AND creator.username IS NOT NULL
  ));
