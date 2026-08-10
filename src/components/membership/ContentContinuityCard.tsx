import { ArchiveRestore, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useMembershipAdjustment } from "@/hooks/useMembershipAdjustment";

export function ContentContinuityCard() {
  const { data: adjustment } = useMembershipAdjustment();
  if (!adjustment || adjustment.status === "restored") return null;
  const expired = adjustment.status === "expired";
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5">
      <div className="flex gap-3">
        {expired ? <ArchiveRestore className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> : <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{expired ? "Your work remains preserved" : "Prepare your public creator page"}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {expired
              ? "Items above your current membership allowance are retained privately—not deleted. Upgrade to restore qualifying access."
              : "Choose the strongest work to keep public before your adjustment period ends. Everything else remains safely stored in your workspace."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm"><Link to="/music">Organize music</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/playlists">Organize playlists</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/creator-memberships">Compare plans</Link></Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Public visitors never see membership locks, limits, or adjustment notices.</p>
        </div>
      </div>
    </div>
  );
}
