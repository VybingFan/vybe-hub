import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BriefcaseBusiness, Headphones, Loader2, Music2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/AuthCard";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { SELECTABLE_ROLES, type SelectableRole } from "@/features/auth/roles";
import { requestCreatorOnboardingLaunch } from "@/features/guide/creatorOnboardingState";
import { z } from "zod";

const onboardingSearchSchema = z.object({
  role: z.enum(["creator", "supporter", "business"]).optional(),
});

export const Route = createFileRoute("/auth/onboarding")({
  validateSearch: onboardingSearchSchema,
  component: OnboardingPage,
});

const ROLE_META: Record<SelectableRole, { title: string; body: string; icon: typeof Headphones }> =
  {
    creator: {
      title: "I'm a Creator",
      body: "Start with Creator Free. Build your page, publish within Free limits, and upgrade as you grow.",
      icon: Music2,
    },
    supporter: {
      title: "I'm a Supporter",
      body: "Follow creators, discover new music, and support the artists you love.",
      icon: Headphones,
    },
    business: {
      title: "I'm a Business",
      body: "Apply to partner with VYBE, prepare member offers, and build campaigns in Business Studio.",
      icon: BriefcaseBusiness,
    },
  };

function OnboardingPage() {
  const { role } = Route.useSearch();
  const { assignInitialRole } = useAuth();
  const { isLoading, isAuthenticated, primaryRole, defaultRoute, user, hasRole } = {
    ...useUser(),
    isAuthenticated: useAuth().isAuthenticated,
  };
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SelectableRole | null>(role ?? null);
  const [showRoleChoices, setShowRoleChoices] = useState(!role);
  const [saving, setSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated) {
    navigate({ to: "/auth/sign-in" });
    return null;
  }
  const isAddingCreatorStudio =
    role === "creator" && hasRole("supporter") && !hasRole("creator");

  if (primaryRole && !isAddingCreatorStudio) {
    navigate({ to: defaultRoute });
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      toast.error("Choose how you want to join VYBE");
      return;
    }
    setSaving(true);
    try {
      await assignInitialRole(selected);
      if (selected === "creator") requestCreatorOnboardingLaunch(user?.id);
      toast.success("You're all set");
      navigate({ to: "/auth/redirect" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save role");
    } finally {
      setSaving(false);
    }
  }

  const intendedRole = role ? ROLE_META[role] : null;

  return (
    <AuthCard
      title={
        intendedRole && !showRoleChoices
          ? isAddingCreatorStudio
            ? "Add Creator Studio to your VYBE account"
            : role === "creator"
              ? "You're setting up your Creator account"
              : role === "supporter"
                ? "You're setting up your Supporter account"
                : "You're setting up your Business account"
          : "How do you want to join VYBE?"
      }
      description={
        intendedRole && !showRoleChoices
          ? isAddingCreatorStudio
            ? "Creator Studio is for publishing and managing your creative work. It will be added to this same VYBE login and starts on Creator Free."
            : role === "creator"
              ? "Your Creator account starts on Creator Free. You can add other VYBE identities later without creating another login."
              : role === "supporter"
                ? "You're creating a Supporter account. You can add Creator Studio later from the same login if you decide to create on VYBE."
                : "You're creating a Business account for VYBE partnerships and campaigns."
          : "Choose the account type that matches what you want to do on VYBE. You must make a selection before continuing."
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {intendedRole && !showRoleChoices ? (
          <div className="space-y-3">
            <Card className="border-primary/60 bg-card shadow-glow">
              <CardContent className="flex items-start gap-4 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground">
                  <intendedRole.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{intendedRole.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{intendedRole.body}</p>
                </div>
              </CardContent>
            </Card>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setShowRoleChoices(true);
              }}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Need a different account type? Change account type
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {SELECTABLE_ROLES.map((r) => {
              const meta = ROLE_META[r];
              const active = selected === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelected(r)}
                  className="w-full text-left"
                >
                  <Card
                    className={cn(
                      "border-border/50 bg-card/60 transition-all",
                      !role && !selected && r === "supporter" && "border-primary/30 bg-card/80",
                      active && "border-primary/60 bg-card shadow-glow",
                    )}
                  >
                    <CardContent className="flex items-start gap-4 p-4">
                      <div
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground",
                          active && "bg-gradient-brand text-primary-foreground",
                        )}
                      >
                        <meta.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{meta.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{meta.body}</p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Have a personal Founding Creator invitation? Open that link after creating your account
            to activate its expanded access.
          </p>
        </div>
        <SubmitButton loading={saving} disabled={!selected}>
          {intendedRole && !showRoleChoices
            ? isAddingCreatorStudio
              ? "Add Creator Studio"
              : role === "creator"
                ? "Continue with Creator account"
                : role === "business"
                  ? "Continue with Business account"
                  : "Continue with Supporter account"
            : selected
              ? `Continue as ${ROLE_META[selected].title.replace("I'm a ", "")}`
              : "Choose an account type to continue"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
