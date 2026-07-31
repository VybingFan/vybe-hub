import { useAuthContext } from "@/providers/AuthProvider";
import { DEFAULT_ROUTE_FOR_ROLE, type AppRole } from "@/features/auth/roles";

/** Current user profile, roles, and role helpers. */
export function useUser() {
  const { user, profile, roles, isLoading, hasRole, hasAnyRole, refresh } = useAuthContext();

  const primaryRole: AppRole | null = roles.includes("admin")
    ? "admin"
    : roles.includes("creator")
      ? "creator"
      : roles.includes("business")
        ? "business"
        : roles.includes("supporter")
          ? "supporter"
          : null;

  const defaultRoute = primaryRole ? DEFAULT_ROUTE_FOR_ROLE[primaryRole] : "/auth/onboarding";

  return {
    user,
    profile,
    roles,
    primaryRole,
    defaultRoute,
    isLoading,
    hasRole,
    hasAnyRole,
    refresh,
  };
}
