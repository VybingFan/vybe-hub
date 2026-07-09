import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import type { AppRole } from "@/features/auth/roles";

interface Props {
  allow: AppRole[];
  children: ReactNode;
}

/** Client-side role gate rendered inside AppShell so the chrome stays consistent. */
export function RoleGuard({ allow, children }: Props) {
  const { signOut } = useAuth();
  const { primaryRole, hasAnyRole, isLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!primaryRole) navigate({ to: "/auth/onboarding", replace: true });
  }, [isLoading, primaryRole, navigate]);

  if (isLoading || !primaryRole) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!hasAnyRole(allow)) {
    return (
      <AppShell>
        <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <ShieldAlert className="mb-3 h-8 w-8 text-destructive" />
          <h2 className="text-xl font-semibold">You don't have access to this area</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This page is limited to: {allow.join(", ")}.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/auth/redirect" })}>
              Go to your home
            </Button>
            <Button variant="ghost" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}
