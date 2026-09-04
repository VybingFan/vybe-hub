import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LegalAcceptanceGate } from "@/components/legal/LegalAcceptanceGate";
import { IdentityModeBar } from "@/components/identity/IdentityModeBar";
import { OperationsBoundary } from "@/components/auth/OperationsBoundary";

/**
 * Integration-managed auth gate. Client-only (ssr:false) because the Supabase
 * session lives in localStorage and can't be read on the server.
 */
export const Route = createFileRoute("/_authenticated")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth/sign-in" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const operations = pathname === "/admin" || pathname.startsWith("/admin/");
  return <OperationsBoundary active={operations}><LegalAcceptanceGate><IdentityModeBar /><Outlet /></LegalAcceptanceGate></OperationsBoundary>;
}

