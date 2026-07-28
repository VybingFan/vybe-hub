import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Headphones, Loader2, Music2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/AuthCard";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { SELECTABLE_ROLES, type SelectableRole } from "@/features/auth/roles";
import { z } from "zod";

const onboardingSearchSchema = z.object({
  role: z.enum(["creator", "supporter"]).optional(),
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
  };

function OnboardingPage() {
  const { role } = Route.useSearch();
  const { assignInitialRole } = useAuth();
  const { isLoading, isAuthenticated, primaryRole, defaultRoute } = {
    ...useUser(),
    isAuthenticated: useAuth().isAuthenticated,
  };
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SelectableRole>(role ?? "creator");
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
  if (primaryRole) {
    navigate({ to: defaultRoute });
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await assignInitialRole(selected);
      toast.success("You're all set");
      navigate({ to: "/auth/redirect" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save role");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthCard
      title="Join the VYBE"
      description="Choose a free account type. Paid upgrades and personal Founding Creator invitations unlock more."
    >
      <form onSubmit={onSubmit} className="space-y-4">
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
        <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Have a personal Founding Creator invitation? Open that link after creating your account
            to activate its expanded access.
          </p>
        </div>
        <SubmitButton loading={saving}>Continue</SubmitButton>
      </form>
    </AuthCard>
  );
}
