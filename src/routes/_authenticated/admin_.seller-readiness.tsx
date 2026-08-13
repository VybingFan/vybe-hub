import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/_authenticated/admin_/seller-readiness")({ component: () => <RoleGuard allow={["admin"]}><SellerReadiness /></RoleGuard> });
function SellerReadiness() {
  const { data = [] } = useQuery({ queryKey: ["admin-seller-readiness"], queryFn: async () => { const { data, error } = await (supabase as any).from("commerce_seller_accounts").select("creator_id,onboarding_status,payouts_ready,requirements_due,last_synced_at").order("updated_at", { ascending: false }); if (error) throw error; return data || []; } });
  return <div className="mx-auto max-w-5xl space-y-5"><div><p className="text-sm font-medium text-primary">Commerce operations</p><h1 className="text-3xl font-semibold">Seller payout readiness</h1><p className="text-muted-foreground">Monitor Stripe onboarding status without viewing or storing creators' bank or identity details.</p></div><div className="space-y-3">{data.map((seller: any) => <Card key={seller.creator_id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><code className="text-xs">{seller.creator_id}</code><div className="flex gap-2"><Badge variant={seller.payouts_ready ? "default" : "outline"}>{seller.onboarding_status}</Badge><Badge variant="outline">{seller.requirements_due} due</Badge></div></CardContent></Card>)}{!data.length ? <Card><CardContent className="p-6 text-sm text-muted-foreground">No creators have started seller onboarding.</CardContent></Card> : null}</div></div>;
}
