import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Clock3,
  CreditCard,
  FileText,
  Megaphone,
  Pencil,
  Send,
  Settings,
  Sparkles,
  Trash2,
  UsersRound,
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
  businessStudioService,
  type BusinessSubmission,
  type BusinessSubmissionInput,
  type BusinessSubmissionType,
  type MyBusiness,
} from "@/services/business/businessStudioService";

export const Route = createFileRoute("/_authenticated/business")({ component: BusinessStudioPage });

const requestTypeLabels: Record<BusinessSubmissionType, string> = {
  campaign_proposal: "Campaign Proposal",
  offer_proposal: "Offer Proposal",
  sponsorship_placement: "Sponsorship / Placement Request",
  creative_brief: "Creative Brief",
};

const portalAreas = [
  { icon: Megaphone, title: "Campaigns", description: "Review current campaigns and prepare new campaign proposals.", status: "Active" },
  { icon: Sparkles, title: "Creative Studio", description: "Prepare creative briefs now; AI-assisted ad preparation comes later.", status: "Briefs active" },
  { icon: BriefcaseBusiness, title: "Offers & Sponsorships", description: "Prepare offer proposals and sponsorship or placement requests.", status: "Active" },
  { icon: BarChart3, title: "Reports", description: "View business-facing campaign results released by VYBE.", status: "Foundation ready" },
  { icon: FileText, title: "Partner Documents", description: "Access partner-visible agreements, requests, and campaign documents.", status: "Foundation ready" },
  { icon: CreditCard, title: "Billing", description: "Invoices, billing history, and payment information remain business-specific.", status: "Planned" },
  { icon: UsersRound, title: "Team", description: "Authorized business team members will remain separate from VYBE staff.", status: "Planned" },
  { icon: Settings, title: "Business Settings", description: "Manage public business details and portal preferences.", status: "Planned" },
];

function BusinessStudioPage() {
  const [business, setBusiness] = useState<MyBusiness | null>(null);
  const [campaigns, setCampaigns] = useState<Array<Record<string, string | null>>>([]);
  const [submissions, setSubmissions] = useState<BusinessSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BusinessSubmission | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const record = await businessStudioService.getMine();
      setBusiness(record);
      if (record) {
        const [campaignRows, submissionRows] = await Promise.all([
          businessStudioService.listCampaigns(record.id),
          businessStudioService.listSubmissions(record.id),
        ]);
        setCampaigns(campaignRows);
        setSubmissions(submissionRows);
      } else {
        setCampaigns([]);
        setSubmissions([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load Business Portal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  async function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await businessStudioService.apply({
        publicName: String(form.get("publicName")),
        slug: String(form.get("slug")),
        category: String(form.get("category")),
        description: String(form.get("description")),
        websiteUrl: String(form.get("websiteUrl")),
        contactName: String(form.get("contactName")),
        contactEmail: String(form.get("contactEmail")),
        serviceArea: String(form.get("serviceArea")),
        targetAudience: String(form.get("targetAudience")),
      });
      formElement.reset();
      toast.success("Business application submitted for VYBE review");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit application");
    }
  }

  async function saveSubmission(
    input: BusinessSubmissionInput,
    editingSubmission?: BusinessSubmission | null,
  ) {
    if (!business) return;
    try {
      if (editingSubmission) {
        await businessStudioService.updateDraft(business.id, editingSubmission.id, input);
        toast.success("Draft updated");
      } else {
        await businessStudioService.createSubmission(business.id, input);
        toast.success("Draft saved");
      }
      setEditing(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save draft");
    }
  }

  async function deleteSubmission(submission: BusinessSubmission) {
    if (!business || submission.status !== "draft") return;
    if (!window.confirm(`Delete draft "${submission.title}"?`)) return;
    try {
      await businessStudioService.deleteDraft(business.id, submission.id);
      if (editing?.id === submission.id) setEditing(null);
      toast.success("Draft deleted");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete draft");
    }
  }

  async function submitSubmission(submission: BusinessSubmission) {
    if (submission.status !== "draft") return;
    if (!window.confirm(`Submit "${submission.title}" to VYBE for review? You will no longer be able to edit this draft.`)) return;
    try {
      await businessStudioService.submitDraft(submission.id);
      if (editing?.id === submission.id) setEditing(null);
      toast.success("Submitted to VYBE for review");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit request");
    }
  }

  const verified = business?.verification_status === "verified";
  const openRequests = useMemo(
    () => submissions.filter((submission) => submission.status !== "declined" && submission.status !== "withdrawn").length,
    [submissions],
  );

  return (
    <RoleGuard allow={["business", "admin"]}>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl border bg-card/70 p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full">Professional workspace</Badge>
            <Badge variant="secondary" className="rounded-full">Business Studio</Badge>
          </div>
          <div className="mt-4 flex items-center gap-2 text-primary">
            <BriefcaseBusiness className="h-5 w-5" /> VYBE for Business
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Business Portal</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            Prepare business proposals and requests in your professional workspace. VYBE Operations
            separately handles internal review, approvals, scheduling, publishing, and platform administration.
          </p>
        </header>

        {!business && !loading ? <BusinessApplication onSubmit={apply} /> : null}

        {business ? (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              <Summary label="Application" value={business.verification_status} />
              <Summary label="Partnership" value={business.partner_status} />
              <Summary label="Campaigns" value={String(campaigns.length)} />
              <Summary label="Open Requests" value={String(openRequests)} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-5 w-5 text-primary" /> {business.public_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge>{business.verification_status}</Badge>
                  <Badge variant="outline">{business.category}</Badge>
                  {business.package_code ? <Badge variant="secondary">{business.package_code}</Badge> : null}
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {verified
                    ? "Your verified business can save drafts and submit professional proposals or requests to VYBE Operations for review."
                    : "VYBE is reviewing your business. Proposal and request tools unlock after business verification."}
                </p>
              </CardContent>
            </Card>

            <section aria-labelledby="business-portal-tools">
              <div className="mb-4">
                <h2 id="business-portal-tools" className="text-2xl font-semibold">Professional tools</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Business-owned submissions stay separate from VYBE's internal operational records and approval controls.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {portalAreas.map((area) => <PortalArea key={area.title} {...area} />)}
              </div>
            </section>

            {verified ? (
              <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]" aria-labelledby="business-requests">
                <SubmissionForm
                  key={editing?.id ?? "new"}
                  editing={editing}
                  onSave={saveSubmission}
                  onCancel={() => setEditing(null)}
                />
                <SubmissionList
                  submissions={submissions}
                  onEdit={setEditing}
                  onDelete={deleteSubmission}
                  onSubmit={submitSubmission}
                />
              </section>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="font-semibold">Proposal tools are locked until verification.</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    You can continue viewing your business status while VYBE completes its review. Pending,
                    rejected, or suspended businesses cannot create or submit professional requests.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle>Your campaigns</CardTitle></CardHeader>
              <CardContent>
                {campaigns.length ? campaigns.map((campaign) => (
                  <div key={campaign.id} className="mb-3 rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{campaign.name}</p>
                      <Badge variant="outline">{campaign.status?.replaceAll("_", " ")}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{campaign.objective}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No campaigns yet.</p>}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </RoleGuard>
  );
}

function SubmissionForm({
  editing,
  onSave,
  onCancel,
}: {
  editing: BusinessSubmission | null;
  onSave: (input: BusinessSubmissionInput, editing?: BusinessSubmission | null) => Promise<void>;
  onCancel: () => void;
}) {
  const payload = (editing?.request_payload ?? {}) as Record<string, unknown>;
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSave({
      requestType: String(form.get("requestType")) as BusinessSubmissionType,
      title: String(form.get("title")),
      summary: String(form.get("summary")),
      objective: String(form.get("objective")),
      targetAudience: String(form.get("targetAudience")),
      requestedTiming: String(form.get("requestedTiming")),
      budgetRange: String(form.get("budgetRange")),
      destinationUrl: String(form.get("destinationUrl")),
      additionalDetails: String(form.get("additionalDetails")),
    }, editing);
    if (!editing) event.currentTarget.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle id="business-requests">{editing ? "Edit Draft" : "New Proposal / Request"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="requestType">Request type</Label>
            <select
              id="requestType"
              name="requestType"
              defaultValue={editing?.request_type ?? "campaign_proposal"}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {Object.entries(requestTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <Field name="title" label="Proposal title" defaultValue={editing?.title ?? ""} required maxLength={180} />
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea id="summary" name="summary" defaultValue={editing?.summary ?? ""} required maxLength={4000} />
          </div>
          <Field name="objective" label="Goal / objective" defaultValue={String(payload.objective ?? "")} />
          <Field name="targetAudience" label="Target audience" defaultValue={String(payload.target_audience ?? "")} />
          <Field name="requestedTiming" label="Requested timing" placeholder="Example: October launch or 4-week campaign" defaultValue={String(payload.requested_timing ?? "")} />
          <Field name="budgetRange" label="Budget range" placeholder="Optional" defaultValue={String(payload.budget_range ?? "")} />
          <Field name="destinationUrl" label="Destination URL" type="url" placeholder="https://" defaultValue={String(payload.destination_url ?? "")} />
          <div className="space-y-2">
            <Label htmlFor="additionalDetails">Additional details</Label>
            <Textarea id="additionalDetails" name="additionalDetails" defaultValue={String(payload.additional_details ?? "")} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">{editing ? "Update Draft" : "Save Draft"}</Button>
            {editing ? <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button> : null}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Saving creates a private draft. Nothing is sent to VYBE Operations until you choose Submit for Review.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function SubmissionList({
  submissions,
  onEdit,
  onDelete,
  onSubmit,
}: {
  submissions: BusinessSubmission[];
  onEdit: (submission: BusinessSubmission) => void;
  onDelete: (submission: BusinessSubmission) => void;
  onSubmit: (submission: BusinessSubmission) => void;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>My Requests</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {submissions.length ? submissions.map((submission) => (
          <div key={submission.id} className="rounded-2xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{submission.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{requestTypeLabels[submission.request_type]}</p>
              </div>
              <Badge variant={submission.status === "draft" ? "secondary" : "outline"} className="capitalize">
                {submission.status.replaceAll("_", " ")}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{submission.summary}</p>
            {submission.business_response ? (
              <div className="mt-3 rounded-xl bg-muted p-3 text-sm">
                <span className="font-semibold">VYBE response: </span>{submission.business_response}
              </div>
            ) : null}
            {submission.status === "draft" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(submission)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button size="sm" onClick={() => onSubmit(submission)}>
                  <Send className="mr-2 h-4 w-4" /> Submit for Review
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(submission)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            ) : null}
          </div>
        )) : (
          <p className="text-sm text-muted-foreground">No proposals or requests yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function BusinessApplication({ onSubmit }: { onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <Card>
      <CardHeader><CardTitle>Business partnership application</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <Field name="publicName" label="Public business name" required />
          <Field
            name="slug"
            label="Business URL"
            placeholder="business-name"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            title="Lowercase letters, numbers, and hyphens only."
            required
            onInput={(event) => {
              event.currentTarget.value = event.currentTarget.value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            }}
          />
          <Field name="category" label="Business category" required />
          <Field name="contactName" label="Contact person" />
          <Field name="contactEmail" label="Private contact email" type="email" required />
          <Field name="websiteUrl" label="Website" type="url" placeholder="https://" />
          <Field name="serviceArea" label="Service area" />
          <Field name="targetAudience" label="Audience you serve" />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">About the business and member benefit</Label>
            <Textarea id="description" name="description" required />
          </div>
          <div className="sm:col-span-2"><Button>Submit for review</Button></div>
        </form>
      </CardContent>
    </Card>
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

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold capitalize">{value.replaceAll("_", " ")}</p>
      </CardContent>
    </Card>
  );
}

function PortalArea({
  icon: Icon,
  title,
  description,
  status,
}: {
  icon: typeof Clock3;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <Badge variant="outline" className="text-[10px]">{status}</Badge>
        </div>
        <p className="mt-3 font-semibold">{title}</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
