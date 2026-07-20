-- V23: invitation-only creator access and plan entitlements.
-- Existing creators are preserved and grandfathered into founding_beta.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.creator_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_normalized TEXT NOT NULL,
  recipient_name TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  assigned_plan TEXT NOT NULL DEFAULT 'creator_free'
    CHECK (assigned_plan IN ('creator_free', 'creator_plus', 'founding_beta')),
  issued_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  internal_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (email_normalized = lower(trim(email_normalized)))
);

CREATE INDEX creator_invites_email_idx ON public.creator_invites (email_normalized);
CREATE INDEX creator_invites_created_at_idx ON public.creator_invites (created_at DESC);

GRANT SELECT, UPDATE ON public.creator_invites TO authenticated;
GRANT ALL ON public.creator_invites TO service_role;
ALTER TABLE public.creator_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view creator invitations"
  ON public.creator_invites FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can revoke creator invitations"
  ON public.creator_invites FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.account_entitlements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL
    CHECK (plan_code IN ('creator_free', 'creator_plus', 'founding_beta')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'expired', 'revoked')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_invite_id UUID REFERENCES public.creator_invites(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.account_entitlements TO authenticated;
GRANT ALL ON public.account_entitlements TO service_role;
ALTER TABLE public.account_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entitlement"
  ON public.account_entitlements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all entitlements"
  ON public.account_entitlements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER account_entitlements_set_updated_at
  BEFORE UPDATE ON public.account_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Close the previous creator self-enrollment path. Supporters may still join openly.
DROP POLICY IF EXISTS "Users can insert their own initial role" ON public.user_roles;
CREATE POLICY "Users can self-enroll as supporters"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'supporter');

CREATE OR REPLACE FUNCTION public.create_creator_invite(
  _email TEXT,
  _recipient_name TEXT DEFAULT NULL,
  _assigned_plan TEXT DEFAULT 'creator_free',
  _expires_in_days INTEGER DEFAULT 7,
  _internal_note TEXT DEFAULT NULL
)
RETURNS TABLE(invite_id UUID, invite_token TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _token TEXT;
  _id UUID;
  _expires TIMESTAMPTZ;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  IF trim(coalesce(_email, '')) = '' OR position('@' in _email) < 2 THEN
    RAISE EXCEPTION 'A valid recipient email is required';
  END IF;
  IF _assigned_plan NOT IN ('creator_free', 'creator_plus', 'founding_beta') THEN
    RAISE EXCEPTION 'Invalid creator plan';
  END IF;
  IF _expires_in_days < 1 OR _expires_in_days > 30 THEN
    RAISE EXCEPTION 'Invitation expiration must be between 1 and 30 days';
  END IF;

  _token := encode(gen_random_bytes(32), 'hex');
  _expires := now() + make_interval(days => _expires_in_days);

  INSERT INTO public.creator_invites (
    email_normalized, recipient_name, token_hash, assigned_plan,
    issued_by, expires_at, internal_note
  ) VALUES (
    lower(trim(_email)), nullif(trim(_recipient_name), ''),
    encode(digest(_token, 'sha256'), 'hex'), _assigned_plan,
    auth.uid(), _expires, nullif(trim(_internal_note), '')
  ) RETURNING id INTO _id;

  RETURN QUERY SELECT _id, _token, _expires;
END;
$$;

CREATE OR REPLACE FUNCTION public.inspect_creator_invite(_token TEXT)
RETURNS TABLE(
  recipient_hint TEXT,
  assigned_plan TEXT,
  expires_at TIMESTAMPTZ,
  invitation_status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    left(split_part(ci.email_normalized, '@', 1), 2) || '***@' || split_part(ci.email_normalized, '@', 2),
    ci.assigned_plan,
    ci.expires_at,
    CASE
      WHEN ci.revoked_at IS NOT NULL THEN 'revoked'
      WHEN ci.redeemed_at IS NOT NULL THEN 'redeemed'
      WHEN ci.expires_at <= now() THEN 'expired'
      ELSE 'valid'
    END
  FROM public.creator_invites ci
  WHERE ci.token_hash = encode(digest(coalesce(_token, ''), 'sha256'), 'hex')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.redeem_creator_invite(_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _invite public.creator_invites%ROWTYPE;
  _account_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in before redeeming this invitation'; END IF;

  SELECT * INTO _invite
  FROM public.creator_invites
  WHERE token_hash = encode(digest(coalesce(_token, ''), 'sha256'), 'hex')
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  IF _invite.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'This invitation was revoked'; END IF;
  IF _invite.redeemed_at IS NOT NULL THEN RAISE EXCEPTION 'This invitation has already been used'; END IF;
  IF _invite.expires_at <= now() THEN RAISE EXCEPTION 'This invitation has expired'; END IF;

  _account_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  IF _account_email <> _invite.email_normalized THEN
    RAISE EXCEPTION 'This invitation was issued to a different email address';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'creator')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.account_entitlements (
    user_id, plan_code, status, granted_by, source_invite_id
  ) VALUES (
    auth.uid(), _invite.assigned_plan, 'active', _invite.issued_by, _invite.id
  ) ON CONFLICT (user_id) DO UPDATE SET
    plan_code = EXCLUDED.plan_code,
    status = 'active',
    starts_at = now(),
    expires_at = NULL,
    granted_by = EXCLUDED.granted_by,
    source_invite_id = EXCLUDED.source_invite_id;

  UPDATE public.creator_invites
  SET redeemed_at = now(), redeemed_by = auth.uid()
  WHERE id = _invite.id;

  RETURN _invite.assigned_plan;
END;
$$;

REVOKE ALL ON FUNCTION public.create_creator_invite(TEXT, TEXT, TEXT, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_creator_invite(TEXT, TEXT, TEXT, INTEGER, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.inspect_creator_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.inspect_creator_invite(TEXT) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.redeem_creator_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_creator_invite(TEXT) TO authenticated;

-- Preserve every creator already participating in the private beta.
INSERT INTO public.account_entitlements (user_id, plan_code, status)
SELECT user_id, 'founding_beta', 'active'
FROM public.user_roles
WHERE role = 'creator'
ON CONFLICT (user_id) DO NOTHING;
