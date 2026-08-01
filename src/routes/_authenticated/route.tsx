import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LegalAcceptanceGate } from "@/components/legal/LegalAcceptanceGate";
import { IdentityModeBar } from "@/components/identity/IdentityModeBar";

/**
 * Integration-managed auth gate. Client-only (ssr:false) because the Supabase
 * session lives in localStorage and can't be read on the server.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth/sign-in" });
    return { user: data.user };
  },
  component: () => (
    <LegalAcceptanceGate>
      <IdentityModeBar />
      <Outlet />
    </LegalAcceptanceGate>
  ),
});

