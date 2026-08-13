import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { stripeConnectService } from "@/services/commerce/stripeConnectService";

const labels = { not_started: "Not started", incomplete: "Incomplete", under_review: "Under review", restricted: "Restricted", ready: "Ready" } as const;

export function StripeSellerReadinessCard() {
  const [accepted, setAccepted] = useState(false);
  const [opening, setOpening] = useState(false);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["stripe-seller-readiness"], queryFn: stripeConnectService.status, retry: false });
  const start = async () => {
    if (!accepted && data?.onboarding_status === "not_started") return toast.error("Read and accept the seller terms first.");
    setOpening(true);
    try { window.location.assign(await stripeConnectService.onboard(accepted)); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Seller setup could not be opened."); setOpening(false); }
  };
  return <Card><CardContent className="space-y-4 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex gap-3"><ShieldCheck className="mt-1 h-5 w-5 text-primary" /><div><h2 className="font-semibold">Seller payout setup</h2><p className="text-sm text-muted-foreground">Stripe securely collects identity and bank details. VYBE stores only readiness status.</p></div></div><Badge variant={data?.payouts_ready ? "default" : "outline"}>{isLoading ? "Checking" : labels[data?.onboarding_status || "not_started"]}</Badge></div>
    {data?.onboarding_status === "not_started" ? <label className="flex items-start gap-3 rounded-xl border p-3 text-sm"><Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} /><span>I agree to VYBE's Seller Terms, confirm my sales information is accurate, and understand Stripe must verify me before payouts can begin.</span></label> : null}
    <div className="flex flex-wrap gap-2"><Button onClick={start} disabled={opening || isLoading}><ExternalLink className="mr-2 h-4 w-4" />{data?.onboarding_status === "not_started" ? "Start secure Stripe setup" : data?.payouts_ready ? "Review Stripe account" : "Continue Stripe setup"}</Button><Button variant="outline" onClick={() => void refetch()}>Refresh status</Button></div>
    {!data?.payouts_ready ? <p className="text-xs text-muted-foreground">Sales listings remain drafts until Stripe confirms payout readiness. Checkout is still disabled platform-wide in this release.</p> : null}
  </CardContent></Card>;
}
