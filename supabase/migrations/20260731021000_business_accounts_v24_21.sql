-- V24.21 step 2: business self-enrollment, ownership, and protected profile access.

CREATE UNIQUE INDEX IF NOT EXISTS business_profiles_owner_unique_idx
  ON public.business_profiles(owner_user_id)
  WHERE owner_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.select_initial_role(_role public.app_role)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF _role NOT IN ('creator', 'supporter', 'business') THEN
    RAISE EXCEPTION 'Unsupported initial role';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _role = 'creator' THEN
    INSERT INTO public.creator_profiles (user_id)
    VALUES (auth.uid())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN _role;
END;
$$;

REVOKE ALL ON FUNCTION public.select_initial_role(public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.select_initial_role(public.app_role) TO authenticated;

CREATE POLICY "Business owners view their profile"
  ON public.business_profiles FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid() AND public.has_role(auth.uid(), 'business'));

CREATE POLICY "Business owners create their pending profile"
  ON public.business_profiles FOR INSERT TO authenticated
  WITH CHECK (
    owner_user_id = auth.uid()
    AND created_by = auth.uid()
    AND public.has_role(auth.uid(), 'business')
    AND verification_status = 'pending'
    AND partner_status = 'prospect'
  );

CREATE POLICY "Business owners update their profile"
  ON public.business_profiles FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid() AND public.has_role(auth.uid(), 'business'))
  WITH CHECK (owner_user_id = auth.uid() AND public.has_role(auth.uid(), 'business'));

CREATE OR REPLACE FUNCTION public.protect_business_review_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
    OR NEW.partner_status IS DISTINCT FROM OLD.partner_status
    OR NEW.package_code IS DISTINCT FROM OLD.package_code
    OR NEW.package_started_at IS DISTINCT FROM OLD.package_started_at
    OR NEW.package_ends_at IS DISTINCT FROM OLD.package_ends_at
    OR NEW.founding_partner IS DISTINCT FROM OLD.founding_partner
    OR NEW.internal_notes IS DISTINCT FROM OLD.internal_notes THEN
    RAISE EXCEPTION 'Administrator review fields cannot be changed by a business account';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_business_review_fields
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_business_review_fields();

CREATE POLICY "Business owners view their campaigns"
  ON public.business_campaigns FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles b
      WHERE b.id = business_campaigns.business_id AND b.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners view their offers"
  ON public.business_offers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles b
      WHERE b.id = business_offers.business_id AND b.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners view their creatives"
  ON public.business_campaign_creatives FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_campaigns c
      JOIN public.business_profiles b ON b.id = c.business_id
      WHERE c.id = business_campaign_creatives.campaign_id AND b.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners view their placements"
  ON public.business_campaign_placements FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_campaigns c
      JOIN public.business_profiles b ON b.id = c.business_id
      WHERE c.id = business_campaign_placements.campaign_id AND b.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners view partner documents"
  ON public.business_partner_documents FOR SELECT TO authenticated
  USING (
    visibility = 'partner'
    AND EXISTS (
      SELECT 1 FROM public.business_profiles b
      WHERE b.id = business_partner_documents.business_id AND b.owner_user_id = auth.uid()
    )
  );
