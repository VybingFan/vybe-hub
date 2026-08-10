import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMembershipAdjustment } from "@/hooks/useMembershipAdjustment";
import { Link } from "@tanstack/react-router";

const PLAN_NAMES: Record<string, string> = {
    creator_free: "Creator Free",
    creator_plus: "Creator Plus",
    creator_pro: "Creator Pro",
    creator_studio: "Creator Studio",
    founding_beta: "Founding Creator",
};
const planName = (code: string) => PLAN_NAMES[code] || code;

export function MembershipAdjustmentNotice() {
  const { data: adjustment, isLoading } = useMembershipAdjustment();
  if (isLoading || !adjustment) return null;

  if (adjustment.status === "restored") {
    return (
      <div className="flex gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
        <div>
          <p className="font-semibold">Membership access restored</p>
          <p className="mt-1 text-muted-foreground">Your preserved creator work remains available. No automatic deletion occurred.</p>
        </div>
      </div>
    );
  }

  const expired = adjustment.status === "expired";
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${expired ? "border-destructive/35 bg-destructive/5" : "border-amber-500/35 bg-amber-500/5"}`}>
      <div className="flex gap-3">
        {expired ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" /> : <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{expired ? "Membership adjustment period ended" : `${adjustment.days_remaining} days to restore full access`}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Your membership changed from {planName(adjustment.previous_plan_code)} to {planName(adjustment.target_plan_code)}. VYBE has not automatically deleted your creator work.
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {expired ? "Some editing or publishing controls may remain unavailable until you upgrade or organize content within the current plan limits." : `Reactivate by ${new Date(adjustment.ends_at).toLocaleDateString()} to restore qualifying access without rebuilding your workspace.`}
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link to="/creator-memberships">Compare memberships</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
