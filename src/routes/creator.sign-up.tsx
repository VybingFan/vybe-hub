import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Music2, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { CreatorAuthShell } from "@/components/auth/CreatorAuthShell";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEGAL_POLICY_VERSION } from "@/constants/legal";
import { useAuth } from "@/hooks/useAuth";
import { signUpSchema } from "@/features/auth/roles";
import { requestCreatorOnboardingLaunch } from "@/features/guide/creatorOnboardingState";

export const Route = createFileRoute("/creator/sign-up")({
  component: CreatorSignUpPage,
});

function CreatorSignUpPage() {
  const { signUp, assignInitialRole } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!acceptedPolicies) {
      toast.error("Accept the Terms, Privacy Policy, Community Guidelines, and Copyright Policy.");
      return;
    }

    const parsed = signUpSchema.safeParse({ displayName, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await signUp(
        parsed.data.email,
        parsed.data.password,
        parsed.data.displayName,
        LEGAL_POLICY_VERSION,
      );

      requestCreatorOnboardingLaunch();

      const pendingInvite = window.localStorage.getItem("vybe:pending-creator-invite");
      if (pendingInvite) {
        toast.success("Account created. Continue your creator invitation.");
        navigate({ to: "/creator-invite/$token", params: { token: pendingInvite } });
        return;
      }

      await assignInitialRole("creator");
      window.sessionStorage.setItem("vybe:active-workspace", "creator_studio");
      toast.success("Creator account created");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create creator account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CreatorAuthShell wide eyebrow="Creator Free"
      title="Create your VYBE Creator account"
      description="Start with Creator Free and enter a professional workspace built for your music, content, audience, and creator home."
      footer={
        <div className="space-y-2 text-center">
          <p>
            Already a creator on VYBE?{" "}
            <Link to="/creator/sign-in" className="text-foreground underline-offset-4 hover:underline">
              Creator sign in
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Joining as a fan?{" "}
            <Link to="/auth/sign-up" className="text-foreground underline-offset-4 hover:underline">
              Create a supporter account
            </Link>
          </p>
        </div>
      }
    >
      <div className="mb-5 grid gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold">
          <Music2 className="h-4 w-4 text-primary" /> Creator Free starts here
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" /> Build your creator page and professional workspace
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4 text-primary" /> You can still browse VYBE and experience it like a supporter
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 [&_label]:text-zinc-200 [&_input]:border-white/10 [&_input]:bg-white/5 [&_input]:text-white [&_input]:placeholder:text-zinc-600">
        <div className="space-y-2">
          <Label htmlFor="creator-name">Creator / display name</Label>
          <Input
            id="creator-name"
            required
            maxLength={60}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="creator-signup-email">Email</Label>
          <Input
            id="creator-signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="creator-signup-password">Password</Label>
          <Input
            id="creator-signup-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="creator-confirm-password">Confirm password</Label>
          <Input
            id="creator-confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/25 p-3">
          <Checkbox
            id="creator-legal-policies"
            checked={acceptedPolicies}
            onCheckedChange={(checked) => setAcceptedPolicies(checked === true)}
            aria-describedby="creator-legal-policy-description"
          />
          <Label
            htmlFor="creator-legal-policies"
            id="creator-legal-policy-description"
            className="text-xs font-normal leading-5 text-muted-foreground"
          >
            I agree to the{" "}
            <Link to="/terms" target="_blank" className="text-foreground underline">
              Terms
            </Link>
            ,{" "}
            <Link to="/privacy" target="_blank" className="text-foreground underline">
              Privacy Policy
            </Link>
            ,{" "}
            <Link to="/community-guidelines" target="_blank" className="text-foreground underline">
              Community Guidelines
            </Link>
            , and{" "}
            <Link to="/copyright" target="_blank" className="text-foreground underline">
              Copyright Policy
            </Link>
            . Version {LEGAL_POLICY_VERSION}.
          </Label>
        </div>

        <SubmitButton loading={loading}>Create Creator Account</SubmitButton>
      </form>
    </CreatorAuthShell>
  );
}
