-- V24.74B R2A
-- Preserve multi-identity onboarding while ensuring that adding a Creator identity
-- provisions Creator Free only when the account has no creator entitlement yet.
-- Existing paid/founding entitlements are never overwritten.

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

    INSERT INTO public.account_entitlements (user_id, plan_code, status)
    VALUES (auth.uid(), 'creator_free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN _role;
END;
$$;

REVOKE ALL ON FUNCTION public.select_initial_role(public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.select_initial_role(public.app_role) TO authenticated;
