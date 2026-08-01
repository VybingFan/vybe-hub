-- VYBE V24.28.1 - Administrator team permission and dashboard read models

BEGIN;

CREATE OR REPLACE FUNCTION public.get_my_admin_access_v24_28()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'is_admin', public.has_role(auth.uid(), 'admin'::public.app_role),
    'status', coalesce(m.status, 'none'),
    'roles', coalesce((
      SELECT jsonb_agg(mr.role_code ORDER BY mr.role_code)
      FROM public.admin_team_member_roles mr
      WHERE mr.user_id = auth.uid()
    ), '[]'::jsonb),
    'permissions', coalesce((
      SELECT jsonb_agg(permission_code ORDER BY permission_code)
      FROM (
        SELECT DISTINCT rp.permission_code
        FROM public.admin_team_member_roles mr
        JOIN public.admin_role_permissions rp ON rp.role_code = mr.role_code
        WHERE mr.user_id = auth.uid() AND m.status = 'active'
      ) permissions
    ), '[]'::jsonb)
  )
  FROM (SELECT 1) seed
  LEFT JOIN public.admin_team_members m ON m.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_admin_team_dashboard_v24_28()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid := auth.uid();
  result jsonb;
BEGIN
  IF actor_id IS NULL OR NOT public.has_admin_permission(actor_id, 'admin.team.manage') THEN
    RAISE EXCEPTION 'Super Administrator permission is required';
  END IF;

  SELECT jsonb_build_object(
    'generated_at', now(),
    'roles', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'code', r.code,
          'name', r.name,
          'description', r.description,
          'permissions', coalesce((
            SELECT jsonb_agg(rp.permission_code ORDER BY rp.permission_code)
            FROM public.admin_role_permissions rp
            WHERE rp.role_code = r.code
          ), '[]'::jsonb)
        ) ORDER BY r.name
      )
      FROM public.admin_roles r
    ), '[]'::jsonb),
    'members', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'user_id', m.user_id,
          'display_name', coalesce(nullif(trim(p.display_name), ''), 'Administrator'),
          'email', coalesce(u.email, p.email),
          'status', m.status,
          'activated_at', m.activated_at,
          'suspended_at', m.suspended_at,
          'revoked_at', m.revoked_at,
          'roles', coalesce((
            SELECT jsonb_agg(mr.role_code ORDER BY mr.role_code)
            FROM public.admin_team_member_roles mr
            WHERE mr.user_id = m.user_id
          ), '[]'::jsonb)
        ) ORDER BY m.created_at, m.user_id
      )
      FROM public.admin_team_members m
      JOIN auth.users u ON u.id = m.user_id
      LEFT JOIN public.profiles p ON p.id = m.user_id
    ), '[]'::jsonb),
    'invitations', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'email', i.email_normalized,
          'recipient_name', i.recipient_name,
          'expires_at', i.expires_at,
          'delivery_status', i.delivery_status,
          'accepted_at', i.accepted_at,
          'revoked_at', i.revoked_at,
          'created_at', i.created_at,
          'roles', coalesce((
            SELECT jsonb_agg(ir.role_code ORDER BY ir.role_code)
            FROM public.admin_invitation_roles ir
            WHERE ir.invitation_id = i.id
          ), '[]'::jsonb)
        ) ORDER BY i.created_at DESC
      )
      FROM public.admin_invitations i
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_admin_access_v24_28() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_team_dashboard_v24_28() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_admin_access_v24_28() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_team_dashboard_v24_28() TO authenticated, service_role;

COMMENT ON FUNCTION public.get_my_admin_access_v24_28()
IS 'Returns the authenticated administrator team status, operational roles, and permissions.';
COMMENT ON FUNCTION public.get_admin_team_dashboard_v24_28()
IS 'Returns the Super Administrator team-management read model without exposing invitation tokens.';

COMMIT;
