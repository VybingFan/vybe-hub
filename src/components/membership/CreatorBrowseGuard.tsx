import { useEffect, useState, type ReactNode } from "react";
import { Compass, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActiveIdentity } from "@/components/identity/IdentityModeBar";
import { useMembership } from "@/hooks/useMembership";
import { hasCreatorFeature } from "@/features/membership/entitlements";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/integrations/supabase/client";

export function CreatorBrowseGuard({ children }: { children: ReactNode }) {
  const { hasAnyRole } = useUser();
  const membership = useMembership(hasAnyRole(["creator"]));
  const [active, setActive] = useState(() => getActiveIdentity());

  useEffect(() => {
    const sync = () => setActive(getActiveIdentity());
    window.addEventListener("vybe:identity-changed", sync as EventListener);
    return () => window.removeEventListener("vybe:identity-changed", sync as EventListener);
  }, []);

  if (!hasAnyRole(["creator"])) return <>{children}</>;
  if (active?.identity_type === "supporter") return <>{children}</>;
  if (hasCreatorFeature(membership.data?.plan_code, "creator_mode.browse")) return <>{children}</>;

  async function switchToSupporter() {
    const { data, error } = await (supabase.rpc as any)("ensure_my_identities");
    if (error || !Array.isArray(data)) return;
    const supporter = data.find((item: any) => item.identity_type === "supporter");
    if (!supporter) return;
    await (supabase.rpc as any)("set_my_active_identity", { p_identity_id: supporter.id });
    localStorage.setItem("vybe:active-identity", JSON.stringify(supporter));
    window.dispatchEvent(new CustomEvent("vybe:identity-changed", { detail: supporter }));
    setActive(supporter);
  }

  return <div className="mx-auto max-w-xl rounded-2xl border border-primary/25 bg-card p-6 text-center">
    <ShieldAlert className="mx-auto h-8 w-8 text-primary" />
    <h2 className="mt-3 text-xl font-semibold">Switch to Supporter Mode to explore VYBE</h2>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">Creator Free and Creator Plus keep general VYBE browsing in Supporter Mode. Creator Pro, Studio, and eligible Founding access can browse directly in Creator Mode.</p>
    <Button className="mt-5" onClick={() => void switchToSupporter()}><Compass className="mr-2 h-4 w-4"/>Switch to Supporter Mode</Button>
  </div>;
}
