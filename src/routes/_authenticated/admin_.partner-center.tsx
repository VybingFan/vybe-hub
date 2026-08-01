import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileDown,
  FileClock,
  FilePlus2,
  FolderKanban,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  businessAdminService,
  type BusinessRecord,
  type CampaignRecord,
  type PartnerDocumentRecord,
} from "@/services/business/businessAdminService";

export const Route = createFileRoute("/_authenticated/admin_/partner-center")({
  component: PartnerCenterRoute,
});

const REQUIRED_MATERIALS = [
  ["application", "Partner application"],
  ["qualification_review", "Qualification review"],
  ["preview_terms", "Preview terms"],
  ["annual_agreement", "Annual partner agreement"],
  ["campaign_brief", "Campaign brief"],
  ["asset_checklist", "Asset checklist"],
  ["tracking_plan", "Tracking plan"],
  ["campaign_report", "Campaign report"],
  ["case_study_approval", "Case-study approval"],
  ["roadmap_status", "Roadmap and feature-status sheet"],
  ["brand_guidelines", "VYBE brand guidelines"],
] as const;

const DOCUMENT_STATUSES: PartnerDocumentRecord["status"][] = [
  "draft",
  "requested",
  "received",
  "approved",
  "signed",
  "expired",
  "archived",
];

const PACKAGE_OPTIONS = [
  ["", "No package · Prospect"],
  ["founding_preview", "Founding Business Preview · Free / 60 days"],
  ["founding_partner", "Founding Business Partner · $499 / year"],
  ["custom_campaign", "Custom Campaign or Sponsorship"],
] as const;

const PARTNER_MATERIALS = [
  {
    title: "Founding Partner One-Sheet",
    description: "Shareable overview of the free preview and $499 annual package.",
    href: "/partner-materials/01-vybe-founding-partner-one-sheet.pdf",
  },
  {
    title: "Application & Qualification",
    description: "Business intake and internal qualification checklist.",
    href: "/partner-materials/02-partner-application-and-qualification.pdf",
  },
  {
    title: "Preview Terms Template",
    description: "Working terms for the free 60-day founding preview.",
    href: "/partner-materials/03-founding-preview-terms-template.pdf",
  },
  {
    title: "Annual Agreement Template",
    description: "Working agreement for the $499 annual founding package.",
    href: "/partner-materials/04-founding-annual-agreement-template.pdf",
  },
  {
    title: "Campaign Brief",
    description: "Objectives, audience, message, boundaries, and approval gates.",
    href: "/partner-materials/05-campaign-brief-template.pdf",
  },
  {
    title: "Asset Checklist",
    description: "Required business, offer, creative, rights, and destination assets.",
    href: "/partner-materials/06-campaign-asset-checklist.pdf",
  },
  {
    title: "Tracking Plan",
    description: "Valid measures, event definitions, and reconciliation rules.",
    href: "/partner-materials/07-campaign-tracking-plan.pdf",
  },
  {
    title: "Campaign Report",
    description: "Verified totals, context, limitations, and recommended next action.",
    href: "/partner-materials/08-campaign-report-template.pdf",
  },
  {
    title: "Case Study Approval",
    description: "Permission controls for names, logos, quotes, metrics, and channels.",
    href: "/partner-materials/09-case-study-approval.pdf",
  },
  {
    title: "Roadmap & Feature Status",
    description: "Available, assisted, and under-construction capabilities.",
    href: "/partner-materials/10-partner-roadmap-and-feature-status.pdf",
  },
  {
    title: "Partner Brand Use Guide",
    description: "Positioning, visual direction, disclosure, and approval rules.",
    href: "/partner-materials/11-vybe-partner-brand-use-guide.pdf",
  },
] as const;

function PartnerCenterRoute() {
  return (
    <AdminPermissionGuard anyOf={["admin.business.read"]}>
      <PartnerCenter />
    </AdminPermissionGuard>
  );
}

function PartnerCenter() {
  const [businesses, setBusinesses] = useState<BusinessRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [documents, setDocuments] = useState<PartnerDocumentRecord[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<
    "" | "founding_preview" | "founding_partner" | "custom_campaign"
  >("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextBusinesses, nextCampaigns, nextDocuments] = await Promise.all([
        businessAdminService.listBusinesses(),
        businessAdminService.listCampaigns(),
        businessAdminService.listPartnerDocuments(),
      ]);
      setBusinesses(nextBusinesses);
      setCampaigns(nextCampaigns);
      setDocuments(nextDocuments);
      setSelectedBusinessId((current) => current || nextBusinesses[0]?.id || "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load the Partner Center");
    }
  }, []);

  useEffect(() => void load(), [load]);

  useEffect(() => {
    const business = businesses.find((item) => item.id === selectedBusinessId);
    setSelectedPackage(
      (business?.package_code as
        "" | "founding_preview" | "founding_partner" | "custom_campaign") || "",
    );
  }, [businesses, selectedBusinessId]);

  const selectedBusiness = businesses.find((item) => item.id === selectedBusinessId);
  const selectedDocuments = useMemo(
    () => documents.filter((item) => item.business_id === selectedBusinessId),
    [documents, selectedBusinessId],
  );
  const selectedCampaigns = campaigns.filter((item) => item.business_id === selectedBusinessId);
  const completeTypes = new Set(
    selectedDocuments
      .filter((item) => ["approved", "signed"].includes(item.status))
      .map((item) => item.document_type),
  );
  const expiring = documents.filter((item) => {
    if (!item.expires_at) return false;
    const days = (new Date(item.expires_at).getTime() - Date.now()) / 86_400_000;
    return days >= 0 && days <= 30;
  }).length;
  const needsReview = documents.filter((item) =>
    ["requested", "received", "expired"].includes(item.status),
  ).length;

  async function createDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    try {
      await businessAdminService.createPartnerDocument({
        businessId: String(form.get("businessId")),
        campaignId: String(form.get("campaignId") || ""),
        documentType: String(form.get("documentType")),
        title: String(form.get("title")),
        externalUrl: String(form.get("externalUrl") || ""),
        versionLabel: String(form.get("versionLabel") || ""),
        visibility: String(form.get("visibility")) as "internal" | "partner",
        status: String(form.get("status")) as PartnerDocumentRecord["status"],
        effectiveAt: String(form.get("effectiveAt") || ""),
        expiresAt: String(form.get("expiresAt") || ""),
      });
      formElement.reset();
      toast.success("Partner document record created");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create document record");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    document: PartnerDocumentRecord,
    status: PartnerDocumentRecord["status"],
  ) {
    try {
      await businessAdminService.updatePartnerDocument(document, { status });
      toast.success(`Document marked ${status}`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update document");
    }
  }

  async function assignPackage() {
    if (!selectedBusiness) return;
    setSaving(true);
    try {
      await businessAdminService.assignBusinessPackage(selectedBusiness, selectedPackage);
      toast.success(selectedPackage ? "Business package assigned" : "Business package removed");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update business package");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Back Office
          </Link>
        </Button>
        <div className="mt-3 flex items-center gap-2 text-primary">
          <FolderKanban className="h-5 w-5" /> Controlled partner records
        </div>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Partner Center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Keep every partner-facing promise, agreement, campaign brief, asset request, tracking
              plan, and report attached to the correct business.
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Document records" value={documents.length} />
        <Metric label="Needs attention" value={needsReview} />
        <Metric label="Expires in 30 days" value={expiring} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partner workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="partner-business">Business partner</Label>
          <select
            id="partner-business"
            className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={selectedBusinessId}
            onChange={(event) => {
              setSelectedBusinessId(event.target.value);
            }}
          >
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.public_name} · {business.partner_status}
              </option>
            ))}
          </select>
          {selectedBusiness ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>{selectedBusiness.verification_status}</Badge>
                <Badge variant="secondary">{selectedBusiness.partner_status}</Badge>
                <Badge variant="outline">{selectedBusiness.package_code || "No package"}</Badge>
                {selectedBusiness.package_ends_at ? (
                  <Badge variant="outline">
                    Ends {new Date(selectedBusiness.package_ends_at).toLocaleDateString()}
                  </Badge>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  aria-label="Partner package"
                  className="h-10 flex-1 rounded-md border bg-background px-3 text-sm"
                  value={selectedPackage}
                  onChange={(event) =>
                    setSelectedPackage(
                      event.target.value as
                        "" | "founding_preview" | "founding_partner" | "custom_campaign",
                    )
                  }
                >
                  {PACKAGE_OPTIONS.map(([value, label]) => (
                    <option key={value || "none"} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving || selectedBusiness.verification_status !== "verified"}
                  onClick={() => void assignPackage()}
                >
                  Apply package
                </Button>
              </div>
              {selectedBusiness.verification_status !== "verified" ? (
                <p className="text-xs text-amber-600">
                  Verify this business before assigning a package.
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {selectedBusiness ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
          <Card>
            <CardHeader>
              <CardTitle>Required partner file</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {REQUIRED_MATERIALS.map(([code, label]) => {
                const records = selectedDocuments.filter((item) => item.document_type === code);
                const complete = completeTypes.has(code);
                return (
                  <div
                    key={code}
                    className="flex items-center justify-between gap-3 rounded-xl border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {complete ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <FileClock className="h-4 w-4 text-amber-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          {records.length ? `${records.length} record(s)` : "Not on file"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={complete ? "default" : "outline"}>
                      {complete ? "Complete" : "Needed"}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FilePlus2 className="h-5 w-5" /> Add document record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={createDocument}>
                <input type="hidden" name="businessId" value={selectedBusinessId} />
                <Field label="Document type">
                  <select
                    name="documentType"
                    required
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    {REQUIRED_MATERIALS.map(([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ))}
                    <option value="invoice">Invoice</option>
                    <option value="payment_record">Payment record</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Campaign">
                  <select
                    name="campaignId"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">Business-level document</option>
                    {selectedCampaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Title">
                  <Input name="title" required placeholder="Document title" />
                </Field>
                <Field label="Version">
                  <Input name="versionLabel" placeholder="Example: v1.0" />
                </Field>
                <Field label="Status">
                  <select
                    name="status"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    defaultValue="requested"
                  >
                    {DOCUMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Visibility">
                  <select
                    name="visibility"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="internal">Internal only</option>
                    <option value="partner">Partner shareable</option>
                  </select>
                </Field>
                <Field label="Effective date">
                  <Input name="effectiveAt" type="date" />
                </Field>
                <Field label="Expiration date">
                  <Input name="expiresAt" type="date" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Secure external document URL">
                    <Input name="externalUrl" type="url" placeholder="https://…" />
                  </Field>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use a controlled link. Native VYBE file storage will be connected separately.
                  </p>
                </div>
                <Button className="sm:col-span-2" disabled={saving}>
                  {saving ? "Saving…" : "Create document record"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-7 text-sm text-muted-foreground">
            Create a business partner record before adding partner documents.
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Partner Materials Library</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Download approved working materials, then record the completed or shared version against
            the correct business.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PARTNER_MATERIALS.map((material) => (
            <Card key={material.href}>
              <CardContent className="flex h-full flex-col p-5">
                <FileDown className="h-5 w-5 text-primary" />
                <p className="mt-3 font-semibold">{material.title}</p>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{material.description}</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <a href={material.href} download>
                    <FileDown className="mr-2 h-4 w-4" /> Download PDF
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Preview terms and agreement files are business templates and require final legal review
          before external use.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Document register</h2>
        {!selectedDocuments.length ? (
          <Card>
            <CardContent className="p-7 text-sm text-muted-foreground">
              No documents are recorded for this business yet.
            </CardContent>
          </Card>
        ) : null}
        {selectedDocuments.map((document) => (
          <Card key={document.id}>
            <CardContent className="flex flex-col justify-between gap-4 p-5 lg:flex-row">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{document.title}</p>
                  <Badge variant="outline">{document.document_type.replaceAll("_", " ")}</Badge>
                  <Badge>{document.status}</Badge>
                  <Badge variant="secondary">{document.visibility}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {document.version_label ? `${document.version_label} · ` : ""}
                  Updated {new Date(document.updated_at).toLocaleString()}
                  {document.expires_at
                    ? ` · Expires ${new Date(document.expires_at).toLocaleDateString()}`
                    : ""}
                </p>
                {document.business_campaigns?.name ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Campaign: {document.business_campaigns.name}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-start gap-2">
                {document.external_url ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={document.external_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> Open
                    </a>
                  </Button>
                ) : null}
                {document.status === "received" ? (
                  <Button size="sm" onClick={() => void updateStatus(document, "approved")}>
                    Approve
                  </Button>
                ) : null}
                {document.status === "requested" ? (
                  <Button size="sm" onClick={() => void updateStatus(document, "received")}>
                    Mark received
                  </Button>
                ) : null}
                {document.status === "approved" ? (
                  <Button size="sm" onClick={() => void updateStatus(document, "signed")}>
                    Mark signed
                  </Button>
                ) : null}
                {!["archived", "expired"].includes(document.status) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void updateStatus(document, "archived")}
                  >
                    Archive
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
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
