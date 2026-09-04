import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Music2, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { CreatorAuthShell } from "@/components/auth/CreatorAuthShell";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { CreatorRightsProtectionAcknowledgements } from "@/components/auth/CreatorRightsProtectionAcknowledgements";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEGAL_POLICY_VERSION } from "@/constants/legal";
import { useAuth } from "@/hooks/useAuth";
import { signUpSchema } from "@/features/auth/roles";
import { CREATOR_PLAN_CATALOG } from "@/features/membership/catalog";
import {
  CREATOR_RIGHTS_PROTECTION_VERSION,
  EMPTY_CREATOR_RIGHTS_PROTECTION_ACKNOWLEDGEMENTS,
  hasAcceptedCreatorRightsProtection,
  type CreatorRightsProtectionAcknowledgementState,
} from "@/constants/creatorRightsProtection";

const PENDING_ROLE_KEY = "vybe:pending-signup-role";
const PENDING_PLAN_KEY = "vybe:pending-creator-plan";
const PENDING_INTERVAL_KEY = "vybe:pending-creator-interval";

const creatorSignUpSearchSchema = z.object({
  plan: z.enum(["creator_free", "creator_plus", "creator_pro"]).optional(),
  interval: z.enum(["monthly", "annual"]).optional(),
});

export const Route = createFileRoute("/creator/sign-up")({
  validateSearch: creatorSignUpSearchSchema,
  component: CreatorSignUpPage,
});

function CreatorSignUpPage() {
  const { plan, interval } = Route.useSearch();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [rightsAcknowledgements, setRightsAcknowledgements] =
    useState<CreatorRightsProtectionAcknowledgementState>(
      EMPTY_CREATOR_RIGHTS_PROTECTION_ACKNOWLEDGEMENTS,
    );
  const [loading, setLoading] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  const selectedPlan =
    CREATOR_PLAN_CATALOG.find(
      (item) =>
        item.code === (plan || "creator_free") &&
        item.launchState === "available",
    ) ?? CREATOR_PLAN_CATALOG[0];

  const selectedInterval = interval === "annual" ? "annual" : "monthly";
  const selectedPrice =
    selectedInterval === "annual" ? selectedPlan.annualPrice : selectedPlan.monthlyPrice;
  const selectedPriceLabel =
    selectedPlan.code === "creator_free"
      ? "$0"
      : `$${selectedPrice}/${selectedInterval === "annual" ? "year" : "month"}`;

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

    if (!hasAcceptedCreatorRightsProtection(rightsAcknowledgements)) {
      toast.error("Review and accept each VYBE Rights & Protection acknowledgement.");
      return;
    }
    const parsed = signUpSchema.safeParse({ displayName, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      window.localStorage.setItem(PENDING_ROLE_KEY, "creator");
      window.localStorage.setItem(PENDING_PLAN_KEY, selectedPlan.code);
      window.localStorage.setItem(PENDING_INTERVAL_KEY, selectedInterval);

      const result = await signUp(
        parsed.data.email,
        parsed.data.password,
        parsed.data.displayName,
        LEGAL_POLICY_VERSION,
        "creator",
        {
          version: CREATOR_RIGHTS_PROTECTION_VERSION,
          ...rightsAcknowledgements,
        },
      );

      const pendingInvite = window.localStorage.getItem("vybe:pending-creator-invite");

      if (result.requiresEmailConfirmation) {
        setConfirmationEmail(parsed.data.email);
        toast.success("Check your email to confirm your VYBE Creator account.");
        return;
      }
      if (pendingInvite) {
        toast.success("Account created. Continue your creator invitation.");
        navigate({ to: "/creator-invite/$token", params: { token: pendingInvite } });
        return;
      }

      toast.success("Creator account created");
      navigate({ to: "/auth/onboarding", search: { role: "creator" } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create creator account");
    } finally {
      setLoading(false);
    }
  }
  if (confirmationEmail) {
    return (
      <CreatorAuthShell
        wide
        eyebrow={selectedPlan.name}
        title="Check your email"
        description={`We sent a confirmation link to ${confirmationEmail}. Confirm your email to continue your Creator setup.`}
        footer={
          <div className="space-y-2 text-center">
            <p>
              Already confirmed?{" "}
              <Link to="/creator/sign-in" className="text-foreground underline-offset-4 hover:underline">
                Creator sign in
              </Link>
            </p>
          </div>
        }
      >
        <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm">
          <p className="font-semibold">Confirmation is required before Creator HQ can open.</p>
          <p className="text-muted-foreground">
            Open the VYBE email and select <strong>Confirm my email</strong>. VYBE will then continue
            with Creator onboarding and your selected membership path.
          </p>
        </div>
      </CreatorAuthShell>
    );
  }

  return (
    <CreatorAuthShell
      wide
      eyebrow={selectedPlan.name}
      title="Create your VYBE Creator account"
      description={
        selectedPlan.code === "creator_free"
          ? "Start with Creator Free and enter a professional workspace built for your music, content, audience, and creator home."
          : `You selected ${selectedPlan.name} at ${selectedPriceLabel}. Create your creator account, then continue to activate your selected membership.`
      }
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
          <Music2 className="h-4 w-4 text-primary" />
          {selectedPlan.name}{" "}
          {selectedPlan.code === "creator_free" ? "starts here" : `selected - ${selectedPriceLabel}`}
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
          <Input id="creator-name" required maxLength={60} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="creator-signup-email">Email</Label>
          <Input id="creator-signup-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="creator-signup-password">Password</Label>
          <Input id="creator-signup-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="creator-confirm-password">Confirm password</Label>
          <Input id="creator-confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
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
            <Link to="/terms" target="_blank" className="text-foreground underline">Terms</Link>,{" "}
            <Link to="/privacy" target="_blank" className="text-foreground underline">Privacy Policy</Link>,{" "}
            <Link to="/community-guidelines" target="_blank" className="text-foreground underline">Community Guidelines</Link>, and{" "}
            <Link to="/copyright" target="_blank" className="text-foreground underline">Copyright Policy</Link>.
            Version {LEGAL_POLICY_VERSION}.
          </Label>
        </div>

        <CreatorRightsProtectionAcknowledgements
          value={rightsAcknowledgements}
          onChange={(key, checked) =>
            setRightsAcknowledgements((current) => ({ ...current, [key]: checked }))
          }
        />

        <SubmitButton loading={loading}>Create Creator Account</SubmitButton>
      </form>
    </CreatorAuthShell>
  );
}