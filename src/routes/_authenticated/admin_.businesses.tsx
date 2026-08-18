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
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
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
  type OperationsBusinessSubmission,
  type BusinessSubmissionReviewEvent,
  type BusinessSubmissionReviewAction,
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
  const [submissions, setSubmissions] = useState<OperationsBusinessSubmission[]>([]);
  const [reviewEvents, setReviewEvents] = useState<BusinessSubmissionReviewEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSummary, nextBusinesses, nextCampaigns, nextSubmissions, nextReviewEvents] =
        await Promise.all([
          businessAdminService.getSummary(),
          businessAdminService.listBusinesses(),
          businessAdminService.listCampaigns(),
          businessAdminService.listBusinessSubmissions(),
          businessAdminService.listBusinessSubmissionReviewEvents(),
        ]);
      setSummary(nextSummary);
      setBusinesses(nextBusinesses);
      setCampaigns(nextCampaigns);
      setSubmissions(nextSubmissions);
      setReviewEvents(nextReviewEvents);
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
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
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
      formElement.reset();
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
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSavingCampaign(true);
    try {
      await businessAdminService.createCampaign({
        businessId: String(form.get("businessId") ?? ""),
        name: String(form.get("name") ?? ""),
        objective: String(form.get("objective") ?? ""),
      });
      formElement.reset();
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

  async function reviewSubmission(
    submissionId: string,
    action: BusinessSubmissionReviewAction,
    businessResponse?: string | null,
    internalNotes?: string | null,
  ) {
    try {
      await businessAdminService.reviewBusinessSubmission({
        submissionId,
        action,
        businessResponse,
        internalNotes,
      });
      const message =
        action === "start_review"
          ? "Business request moved into review"
          : action === "approve"
            ? "Business request approved"
            : action === "decline"
              ? "Business request declined"
              : action === "update_response"
                ? "Business-visible response saved"
                : "Internal notes saved";
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update business request");
    }
  }
  const verifiedBusinesses = useMemo(
    () => businesses.filter((business) => business.verification_status === "verified"),
    [businesses],
  );

  return (
    <AdminPermissionGuard anyOf={["admin.business.read"]}>
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
            <div className="flex gap-2">
              <Button asChild variant="default">
                <Link to="/admin/business-pilot">
                  <Workflow className="mr-2 h-4 w-4" /> Open business pilot
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => void load()}
                aria-label="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {summary
              ? `Business summary refreshed ${new Date(summary.generated_at).toLocaleString()}`
              : loading
                ? "Loading business operationsâ€¦"
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
                  title="Use lowercase letters, numbers, and hyphens only."
                  onInput={(event) => {
                    event.currentTarget.value = event.currentTarget.value
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "");
                  }}
                  required
                />
                <p className="-mt-2 text-xs text-muted-foreground sm:col-span-2">
                  URL format: lowercase letters, numbers, and hyphens only. Example:
                  bagg-lady-business
                </p>
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
                    {savingBusiness ? "Creatingâ€¦" : "Create partner record"}
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
                  {savingCampaign ? "Creatingâ€¦" : "Create draft campaign"}
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
                      {business.contact_email} Â· /business/{business.slug}
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
              <BriefcaseBusiness className="h-5 w-5 text-primary" /> Incoming business requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <EmptyCopy>No submitted business proposals or requests yet.</EmptyCopy>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <BusinessSubmissionReviewCard
                    key={submission.id}
                    submission={submission}
                    events={reviewEvents.filter((event) => event.submission_id === submission.id)}
                    onAction={reviewSubmission}
                  />
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
                        {campaign.business_profiles?.public_name ?? "Business"} Â·{" "}
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
    </AdminPermissionGuard>
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

const requestTypeLabels: Record<OperationsBusinessSubmission["request_type"], string> = {
  campaign_proposal: "Campaign Proposal",
  offer_proposal: "Offer Proposal",
  sponsorship_placement: "Sponsorship / Placement Request",
  creative_brief: "Creative Brief",
};

function BusinessSubmissionReviewCard({
  submission,
  events,
  onAction,
}: {
  submission: OperationsBusinessSubmission;
  events: BusinessSubmissionReviewEvent[];
  onAction: (
    submissionId: string,
    action: BusinessSubmissionReviewAction,
    businessResponse?: string | null,
    internalNotes?: string | null,
  ) => Promise<void>;
}) {
  const [businessResponse, setBusinessResponse] = useState(submission.business_response ?? "");
  const [internalNotes, setInternalNotes] = useState(submission.internal_notes ?? "");

  useEffect(() => {
    setBusinessResponse(submission.business_response ?? "");
    setInternalNotes(submission.internal_notes ?? "");
  }, [submission.business_response, submission.internal_notes]);

  const reviewStarted = ["under_review", "approved", "declined"].includes(submission.status);
  const payload = Object.entries(submission.request_payload ?? {}).filter(
    ([, value]) => value !== null && value !== undefined && String(value).trim() !== "",
  );

  return (
    <div className="rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{submission.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {submission.business_profiles?.public_name ?? "Business"} Â·{" "}
            {requestTypeLabels[submission.request_type]}
          </p>
        </div>
        <Badge variant={submission.status === "under_review" ? "default" : "outline"} className="capitalize">
          {submission.status.replaceAll("_", " ")}
        </Badge>
      </div>

      <p className="mt-4 text-sm leading-6">{submission.summary}</p>

      {payload.length ? (
        <div className="mt-4 grid gap-2 rounded-xl bg-muted/50 p-4 text-sm sm:grid-cols-2">
          {payload.map(([key, value]) => (
            <div key={key}>
              <span className="font-medium capitalize">{key.replaceAll("_", " ")}:</span>{" "}
              <span className="text-muted-foreground">{String(value)}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span>
          Submitted: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "â€”"}
        </span>
        {submission.reviewed_at ? (
          <span>Last reviewed: {new Date(submission.reviewed_at).toLocaleString()}</span>
        ) : null}
      </div>

      <AdminPermissionGuard anyOf={["admin.business.manage"]} silent>
        <div className="mt-5 space-y-4 border-t pt-5">
          {submission.status === "submitted" ? (
            <Button size="sm" onClick={() => void onAction(submission.id, "start_review")}>
              Start Review
            </Button>
          ) : null}

          {reviewStarted ? (
            <>
              <div className="space-y-2">
                <Label htmlFor={`business-response-${submission.id}`}>Business-visible response</Label>
                <Textarea
                  id={`business-response-${submission.id}`}
                  value={businessResponse}
                  onChange={(event) => setBusinessResponse(event.target.value)}
                  placeholder="This message is visible to the business in its portal."
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void onAction(submission.id, "update_response", businessResponse, null)}
                >
                  Save Business Response
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`internal-notes-${submission.id}`}>Private Operations notes</Label>
                <Textarea
                  id={`internal-notes-${submission.id}`}
                  value={internalNotes}
                  onChange={(event) => setInternalNotes(event.target.value)}
                  placeholder="Internal only. Never shown in the Business Portal."
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void onAction(submission.id, "update_internal_notes", null, internalNotes)}
                >
                  Save Internal Notes
                </Button>
              </div>
            </>
          ) : null}

          {submission.status === "under_review" ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => void onAction(submission.id, "approve", businessResponse, internalNotes)}
              >
                Approve Request
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (window.confirm(`Decline "${submission.title}"?`)) {
                    void onAction(submission.id, "decline", businessResponse, internalNotes);
                  }
                }}
              >
                Decline Request
              </Button>
            </div>
          ) : null}
        </div>
      </AdminPermissionGuard>

      <div className="mt-5 border-t pt-4">
        <p className="text-sm font-semibold">Review history</p>
        {events.length ? (
          <div className="mt-3 space-y-2">
            {events.map((event) => (
              <div key={event.id} className="rounded-xl bg-muted/40 p-3 text-xs">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium capitalize">{event.action.replaceAll("_", " ")}</span>
                  <span className="text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {event.from_status.replaceAll("_", " ")} â†’ {event.to_status.replaceAll("_", " ")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">No review actions recorded yet.</p>
        )}
      </div>
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
