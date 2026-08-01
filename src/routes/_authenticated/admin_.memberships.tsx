import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, CreditCard, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CREATOR_PLAN_CATALOG } from "@/features/membership/catalog";
import {
  adminService,
  type AdminMembershipRecord,
  type BusinessPackageRecord,
} from "@/services/admin/adminService";

export const Route = createFileRoute("/_authenticated/admin_/memberships")({
  component: MembershipOperationsRoute,
});

function MembershipOperationsRoute() {
  return (
    <AdminPermissionGuard anyOf={["admin.finance.read", "admin.creator.membership"]}>
      <MembershipOperations />
    </AdminPermissionGuard>
  );
}

function MembershipOperations() {
  const [memberships, setMemberships] = useState<AdminMembershipRecord[]>([]);
  const [packages, setPackages] = useState<BusinessPackageRecord[]>([]);
  useEffect(() => {
    void Promise.all([adminService.listMemberships(), adminService.listBusinessPackages()])
      .then(([nextMemberships, nextPackages]) => {
        setMemberships(nextMemberships);
        setPackages(nextPackages);
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Could not load memberships"),
      );
  }, []);
  const active = memberships.filter((membership) => membership.status === "active").length;
  const paid = memberships.filter((membership) => membership.plan_code !== "creator_free").length;
  const renewals = useMemo(
    () =>
      memberships.filter((membership) => {
        if (!membership.current_period_end) return false;
        const days = (new Date(membership.current_period_end).getTime() - Date.now()) / 86_400_000;
        return days >= 0 && days <= 30;
      }),
    [memberships],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Back Office
          </Link>
        </Button>
        <div className="mt-3 flex items-center gap-2 text-primary">
          <CreditCard className="h-5 w-5" /> Revenue operations
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Memberships & Packages</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Source-of-truth pricing, launch readiness, active entitlements, and upcoming renewals.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Entitlements" value={memberships.length} />
        <Metric label="Active" value={active} />
        <Metric label="Paid-plan records" value={paid} />
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Creator memberships</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {CREATOR_PLAN_CATALOG.map((plan) => (
            <Card key={plan.code}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{plan.name}</CardTitle>
                  <Badge variant={plan.launchState === "available" ? "default" : "outline"}>
                    {plan.launchState === "available" ? "Available" : "Parts under construction"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-lg font-semibold">
                  ${plan.monthlyPrice}/month · ${plan.annualPrice}/year
                </p>
                <p className="text-muted-foreground">{plan.audience}</p>
                <p>{plan.analytics}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Business packages</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {packages.map((item) => (
            <Card key={item.code}>
              <CardContent className="space-y-2 p-5">
                <PackageCheck className="h-5 w-5 text-primary" />
                <p className="font-semibold">{item.name}</p>
                <p className="text-2xl font-semibold">
                  ${(item.price_cents / 100).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.billing_interval} · {item.active_campaign_limit} active campaign(s)
                </p>
                <Badge variant={item.is_public ? "default" : "outline"}>
                  {item.is_public ? "Public" : "Admin assigned"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <CalendarClock className="h-5 w-5" /> Next 30 days
        </h2>
        <Card>
          <CardContent className="p-5 text-sm">
            {renewals.length ? (
              renewals.map((item) => (
                <div
                  key={item.user_id}
                  className="flex justify-between border-b py-2 last:border-0"
                >
                  <span>{item.plan_code.replaceAll("_", " ")}</span>
                  <span>
                    {new Date(item.current_period_end!).toLocaleDateString()}
                    {item.cancel_at_period_end ? " · cancels" : " · renewal"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">
                No creator renewal or cancellation dates in the next 30 days.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
