import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";

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
    const pendingInvite = window.localStorage.getItem("vybe:pending-creator-invite");
    if (pendingInvite) {
      navigate({ to: "/creator-invite/$token", params: { token: pendingInvite }, replace: true });
      return;
    }
    if (!primaryRole) {
      navigate({ to: "/auth/onboarding", replace: true });
      return;
    }
    navigate({ to: defaultRoute, replace: true });
  }, [isAuthenticated, isLoading, userLoading, primaryRole, defaultRoute, navigate]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
