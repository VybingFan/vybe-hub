import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/AuthCard";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEGAL_POLICY_VERSION } from "@/constants/legal";
import { useAuth } from "@/hooks/useAuth";
import { signUpSchema } from "@/features/auth/roles";
import { z } from "zod";

const PENDING_ROLE_KEY = "vybe:pending-signup-role";

const signUpSearchSchema = z.object({
  role: z.enum(["creator", "supporter", "business"]).optional(),
});

export const Route = createFileRoute("/auth/sign-up")({
  validateSearch: signUpSearchSchema,
  beforeLoad: ({ search }) => {
    if (search.role === "creator") {
      throw redirect({ to: "/creator/sign-up" });
    }
  },
  component: SignUpPage,
});

function SignUpPage() {
  const { role } = Route.useSearch();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

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
      if (role) window.localStorage.setItem(PENDING_ROLE_KEY, role);
      else window.localStorage.removeItem(PENDING_ROLE_KEY);

      const result = await signUp(
        parsed.data.email,
        parsed.data.password,
        parsed.data.displayName,
        LEGAL_POLICY_VERSION,
        role,
      );
      const pendingInvite = window.localStorage.getItem("vybe:pending-creator-invite");

      if (result.requiresEmailConfirmation) {
        setConfirmationEmail(parsed.data.email);
        toast.success("Check your email to confirm your VYBE account.");
        return;
      }
      toast.success(
        pendingInvite ? "Account created. Continue your creator invitation." : "Account created.",
      );
      if (pendingInvite) {
        navigate({ to: "/creator-invite/$token", params: { token: pendingInvite } });
      } else {
        navigate({ to: "/auth/onboarding", search: { role } });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setLoading(false);
    }
  }
  if (confirmationEmail) {
    return (
      <AuthCard
        title="Check your email"
        description={`We sent a confirmation link to ${confirmationEmail}. Confirm your email to continue setting up your VYBE account.`}
        footer={
          <>
            Already confirmed?{" "}
            <Link to="/auth/sign-in" className="text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <div className="space-y-3 rounded-xl border border-border/70 bg-muted/25 p-4 text-sm">
          <p className="font-medium">Confirmation is required before VYBE can sign you in.</p>
          <p className="text-muted-foreground">
            Open the VYBE email and select <strong>Confirm my email</strong>. VYBE will then continue
            with the correct account setup.
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={
        role === "creator"
          ? "Create your creator account"
          : role === "business"
            ? "Create your business account"
            : "Create your VYBE"
      }
      description={
        role === "creator"
          ? "Begin with Creator Free and build your public creator home."
          : role === "business"
            ? "Apply to partner with VYBE and prepare for Business Studio."
            : "Join as a supporter or begin with the Creator Free plan."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link to="/auth/sign-in" className="text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            required
            maxLength={60}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
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
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
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
            id="legal-policies"
            checked={acceptedPolicies}
            onCheckedChange={(checked) => setAcceptedPolicies(checked === true)}
            aria-describedby="legal-policy-description"
          />
          <Label
            htmlFor="legal-policies"
            id="legal-policy-description"
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
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
    </AuthCard>
  );
}
