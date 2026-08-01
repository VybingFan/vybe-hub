import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import {
  adminTeamService,
  type AdminInvitationPreview,
} from "@/services/admin/adminTeamService";

export const Route = createFileRoute("/admin-invite/$token")({ component: AdminInvitePage });

function AdminInvitePage() {
  const { token } = Route.useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { refresh } = useUser();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<AdminInvitationPreview | null>(null);
  const [checking, setChecking] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    window.localStorage.setItem("vybe:pending-admin-invite", token);
    adminTeamService
      .inspect(token)
      .then(setPreview)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not inspect invitation"))
      .finally(() => setChecking(false));
  }, [token]);

  async function accept() {
    setAccepting(true);
    try {
      await adminTeamService.accept(token);
      window.localStorage.removeItem("vybe:pending-admin-invite");
      await refresh();
      toast.success("VYBE administrator access activated");
      navigate({ to: "/admin", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not accept invitation");
    } finally {
      setAccepting(false);
    }
  }

  if (checking || isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!preview) {
    return <AuthCard title="Invitation not found" description="Check that the complete administrator invitation link was opened."><ShieldAlert className="mx-auto h-10 w-10 text-destructive" /></AuthCard>;
  }
  if (preview.invitation_status !== "pending") {
    return <AuthCard title={`Invitation ${preview.invitation_status}`} description="This administrator invitation can no longer be used."><ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" /></AuthCard>;
  }

  return (
    <AuthCard title="Your VYBE administrator invitation" description="Access is limited to the assigned operational roles.">
      <div className="space-y-5 text-sm">
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-2 font-medium"><KeyRound className="h-4 w-4 text-primary" />{preview.recipient_name || "VYBE administrator"}</div>
          <p className="mt-2 text-muted-foreground">Roles: {preview.role_names.join(", ")}</p>
          <p className="text-muted-foreground">Expires {new Date(preview.expires_at).toLocaleString()}</p>
        </div>
        {isAuthenticated ? (
          <Button className="w-full" disabled={accepting} onClick={() => void accept()}>
            <CheckCircle2 className="mr-2 h-4 w-4" />{accepting ? "Activating…" : "Accept administrator access"}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-muted-foreground">Use the secure email invitation to establish your account, or sign in with the exact invited email address.</p>
            <Button asChild className="w-full"><Link to="/auth/sign-in">Sign in</Link></Button>
          </div>
        )}
      </div>
    </AuthCard>
  );
}
