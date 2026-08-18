import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Music2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CreatorAuthShell } from "@/components/auth/CreatorAuthShell";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { signInSchema } from "@/features/auth/roles";

export const Route = createFileRoute("/creator/sign-in")({
  component: CreatorSignInPage,
});

function CreatorSignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email, password, rememberMe });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await signIn(parsed.data.email, parsed.data.password, parsed.data.rememberMe);
      window.sessionStorage.setItem("vybe:active-workspace", "creator_studio");
      toast.success("Welcome back to Creator Studio");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CreatorAuthShell eyebrow="Professional creator access"
      title="Creator Studio Sign In"
      description="Professional access for VYBE creators. Manage your creator home, music, content, audience, and growth tools."
      footer={
        <div className="space-y-2 text-center">
          <p>
            New creator?{" "}
            <Link to="/creator/sign-up" className="text-foreground underline-offset-4 hover:underline">
              Create a creator account
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Looking for the fan experience?{" "}
            <Link to="/auth/sign-in" className="text-foreground underline-offset-4 hover:underline">
              Supporter sign in
            </Link>
          </p>
        </div>
      }
    >
      <div className="mb-5 grid gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold">
          <Music2 className="h-4 w-4 text-primary" /> VYBE for Creators
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" /> Your professional creator workspace
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" /> Your professional tools stay organized in Creator Studio
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 [&_label]:text-zinc-200 [&_input]:border-white/10 [&_input]:bg-white/5 [&_input]:text-white [&_input]:placeholder:text-zinc-600">
        <div className="space-y-2">
          <Label htmlFor="creator-email">Creator email</Label>
          <Input
            id="creator-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.fm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="creator-password">Password</Label>
            <Link
              to="/auth/forgot-password"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="creator-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={rememberMe}
            onCheckedChange={(value) => setRememberMe(value === true)}
            id="creator-remember"
          />
          <span>Remember me on this device</span>
        </label>

        <SubmitButton loading={loading}>Open Creator Studio</SubmitButton>
      </form>
    </CreatorAuthShell>
  );
}
