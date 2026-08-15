import { useEffect, useState, type ReactNode } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAllowedOperationsHost, operationsHostUrl, operationsSessionService } from "@/services/admin/operationsSessionService";

export function OperationsBoundary({ active, children }: { active: boolean; children: ReactNode }) {
  const [state, setState] = useState<"loading" | "allowed" | "denied">(active ? "loading" : "allowed");
  useEffect(() => {
    if (!active) { setState("allowed"); return; }
    if (!isAllowedOperationsHost()) { setState("denied"); return; }
    let mounted = true;
    void operationsSessionService.validate().then((result) => { if (mounted) setState(result.valid ? "allowed" : "denied"); });
    return () => { mounted = false; };
  }, [active]);
  if (state === "loading") return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-7 w-7 animate-spin" /></div>;
  if (state === "denied") return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="max-w-md rounded-2xl border bg-card p-8 text-center"><ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" /><h1 className="mt-4 text-xl font-semibold">This area is unavailable</h1><p className="mt-2 text-sm text-muted-foreground">Use the authorized staff entrance to continue.</p><Button className="mt-6" onClick={() => window.location.assign(operationsHostUrl())}>Continue</Button></div></div>;
  return <>{children}</>;
}
