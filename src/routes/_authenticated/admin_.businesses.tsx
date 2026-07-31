import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeDollarSign,
  BarChart3,
  BriefcaseBusiness,
  FileCheck2,
  Megaphone,
  Plus,
  RefreshCw,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  businessAdminService,
  type BusinessRecord,
  type BusinessSummary,
  type CampaignRecord,
} from "@/services/business/businessAdminService";

export const Route = createFileRoute("/_authenticated/admin_/businesses")({
  component: BusinessOperationsPage,
});

const packageLabels = {
  founding_preview: "Founding Business Preview - Free / 60 days",
  founding_partner: "Founding Business Partner - $499 / year",
  custom_campaign: "Custom Campaign or Sponsorship",
} as const;

function BusinessOperationsPage() {
  const [summary, setSummary] = useState<BusinessSummary | null>(null);
  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSummary, nextBusinesses, nextCampaigns] = await Promise.all([
        businessAdminService.getSummary(),
        businessAdminService.listBusinesses(),
        businessAdminService.listCampaigns(),
      ]);
      setSummary(nextSummary);
      setBusinesses(nextBusinesses);
      setCampaigns(nextCampaigns);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load business operations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createBusiness(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSavingBusiness(true);
    try {
      await businessAdminService.createBusiness({
        publicName: String(form.get("publicName") ?? ""),
        slug: String(form.get("slug") ?? ""),
        category: String(form.get("category") ?? ""),
        contactName: String(form.get("contactName") ?? ""),
        contactEmail: String(form.get("contactEmail") ?? ""),
        websiteUrl: String(form.get("websiteUrl") ?? ""),
        packageCode: String(form.get("packageCode")) as keyof typeof packageLabels,
      });
      event.currentTarget.reset();
      toast.success("Business partner record created");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create business");
    } finally {
      setSavingBusiness(false);
    }
  }

  async function createCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSavingCampaign(true);
    try {
      await businessAdminService.createCampaign({
        businessId: String(form.get("businessId") ?? ""),
        name: String(form.get("name") ?? ""),
        objective: String(form.get("objective") ?? ""),
      });
      event.currentTarget.reset();
      toast.success("Draft campaign created");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create campaign");
    } finally {
      setSavingCampaign(false);
    }
  }

  async function verifyBusiness(businessId: string) {
    try {
      await businessAdminService.verifyBusiness(businessId);
      toast.success("Business verified for campaign setup");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not verify business");
    }
  }

  const verifiedBusinesses = useMemo(
    () => businesses.filter((business) => business.verification_status === "verified"),
    [businesses],
  );

  return (
    <RoleGuard allow={["admin"]}>
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <Button asChild variant="ghost" className="-ml-3 mb-4">
            <Link to="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to administration
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" /> Owner and administrator only
          </div>
          <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Business Operations
              </h1>
              <p className="mt-2 max-w-3xl leading-7 text-muted-foreground">
                Qualify partners, control packages and campaigns, verify advertising activity, and
                keep the records required to support every promise.
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {summary
              ? `Business summary refreshed ${new Date(summary.generated_at).toLocaleString()}`
              : loading
                ? "Loading business operations…"
                : "Business summary unavailable"}
          </p>
        </header>

        {summary ? <BusinessSummaryCards summary={summary} /> : null}

        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="font-semibold">Controlled launch boundary</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This foundation stores and verifies partner activity. No campaign appears publicly until
            its business, creative, campaign, and placement have each passed approval and the
            placement is inside its scheduled window.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Add a business partner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={createBusiness}>
                <Field name="publicName" label="Public business name" required />
                <Field
                  name="slug"
                  label="URL slug"
                  placeholder="business-name"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  required
                />
                <Field name="category" label="Category" placeholder="Recording studio" required />
                <Field name="contactName" label="Contact person" />
                <Field name="contactEmail" label="Private contact email" type="email" required />
                <Field name="websiteUrl" label="Website" type="url" placeholder="https://" />
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="packageCode">Package</Label>
                  <select
                    id="packageCode"
                    name="packageCode"
                    defaultValue="founding_preview"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {Object.entries(packageLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Button disabled={savingBusiness}>
                    {savingBusiness ? "Creating…" : "Create partner record"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" /> Start a draft campaign
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={createCampaign}>
                <div className="space-y-2">
                  <Label htmlFor="businessId">Business</Label>
                  <select
                    id="businessId"
                    name="businessId"
                    required
                    defaultValue=""
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="" disabled>
                      Choose a verified business
                    </option>
                    {verifiedBusinesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.public_name}
                      </option>
                    ))}
                  </select>
                  {verifiedBusinesses.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Verify a partner before opening its first campaign.
                    </p>
                  ) : null}
                </div>
                <Field name="name" label="Campaign name" required />
                <div className="space-y-2">
                  <Label htmlFor="objective">Objective</Label>
                  <Textarea
                    id="objective"
                    name="objective"
                    required
                    placeholder="Describe the measurable purpose of this campaign."
                  />
                </div>
                <Button disabled={savingCampaign || verifiedBusinesses.length === 0}>
                  {savingCampaign ? "Creating…" : "Create draft campaign"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BriefcaseBusiness className="h-5 w-5 text-primary" /> Business directory
            </CardTitle>
          </CardHeader>
          <CardContent>
            {businesses.length === 0 ? (
              <EmptyCopy>No business records yet. Add the first pilot partner above.</EmptyCopy>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {businesses.map((business) => (
                  <div key={business.id} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{business.public_name}</p>
                        <p className="text-sm text-muted-foreground">{business.category}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            business.verification_status === "verified" ? "default" : "outline"
                          }
                        >
                          {business.verification_status}
                        </Badge>
                        <Badge variant="secondary">{business.partner_status}</Badge>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {business.contact_email} · /business/{business.slug}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {business.package_code
                        ? (packageLabels[business.package_code as keyof typeof packageLabels] ??
                          business.package_code)
                        : "No package assigned"}
                    </p>
                    {business.verification_status === "pending" ? (
                      <Button
                        className="mt-3"
                        size="sm"
                        variant="outline"
                        onClick={() => void verifyBusiness(business.id)}
                      >
                        <FileCheck2 className="mr-2 h-4 w-4" /> Verify partner
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Campaign inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <EmptyCopy>
                No campaigns yet. Campaigns begin as drafts and require approval.
              </EmptyCopy>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    to="/admin/campaigns/$campaignId"
                    params={{ campaignId: campaign.id }}
                    className="flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row"
                  >
                    <div>
                      <p className="font-semibold">{campaign.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {campaign.business_profiles?.public_name ?? "Business"} ·{" "}
                        {campaign.objective}
                      </p>
                    </div>
                    <Badge className="h-fit w-fit" variant="outline">
                      {campaign.status.replaceAll("_", " ")}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <ReadinessCard
            icon={FileCheck2}
            title="Partner records"
            detail="Applications, agreements, briefs, assets, reports, and case-study permissions have controlled document records."
          />
          <ReadinessCard
            icon={TicketCheck}
            title="Offers and redemption"
            detail="Member offers, codes, claims, verification, expiration, and redemption limits have dedicated records."
          />
          <ReadinessCard
            icon={BadgeDollarSign}
            title="Measurement"
            detail="Campaign events preserve placement, creative, session, validity, attribution, and internal-traffic status."
          />
        </div>
      </div>
    </RoleGuard>
  );
}

function BusinessSummaryCards({ summary }: { summary: BusinessSummary }) {
  const cards = [
    ["Businesses", summary.businesses.total, `${summary.businesses.pending} awaiting verification`],
    ["Founding previews", summary.businesses.preview, "Free 60-day partner records"],
    ["Annual partners", summary.businesses.annual, "$499 founding package records"],
    ["Campaign review", summary.campaigns.review, `${summary.campaigns.active} active campaigns`],
    ["Active offers", summary.operations.active_offers, "Approved member benefits"],
    ["Verified events", summary.operations.valid_events, "Excludes invalid and internal traffic"],
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(([label, value, note]) => (
        <Card key={String(label)}>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.name}>{label}</Label>
      <Input id={props.name} {...props} />
    </div>
  );
}

function EmptyCopy({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function ReadinessCard({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof FileCheck2;
  title: string;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <Icon className="h-5 w-5 text-primary" />
        <p className="mt-3 font-semibold">{title}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
