-- RLS policies on user_roles call has_role. Authenticated users must be able
-- to execute the function for those policies to evaluate; anon remains denied.
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon;
