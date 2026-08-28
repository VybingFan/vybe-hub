import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";

const PENDING_ROLE_KEY = "vybe:pending-signup-role";
const PENDING_PLAN_KEY = "vybe:pending-creator-plan";
const PENDING_INTERVAL_KEY = "vybe:pending-creator-interval";

function pendingRole() {
  const value = window.localStorage.getItem(PENDING_ROLE_KEY);
  return value === "creator" || value === "supporter" || value === "business" ? value : undefined;
}

function clearPendingSignupIntent() {
  window.localStorage.removeItem(PENDING_ROLE_KEY);
  window.localStorage.removeItem(PENDING_PLAN_KEY);
  window.localStorage.removeItem(PENDING_INTERVAL_KEY);
}

/** Post-auth router: sends the user to onboarding or their role-based home. */
export const Route = createFileRoute("/auth/redirect")({
  component: RedirectPage,
});

function RedirectPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { primaryRole, defaultRoute, isLoading: userLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || userLoading) return;
    if (!isAuthenticated) {
      navigate({ to: "/auth/sign-in", replace: true });
      return;
    }
    const pendingAdminInvite = window.localStorage.getItem("vybe:pending-admin-invite");
    if (pendingAdminInvite) {
      navigate({
        to: "/admin-invite/$token",
        params: { token: pendingAdminInvite },
        replace: true,
      });
      return;
    }
    const pendingInvite = window.localStorage.getItem("vybe:pending-creator-invite");
    if (pendingInvite) {
      navigate({ to: "/creator-invite/$token", params: { token: pendingInvite }, replace: true });
      return;
    }
    const signupRole = pendingRole();

    if (!primaryRole) {
      navigate({ to: "/auth/onboarding", search: { role: signupRole }, replace: true });
      return;
    }

    if (primaryRole === "creator" && signupRole === "creator") {
      const pendingPlan = window.localStorage.getItem(PENDING_PLAN_KEY);
      if (pendingPlan === "creator_plus" || pendingPlan === "creator_pro") {
        clearPendingSignupIntent();
        navigate({ to: "/creator-memberships", replace: true });
        return;
      }
    }

    clearPendingSignupIntent();
    navigate({ to: defaultRoute, replace: true });
  }, [isAuthenticated, isLoading, userLoading, primaryRole, defaultRoute, navigate]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
