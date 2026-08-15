import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema } from "@/features/auth/roles";
import { useAuth } from "@/hooks/useAuth";
import {
  isAllowedOperationsHost,
  operationsSessionService,
} from "@/services/admin/operationsSessionService";

export const Route = createFileRoute("/operations/sign-in")({
  component: OperationsSignInPage,
});

function OperationsSignInPage() {
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = signInSchema.safeParse({ email, password, rememberMe: false });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!isAllowedOperationsHost()) {
      toast.error("Operations access is unavailable.");
      return;
    }

    setLoading(true);
    try {
      await signIn(parsed.data.email, parsed.data.password, false);
      await operationsSessionService.start();
      await navigate({ to: "/admin" });
    } catch {
      await signOut().catch(() => undefined);
      toast.error("Operations access is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-violet-500/15 p-3 text-violet-300">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Authorized staff</p>
            <h1 className="text-2xl font-semibold">VYBE Operations</h1>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-400">
          Sign in through the dedicated Operations entrance. Access is time-limited and audited.
        </p>
        <form className="mt-7 space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="operations-email">Email</Label>
            <Input id="operations-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="border-slate-700 bg-slate-950" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="operations-password">Password</Label>
            <Input id="operations-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="border-slate-700 bg-slate-950" />
          </div>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Authorizing…" : "Enter Operations"}
          </Button>
        </form>
        <p className="mt-5 text-xs leading-5 text-slate-500">
          Operations authorization expires after 8 hours or 30 minutes of inactivity. MFA enforcement is not yet enabled.
        </p>
      </section>
    </main>
  );
}
