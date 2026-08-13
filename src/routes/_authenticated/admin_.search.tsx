import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Megaphone, Search, Tags, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_SEARCH_DESTINATIONS } from "@/features/admin/adminSearchCatalog";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  adminService,
  type AdminCreatorRecord,
  type BusinessOfferRecord,
} from "@/services/admin/adminService";
import {
  businessAdminService,
  type BusinessRecord,
  type CampaignRecord,
} from "@/services/business/businessAdminService";

export const Route = createFileRoute("/_authenticated/admin_/search")({
  validateSearch: (search: Record<string, unknown>) => ({ q: String(search.q ?? "") }),
  component: AdminSearchRoute,
});

function AdminSearchRoute() {
  const { q } = Route.useSearch();
  const [accounts, setAccounts] = useState<AdminCreatorRecord[]>([]);
  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [offers, setOffers] = useState<BusinessOfferRecord[]>([]);
  const destinationMatches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return ADMIN_SEARCH_DESTINATIONS.filter((item) =>
      [item.title, item.detail, item.keywords].some((value) =>
        value.toLowerCase().includes(needle),
      ),
    );
  }, [q]);
  useEffect(() => {
    if (!q.trim()) return;
    void Promise.all([
      adminService.listCreators(q),
      businessAdminService.listBusinesses(),
      businessAdminService.listCampaigns(),
      adminService.listBusinessOffers(),
    ])
      .then(([a, b, c, o]) => {
        const needle = q.toLowerCase();
        setAccounts(a);
        setBusinesses(
          b.filter((item) =>
            [item.public_name, item.contact_email, item.slug, item.category].some((value) =>
              value?.toLowerCase().includes(needle),
            ),
          ),
        );
        setCampaigns(
          c.filter((item) =>
            [item.name, item.objective, item.status, item.business_profiles?.public_name].some(
              (value) => value?.toLowerCase().includes(needle),
            ),
          ),
        );
        setOffers(
          o.filter((item) =>
            [
              item.title,
              item.description,
              item.offer_code,
              item.status,
              item.business_profiles?.public_name,
            ].some((value) => value?.toLowerCase().includes(needle)),
          ),
        );
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Operational search failed"),
      );
  }, [q]);
  const total = useMemo(
    () => destinationMatches.length + accounts.length + businesses.length + campaigns.length + offers.length,
    [destinationMatches, accounts, businesses, campaigns, offers],
  );

  return (
    <AdminPermissionGuard anyOf={["admin.search"]}>
      <div className="mx-auto max-w-6xl space-y-7">
        <header>
          <div className="flex items-center gap-2 text-primary">
            <Search className="h-5 w-5" /> Back Office search
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {q ? `Results for “${q}”` : "Search operations"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {q
              ? `${total} matching operational records`
              : "Search accounts, creators, businesses, rights, memberships, reports, and administrative tools."}
          </p>
        </header>
        {destinationMatches.length ? (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Search className="h-4 w-4 text-primary" />
              Administrative work areas
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {destinationMatches.map((item) => (
                <Link key={item.href} to={item.href as any}>
                  <Card className="h-full transition hover:border-primary/40">
                    <CardContent className="p-4">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        <ResultSection
          title="Members & Accounts"
          icon={UsersRound}
          href="/admin/accounts"
          items={accounts.map((item) => ({
            id: item.user_id,
            title: item.display_name || "Unnamed account",
            detail: item.email || "No email",
            status: item.roles.join(", ") || "role incomplete",
          }))}
        />
        <ResultSection
          title="Businesses"
          icon={BriefcaseBusiness}
          href="/admin/businesses"
          items={businesses.map((item) => ({
            id: item.id,
            title: item.public_name,
            detail: item.contact_email,
            status: item.verification_status,
          }))}
        />
        <ResultSection
          title="Campaigns"
          icon={Megaphone}
          href="/admin/businesses"
          items={campaigns.map((item) => ({
            id: item.id,
            title: item.name,
            detail: item.business_profiles?.public_name || item.objective,
            status: item.status,
          }))}
        />
        <ResultSection
          title="Offers"
          icon={Tags}
          href="/admin/offers"
          items={offers.map((item) => ({
            id: item.id,
            title: item.title,
            detail: item.business_profiles?.public_name || item.description,
            status: item.status,
          }))}
        />
      </div>
    </AdminPermissionGuard>
  );
}

function ResultSection({
  title,
  icon: Icon,
  href,
  items,
}: {
  title: string;
  icon: typeof Search;
  href: "/admin/accounts" | "/admin/businesses" | "/admin/offers";
  items: Array<{ id: string; title: string; detail: string; status: string }>;
}) {
  if (!items.length) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h2>
        <Link to={href} className="text-sm text-primary hover:underline">
          Open work area
        </Link>
      </div>
      <Card>
        <CardContent className="divide-y p-0">
          {items.slice(0, 20).map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
              <Badge variant="outline">{item.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
