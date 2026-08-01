-- VYBE V24.28 - Administrator Team Invitations and Permission Roles

BEGIN;

CREATE TABLE public.admin_roles (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  is_system boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (code = lower(trim(code)) AND code ~ '^[a-z][a-z0-9_]*$')
);

CREATE TABLE public.admin_permissions (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (code = lower(trim(code)) AND code ~ '^[a-z][a-z0-9_.]*$')
);

CREATE TABLE public.admin_role_permissions (
  role_code text NOT NULL REFERENCES public.admin_roles(code) ON DELETE RESTRICT,
  permission_code text NOT NULL REFERENCES public.admin_permissions(code) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_code, permission_code)
);

CREATE TABLE public.admin_team_members (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  activated_at timestamptz NOT NULL DEFAULT now(),
  suspended_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (status = 'active' AND suspended_at IS NULL AND revoked_at IS NULL)
    OR (status = 'suspended' AND suspended_at IS NOT NULL AND revoked_at IS NULL)
    OR (status = 'revoked' AND revoked_at IS NOT NULL)
  )
);

CREATE TABLE public.admin_team_member_roles (
  user_id uuid NOT NULL REFERENCES public.admin_team_members(user_id) ON DELETE RESTRICT,
  role_code text NOT NULL REFERENCES public.admin_roles(code) ON DELETE RESTRICT,
  assigned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_code)
);

CREATE TABLE public.admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_normalized text NOT NULL CHECK (email_normalized = lower(trim(email_normalized))),
  recipient_name text,
  token_hash text NOT NULL UNIQUE,
  issued_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  delivery_status text NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  delivered_at timestamptz,
  delivery_error_code text,
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at),
  CHECK (accepted_at IS NULL OR revoked_at IS NULL),
  CHECK ((delivery_status = 'sent' AND delivered_at IS NOT NULL) OR delivery_status <> 'sent')
);

CREATE TABLE public.admin_invitation_roles (
  invitation_id uuid NOT NULL REFERENCES public.admin_invitations(id) ON DELETE CASCADE,
  role_code text NOT NULL REFERENCES public.admin_roles(code) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (invitation_id, role_code)
);

CREATE TABLE public.admin_access_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invitation_id uuid REFERENCES public.admin_invitations(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(trim(action)) > 0)
);

CREATE INDEX admin_team_members_status_idx ON public.admin_team_members(status);
CREATE INDEX admin_team_member_roles_role_idx ON public.admin_team_member_roles(role_code, user_id);
CREATE INDEX admin_invitations_email_idx ON public.admin_invitations(email_normalized, created_at DESC);
CREATE INDEX admin_invitations_pending_idx ON public.admin_invitations(expires_at)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;
CREATE INDEX admin_access_audit_created_idx ON public.admin_access_audit(created_at DESC);
CREATE INDEX admin_access_audit_target_idx ON public.admin_access_audit(target_user_id, created_at DESC);

INSERT INTO public.admin_roles (code, name, description) VALUES
  ('super_admin', 'Super Administrator', 'All administrator permissions, invitations, and access management.'),
  ('business_operations', 'Business Operations', 'Business applications, pilots, campaigns, offers, and partner operations.'),
  ('creator_support', 'Creator Support', 'Creator accounts, onboarding, memberships, and creator assistance.'),
  ('content_moderator', 'Content Moderator', 'Play content, community moderation, and content review.'),
  ('rights_reviewer', 'Rights Reviewer', 'Music rights, lyrics, ownership claims, and disputes.'),
  ('finance_admin', 'Finance Administrator', 'Membership billing and financial operations.'),
  ('analytics_viewer', 'Analytics Viewer', 'Read-only analytics and released reports.'),
  ('support_agent', 'Support Agent', 'Account assistance without role, billing, or approval authority.');

INSERT INTO public.admin_permissions (code, name, description) VALUES
  ('admin.team.manage', 'Manage administrator team', 'Invite, assign, suspend, and revoke administrator access.'),
  ('admin.system.read', 'View system health', 'View system-health and operational status.'),
  ('admin.accounts.read', 'View accounts', 'View administrator account-support information.'),
  ('admin.accounts.manage', 'Manage accounts', 'Perform approved account-support actions.'),
  ('admin.business.read', 'View business operations', 'View business records, campaigns, offers, and pilots.'),
  ('admin.business.manage', 'Manage business operations', 'Manage business operational records.'),
  ('admin.business.approve', 'Approve business work', 'Approve or reject business campaigns, offers, and related work.'),
  ('admin.business.pilot', 'Manage business pilot', 'Manage administrator-only business pilot context.'),
  ('admin.creator.read', 'View creator operations', 'View creator records and membership state.'),
  ('admin.creator.manage', 'Manage creator operations', 'Perform approved creator-support actions.'),
  ('admin.creator.membership', 'Manage creator memberships', 'Manage creator membership operations.'),
  ('admin.content.read', 'View moderated content', 'View content requiring administrator review.'),
  ('admin.content.moderate', 'Moderate content', 'Approve, reject, restrict, or restore content.'),
  ('admin.content.publish', 'Publish administrator content', 'Publish approved administrator-managed content.'),
  ('admin.rights.read', 'View rights records', 'View music-rights and ownership records.'),
  ('admin.rights.review', 'Review rights records', 'Review rights evidence and claims.'),
  ('admin.rights.resolve', 'Resolve rights cases', 'Resolve or escalate rights cases.'),
  ('admin.finance.read', 'View financial operations', 'View membership and platform financial records.'),
  ('admin.finance.manage', 'Manage financial operations', 'Perform approved financial administration.'),
  ('admin.analytics.read', 'View analytics', 'View administrator analytics and reports.'),
  ('admin.reports.release', 'Release reports', 'Release approved reports.'),
  ('admin.work_queue.read', 'View work queue', 'View assigned administrator work.'),
  ('admin.work_queue.manage', 'Manage work queue', 'Assign and resolve administrator work.'),
  ('admin.search', 'Use administrator search', 'Search records within granted domains.');

INSERT INTO public.admin_role_permissions (role_code, permission_code)
SELECT 'super_admin', code FROM public.admin_permissions;

INSERT INTO public.admin_role_permissions (role_code, permission_code) VALUES
  ('business_operations', 'admin.business.read'), ('business_operations', 'admin.business.manage'),
  ('business_operations', 'admin.business.approve'), ('business_operations', 'admin.business.pilot'),
  ('business_operations', 'admin.analytics.read'), ('business_operations', 'admin.reports.release'),
  ('business_operations', 'admin.work_queue.read'), ('business_operations', 'admin.work_queue.manage'),
  ('business_operations', 'admin.search'),
  ('creator_support', 'admin.creator.read'), ('creator_support', 'admin.creator.manage'),
  ('creator_support', 'admin.creator.membership'), ('creator_support', 'admin.accounts.read'),
  ('creator_support', 'admin.work_queue.read'), ('creator_support', 'admin.work_queue.manage'),
  ('creator_support', 'admin.search'),
  ('content_moderator', 'admin.content.read'), ('content_moderator', 'admin.content.moderate'),
  ('content_moderator', 'admin.content.publish'), ('content_moderator', 'admin.work_queue.read'),
  ('content_moderator', 'admin.work_queue.manage'), ('content_moderator', 'admin.search'),
  ('rights_reviewer', 'admin.rights.read'), ('rights_reviewer', 'admin.rights.review'),
  ('rights_reviewer', 'admin.rights.resolve'), ('rights_reviewer', 'admin.work_queue.read'),
  ('rights_reviewer', 'admin.work_queue.manage'), ('rights_reviewer', 'admin.search'),
  ('finance_admin', 'admin.finance.read'), ('finance_admin', 'admin.finance.manage'),
  ('finance_admin', 'admin.creator.membership'), ('finance_admin', 'admin.analytics.read'),
  ('finance_admin', 'admin.accounts.read'),
  ('analytics_viewer', 'admin.analytics.read'), ('analytics_viewer', 'admin.business.read'),
  ('analytics_viewer', 'admin.creator.read'), ('analytics_viewer', 'admin.content.read'),
  ('analytics_viewer', 'admin.rights.read'),
  ('support_agent', 'admin.accounts.read'), ('support_agent', 'admin.accounts.manage'),
  ('support_agent', 'admin.creator.read'), ('support_agent', 'admin.business.read'),
  ('support_agent', 'admin.work_queue.read'), ('support_agent', 'admin.search');

-- Bootstrap every existing administrator to avoid lockout during migration.
INSERT INTO public.admin_team_members (user_id, status, added_by)
SELECT DISTINCT ur.user_id, 'active', ur.user_id
FROM public.user_roles ur
WHERE ur.role = 'admin'::public.app_role;

INSERT INTO public.admin_team_member_roles (user_id, role_code, assigned_by)
SELECT m.user_id, 'super_admin', m.user_id
FROM public.admin_team_members m;

CREATE OR REPLACE FUNCTION public.has_admin_permission(
  _user_id uuid,
  _permission text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
    AND EXISTS (
      SELECT 1
      FROM public.admin_team_members m
      JOIN public.admin_team_member_roles mr ON mr.user_id = m.user_id
      JOIN public.admin_role_permissions rp ON rp.role_code = mr.role_code
      WHERE m.user_id = _user_id
        AND m.status = 'active'
        AND rp.permission_code = _permission
    );
$$;

CREATE OR REPLACE FUNCTION public.create_admin_invitation_v24_28(
  _email text,
  _role_codes text[],
  _recipient_name text DEFAULT NULL,
  _expires_in_days integer DEFAULT 7
)
RETURNS TABLE(invitation_id uuid, invitation_token text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid := auth.uid();
  normalized_email text := lower(trim(coalesce(_email, '')));
  raw_token text := encode(extensions.gen_random_bytes(32), 'hex');
  new_id uuid;
  new_expiry timestamptz;
  valid_role_count integer;
BEGIN
  IF actor_id IS NULL OR NOT public.has_admin_permission(actor_id, 'admin.team.manage') THEN
    RAISE EXCEPTION 'Super Administrator permission is required';
  END IF;
  IF normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;
  IF _expires_in_days NOT BETWEEN 1 AND 14 THEN
    RAISE EXCEPTION 'Invitation expiration must be between 1 and 14 days';
  END IF;
  IF coalesce(cardinality(_role_codes), 0) = 0 THEN
    RAISE EXCEPTION 'At least one administrator role is required';
  END IF;
  IF 'super_admin' = ANY(_role_codes) AND NOT public.has_admin_permission(actor_id, 'admin.team.manage') THEN
    RAISE EXCEPTION 'Super Administrator permission is required';
  END IF;

  SELECT count(DISTINCT r.code)::integer INTO valid_role_count
  FROM public.admin_roles r WHERE r.code = ANY(_role_codes);
  IF valid_role_count <> cardinality(ARRAY(SELECT DISTINCT unnest(_role_codes))) THEN
    RAISE EXCEPTION 'One or more administrator roles are invalid';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(normalized_email, 0));
  IF EXISTS (
    SELECT 1 FROM public.admin_invitations i
    WHERE i.email_normalized = normalized_email
      AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at > now()
  ) THEN
    RAISE EXCEPTION 'An active invitation already exists for this email';
  END IF;

  new_expiry := now() + make_interval(days => _expires_in_days);
  INSERT INTO public.admin_invitations (
    email_normalized, recipient_name, token_hash, issued_by, expires_at
  ) VALUES (
    normalized_email, nullif(trim(coalesce(_recipient_name, '')), ''),
    encode(extensions.digest(raw_token, 'sha256'), 'hex'), actor_id, new_expiry
  ) RETURNING id INTO new_id;

  INSERT INTO public.admin_invitation_roles (invitation_id, role_code)
  SELECT new_id, role_code FROM unnest(_role_codes) AS role_code GROUP BY role_code;

  INSERT INTO public.admin_access_audit (actor_user_id, invitation_id, action, details)
  VALUES (actor_id, new_id, 'admin_invitation_created',
    jsonb_build_object('role_codes', ARRAY(SELECT DISTINCT unnest(_role_codes)), 'expires_at', new_expiry));

  RETURN QUERY SELECT new_id, raw_token, new_expiry;
END;
$$;

CREATE OR REPLACE FUNCTION public.inspect_admin_invitation_v24_28(_token text)
RETURNS TABLE(recipient_name text, role_names text[], expires_at timestamptz, invitation_status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.recipient_name,
         array_agg(r.name ORDER BY r.name),
         i.expires_at,
         CASE
           WHEN i.revoked_at IS NOT NULL THEN 'revoked'
           WHEN i.accepted_at IS NOT NULL THEN 'accepted'
           WHEN i.expires_at <= now() THEN 'expired'
           ELSE 'pending'
         END
  FROM public.admin_invitations i
  JOIN public.admin_invitation_roles ir ON ir.invitation_id = i.id
  JOIN public.admin_roles r ON r.code = ir.role_code
  WHERE i.token_hash = encode(extensions.digest(coalesce(_token, ''), 'sha256'), 'hex')
  GROUP BY i.id;
$$;

CREATE OR REPLACE FUNCTION public.accept_admin_invitation_v24_28(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid := auth.uid();
  actor_email text;
  invite_row public.admin_invitations%ROWTYPE;
BEGIN
  IF actor_id IS NULL THEN RAISE EXCEPTION 'Sign in is required'; END IF;
  SELECT lower(trim(email)) INTO actor_email FROM auth.users WHERE id = actor_id;

  SELECT * INTO invite_row
  FROM public.admin_invitations
  WHERE token_hash = encode(extensions.digest(coalesce(_token, ''), 'sha256'), 'hex')
  FOR UPDATE;

  IF NOT FOUND OR invite_row.revoked_at IS NOT NULL OR invite_row.accepted_at IS NOT NULL
     OR invite_row.expires_at <= now() THEN
    RAISE EXCEPTION 'This administrator invitation is invalid or unavailable';
  END IF;
  IF actor_email IS NULL OR actor_email <> invite_row.email_normalized THEN
    RAISE EXCEPTION 'Sign in with the email address that received this invitation';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (actor_id, 'admin'::public.app_role) ON CONFLICT DO NOTHING;

  INSERT INTO public.admin_team_members (user_id, status, added_by)
  VALUES (actor_id, 'active', invite_row.issued_by)
  ON CONFLICT (user_id) DO UPDATE SET
    status = 'active', suspended_at = NULL, revoked_at = NULL,
    activated_at = now(), updated_at = now();

  DELETE FROM public.admin_team_member_roles WHERE user_id = actor_id;
  INSERT INTO public.admin_team_member_roles (user_id, role_code, assigned_by)
  SELECT actor_id, ir.role_code, invite_row.issued_by
  FROM public.admin_invitation_roles ir WHERE ir.invitation_id = invite_row.id;

  UPDATE public.admin_invitations
  SET accepted_at = now(), accepted_by = actor_id
  WHERE id = invite_row.id;

  INSERT INTO public.admin_access_audit (
    actor_user_id, target_user_id, invitation_id, action, details
  ) VALUES (
    actor_id, actor_id, invite_row.id, 'admin_invitation_accepted', '{}'::jsonb
  );
  RETURN actor_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_admin_invitation_v24_28(_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE actor_id uuid := auth.uid();
BEGIN
  IF actor_id IS NULL OR NOT public.has_admin_permission(actor_id, 'admin.team.manage') THEN
    RAISE EXCEPTION 'Super Administrator permission is required';
  END IF;
  UPDATE public.admin_invitations
  SET revoked_at = now(), revoked_by = actor_id
  WHERE id = _invitation_id AND accepted_at IS NULL AND revoked_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active invitation was not found'; END IF;
  INSERT INTO public.admin_access_audit (actor_user_id, invitation_id, action)
  VALUES (actor_id, _invitation_id, 'admin_invitation_revoked');
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_admin_invitation_delivery_v24_28(
  _invitation_id uuid,
  _delivery_status text,
  _delivery_error_code text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _delivery_status NOT IN ('sent', 'failed') THEN
    RAISE EXCEPTION 'Delivery status must be sent or failed';
  END IF;
  UPDATE public.admin_invitations
  SET delivery_status = _delivery_status,
      delivered_at = CASE WHEN _delivery_status = 'sent' THEN now() ELSE NULL END,
      delivery_error_code = CASE
        WHEN _delivery_status = 'failed' THEN nullif(trim(coalesce(_delivery_error_code, '')), '')
        ELSE NULL
      END
  WHERE id = _invitation_id AND accepted_at IS NULL AND revoked_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pending invitation was not found'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_admin_member_roles_v24_28(
  _target_user_id uuid,
  _role_codes text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid := auth.uid();
  target_had_super boolean;
  active_super_count integer;
  valid_role_count integer;
BEGIN
  IF actor_id IS NULL OR NOT public.has_admin_permission(actor_id, 'admin.team.manage') THEN
    RAISE EXCEPTION 'Super Administrator permission is required';
  END IF;
  IF coalesce(cardinality(_role_codes), 0) = 0 THEN
    RAISE EXCEPTION 'At least one administrator role is required';
  END IF;
  SELECT count(DISTINCT code)::integer INTO valid_role_count
  FROM public.admin_roles WHERE code = ANY(_role_codes);
  IF valid_role_count <> cardinality(ARRAY(SELECT DISTINCT unnest(_role_codes))) THEN
    RAISE EXCEPTION 'One or more administrator roles are invalid';
  END IF;

  PERFORM pg_advisory_xact_lock(24280001);
  IF NOT EXISTS (SELECT 1 FROM public.admin_team_members WHERE user_id = _target_user_id) THEN
    RAISE EXCEPTION 'Administrator team member was not found';
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.admin_team_member_roles
    WHERE user_id = _target_user_id AND role_code = 'super_admin'
  ) INTO target_had_super;
  SELECT count(DISTINCT m.user_id)::integer INTO active_super_count
  FROM public.admin_team_members m
  JOIN public.admin_team_member_roles mr ON mr.user_id = m.user_id
  WHERE m.status = 'active' AND mr.role_code = 'super_admin';
  IF target_had_super AND NOT ('super_admin' = ANY(_role_codes)) AND active_super_count <= 1 THEN
    RAISE EXCEPTION 'The last active Super Administrator cannot be removed';
  END IF;

  DELETE FROM public.admin_team_member_roles WHERE user_id = _target_user_id;
  INSERT INTO public.admin_team_member_roles (user_id, role_code, assigned_by)
  SELECT _target_user_id, role_code, actor_id
  FROM unnest(_role_codes) AS role_code GROUP BY role_code;
  INSERT INTO public.admin_access_audit (actor_user_id, target_user_id, action, details)
  VALUES (actor_id, _target_user_id, 'admin_roles_changed',
    jsonb_build_object('role_codes', ARRAY(SELECT DISTINCT unnest(_role_codes))));
END;
$$;

CREATE OR REPLACE FUNCTION public.set_admin_member_status_v24_28(
  _target_user_id uuid,
  _status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid := auth.uid();
  target_is_super boolean;
  active_super_count integer;
BEGIN
  IF actor_id IS NULL OR NOT public.has_admin_permission(actor_id, 'admin.team.manage') THEN
    RAISE EXCEPTION 'Super Administrator permission is required';
  END IF;
  IF _status NOT IN ('active', 'suspended', 'revoked') THEN
    RAISE EXCEPTION 'Administrator status is invalid';
  END IF;
  IF actor_id = _target_user_id AND _status <> 'active' THEN
    RAISE EXCEPTION 'You cannot suspend or revoke your own administrator access';
  END IF;

  PERFORM pg_advisory_xact_lock(24280001);
  SELECT EXISTS (
    SELECT 1 FROM public.admin_team_member_roles
    WHERE user_id = _target_user_id AND role_code = 'super_admin'
  ) INTO target_is_super;
  SELECT count(DISTINCT m.user_id)::integer INTO active_super_count
  FROM public.admin_team_members m
  JOIN public.admin_team_member_roles mr ON mr.user_id = m.user_id
  WHERE m.status = 'active' AND mr.role_code = 'super_admin';
  IF target_is_super AND _status <> 'active' AND active_super_count <= 1 THEN
    RAISE EXCEPTION 'The last active Super Administrator cannot be suspended or revoked';
  END IF;

  UPDATE public.admin_team_members
  SET status = _status,
      suspended_at = CASE WHEN _status = 'suspended' THEN now() ELSE NULL END,
      revoked_at = CASE WHEN _status = 'revoked' THEN now() ELSE NULL END,
      updated_at = now()
  WHERE user_id = _target_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Administrator team member was not found'; END IF;

  IF _status IN ('suspended', 'revoked') THEN
    DELETE FROM public.user_roles
    WHERE user_id = _target_user_id AND role = 'admin'::public.app_role;
  ELSIF _status = 'active' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_target_user_id, 'admin'::public.app_role) ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.admin_access_audit (actor_user_id, target_user_id, action, details)
  VALUES (actor_id, _target_user_id, 'admin_status_changed', jsonb_build_object('status', _status));
END;
$$;

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_team_member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitation_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_access_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administrators read role catalog" ON public.admin_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Administrators read permission catalog" ON public.admin_permissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Administrators read role permission map" ON public.admin_role_permissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Administrators read own team membership" ON public.admin_team_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_admin_permission(auth.uid(), 'admin.team.manage'));
CREATE POLICY "Administrators read own team roles" ON public.admin_team_member_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_admin_permission(auth.uid(), 'admin.team.manage'));
CREATE POLICY "Super administrators read invitations" ON public.admin_invitations FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'admin.team.manage'));
CREATE POLICY "Super administrators read invitation roles" ON public.admin_invitation_roles FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'admin.team.manage'));
CREATE POLICY "Super administrators read access audit" ON public.admin_access_audit FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(), 'admin.team.manage'));

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

REVOKE ALL ON public.admin_roles, public.admin_permissions, public.admin_role_permissions,
  public.admin_team_members, public.admin_team_member_roles, public.admin_invitations,
  public.admin_invitation_roles, public.admin_access_audit FROM anon, authenticated;
GRANT SELECT ON public.admin_roles, public.admin_permissions, public.admin_role_permissions,
  public.admin_team_members, public.admin_team_member_roles, public.admin_invitations,
  public.admin_invitation_roles, public.admin_access_audit TO authenticated;
GRANT ALL ON public.admin_roles, public.admin_permissions, public.admin_role_permissions,
  public.admin_team_members, public.admin_team_member_roles, public.admin_invitations,
  public.admin_invitation_roles, public.admin_access_audit TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.admin_access_audit_id_seq TO service_role;

REVOKE ALL ON FUNCTION public.has_admin_permission(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_admin_invitation_v24_28(text, text[], text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.inspect_admin_invitation_v24_28(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_admin_invitation_v24_28(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_admin_invitation_v24_28(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_admin_invitation_delivery_v24_28(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_admin_member_roles_v24_28(uuid, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_admin_member_status_v24_28(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_admin_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_admin_invitation_v24_28(text, text[], text, integer)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.inspect_admin_invitation_v24_28(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_admin_invitation_v24_28(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_admin_invitation_v24_28(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_admin_invitation_delivery_v24_28(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_admin_member_roles_v24_28(uuid, text[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_admin_member_status_v24_28(uuid, text) TO authenticated, service_role;

INSERT INTO public.admin_access_audit (actor_user_id, target_user_id, action, details)
SELECT m.user_id, m.user_id, 'admin_super_bootstrap', jsonb_build_object('role_code', 'super_admin')
FROM public.admin_team_members m;

COMMIT;
