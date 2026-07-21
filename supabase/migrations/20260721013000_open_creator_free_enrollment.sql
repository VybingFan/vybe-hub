-- V23.1: public users may choose Creator Free or Supporter.
-- Founding Beta and Creator Plus still require an administrator grant/invitation.

DROP POLICY IF EXISTS "Users can self-enroll as supporters" ON public.user_roles;

CREATE OR REPLACE FUNCTION public.select_initial_role(_role public.app_role)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in before selecting an account type';
  END IF;
  IF _role NOT IN ('creator', 'supporter') THEN
    RAISE EXCEPTION 'Only Creator Free or Supporter may be selected during public onboarding';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _role = 'creator' THEN
    INSERT INTO public.account_entitlements (user_id, plan_code, status)
    VALUES (auth.uid(), 'creator_free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN _role;
END;
$$;

REVOKE ALL ON FUNCTION public.select_initial_role(public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.select_initial_role(public.app_role) TO authenticated;
