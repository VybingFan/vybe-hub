import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { invitationService, type InvitePreview } from "@/services/invitations/invitationService";
import { requestCreatorOnboardingLaunch } from "@/features/guide/creatorOnboardingState";

export const Route = createFileRoute("/creator-invite/$token")({ component: CreatorInvitePage });

const PLAN_NAMES = {
  creator_free: "Creator Free",
  creator_plus: "Creator Plus",
  creator_pro: "Creator Pro",
  creator_studio: "Creator Studio",
  founding_beta: "Founding Creator",
} as const;

function CreatorInvitePage() {
  const { token } = Route.useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { refresh, primaryRole } = useUser();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [checking, setChecking] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    window.localStorage.setItem("vybe:pending-creator-invite", token);
    invitationService
      .inspect(token)
      .then(setPreview)
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Could not inspect invitation"),
      )
      .finally(() => setChecking(false));
  }, [token]);

  async function redeem() {
    setRedeeming(true);
    try {
      await invitationService.redeem(token);
      window.localStorage.removeItem("vybe:pending-creator-invite");
      if (!primaryRole) requestCreatorOnboardingLaunch();
      await refresh();
      toast.success("Creator Studio access activated");
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not redeem invitation");
    } finally {
      setRedeeming(false);
    }
  }

  if (checking || isLoading)
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  if (!preview)
    return (
      <AuthCard
        title="Invitation not found"
        description="Check that the complete personal link was copied correctly."
      >
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
      </AuthCard>
    );

  if (preview.invitation_status !== "valid")
    return (
      <AuthCard
        title={`Invitation ${preview.invitation_status}`}
        description="This creator invitation can no longer be used. Contact the VYBE administrator for a new one."
      >
        <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
      </AuthCard>
    );

  return (
    <AuthCard
      title="Your Creator Studio invitation"
      description="This personal invitation works only for the intended email account."
    >
      <div className="space-y-5 text-sm">
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-2 font-medium">
            <KeyRound className="h-4 w-4 text-primary" />
            {PLAN_NAMES[preview.assigned_plan]}
          </div>
          <p className="mt-2 text-muted-foreground">Issued to {preview.recipient_hint}</p>
          <p className="text-muted-foreground">
            Expires {new Date(preview.expires_at).toLocaleString()}
          </p>
        </div>
        {isAuthenticated ? (
          <Button className="w-full" disabled={redeeming} onClick={() => void redeem()}>
            {redeeming ? (
              "Activatingâ€¦"
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Activate Creator Studio
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-muted-foreground">
              Create or sign in to the account using the exact email address this invitation was
              issued to.
            </p>
            <Button asChild className="w-full">
              <Link to="/creator/sign-up">Create account</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth/sign-in">Sign in</Link>
            </Button>
          </div>
        )}
      </div>
    </AuthCard>
  );
}
