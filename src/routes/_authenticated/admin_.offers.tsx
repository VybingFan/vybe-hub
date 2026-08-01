import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Gift, Tags } from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminService, type BusinessOfferRecord } from "@/services/admin/adminService";

export const Route = createFileRoute("/_authenticated/admin_/offers")({ component: OffersRoute });

function OffersRoute() {
  const [offers, setOffers] = useState<BusinessOfferRecord[]>([]);
  useEffect(() => {
    void adminService
      .listBusinessOffers()
      .then(setOffers)
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Could not load offers"),
      );
  }, []);
  return (
    <AdminPermissionGuard anyOf={["admin.business.read"]}>
      <div className="mx-auto max-w-6xl space-y-7">
        <header>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Back Office
            </Link>
          </Button>
          <div className="mt-3 flex items-center gap-2 text-primary">
            <Gift className="h-5 w-5" /> Offer operations
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Offers & Promotions</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review business-funded member offers and keep their dates, codes, and approval state
            visible.
          </p>
        </header>
        <Card>
          <CardContent className="flex gap-3 p-5 text-sm">
            <Tags className="h-5 w-5 shrink-0 text-primary" />
            <p>
              <strong>Platform membership promotions:</strong> Stripe coupons and promotion codes
              remain the billing source of truth. A controlled VYBE promotion editor should be added
              only when redemption tracking is connected.
            </p>
          </CardContent>
        </Card>
        {!offers.length ? (
          <Card>
            <CardContent className="p-7 text-sm text-muted-foreground">
              No business offers have been created yet.
            </CardContent>
          </Card>
        ) : null}
        <div className="space-y-3">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardContent className="space-y-2 p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <div>
                    <p className="font-semibold">{offer.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {offer.business_profiles?.public_name ?? "Business partner"}
                    </p>
                  </div>
                  <Badge variant={offer.status === "active" ? "default" : "outline"}>
                    {offer.status}
                  </Badge>
                </div>
                <p className="text-sm">{offer.description}</p>
                <p className="text-xs text-muted-foreground">
                  {offer.offer_code ? `Code ${offer.offer_code} · ` : ""}
                  {offer.ends_at
                    ? `Ends ${new Date(offer.ends_at).toLocaleDateString()}`
                    : "No end date"}
                  {offer.max_redemptions ? ` · Limit ${offer.max_redemptions}` : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminPermissionGuard>
  );
}
