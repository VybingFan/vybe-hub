import { useEffect, useState, type ReactNode } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import {
  adminTeamService,
  type AdminAccess,
} from "@/services/admin/adminTeamService";

interface Props {
  anyOf: string[];
  children: ReactNode;
  silent?: boolean;
}

export function AdminPermissionGuard({
  anyOf,
  children,
  silent = false,
}: Props) {
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    void adminTeamService
      .getMyAccess()
      .then((result) => {
        if (active) {
          setAccess(result);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const allowed =
    access?.status === "active" &&
    anyOf.some((permission) =>
      access.permissions.includes(permission),
    );

  return (
    <RoleGuard allow={["admin"]}>
      {!access && !failed ? (
        silent ? null : (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )
      ) : allowed ? (
        children
      ) : silent ? null : (
        <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <ShieldAlert className="mb-3 h-8 w-8 text-destructive" />

          <h2 className="text-xl font-semibold">
            Access not assigned
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Your administrator role does not include permission for this
            workspace.
          </p>

          <Button
            className="mt-6"
            variant="outline"
            onClick={() => window.location.assign("/admin")}
          >
            Return to your workspace
          </Button>
        </div>
      )}
    </RoleGuard>
  );
}