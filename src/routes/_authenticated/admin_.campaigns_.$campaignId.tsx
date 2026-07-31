import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BarChart3, CalendarClock, FileText, Megaphone, Tag } from "lucide-react";
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
  type CampaignWorkspace,
} from "@/services/business/businessAdminService";

export const Route = createFileRoute("/_authenticated/admin_/campaigns_/$campaignId")({
  component: CampaignOperationsPage,
});

function CampaignOperationsPage() {
  const { campaignId } = Route.useParams();
  const [workspace, setWorkspace] = useState<CampaignWorkspace | null>(null);

  const load = useCallback(async () => {
    try {
      setWorkspace(await businessAdminService.getCampaignWorkspace(campaignId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load campaign");
    }
  }, [campaignId]);

  useEffect(() => void load(), [load]);

  async function submit(
    event: React.FormEvent<HTMLFormElement>,
    action: (form: FormData) => Promise<void>,
    message: string,
  ) {
    event.preventDefault();
    const formElement = event.currentTarget;
    try {
      await action(new FormData(formElement));
      formElement.reset();
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save campaign record");
    }
  }

  if (!workspace) return null;
  const { campaign } = workspace;

  return (
    <RoleGuard allow={["admin"]}>
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <Button asChild variant="ghost" className="-ml-3 mb-4">
            <Link to="/admin/businesses">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to business operations
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{campaign.status.replaceAll("_", " ")}</Badge>
            <Badge variant="outline">{campaign.business_profiles?.public_name}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{campaign.name}</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">{campaign.objective}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "submitted",
              "under_review",
              "approved",
              "scheduled",
              "active",
              "paused",
              "completed",
            ].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={campaign.status === status ? "default" : "outline"}
                onClick={async () => {
                  await businessAdminService.setCampaignStatus(campaignId, status);
                  await load();
                }}
              >
                {status.replaceAll("_", " ")}
              </Button>
            ))}
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Metric label="Valid impressions" value={workspace.events.ad_impression ?? 0} />
          <Metric label="Valid clicks" value={workspace.events.ad_click ?? 0} />
          <Metric label="Conversions" value={workspace.events.campaign_conversion ?? 0} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <EditorCard icon={Tag} title="Member offer">
            <form
              className="space-y-3"
              onSubmit={(event) =>
                submit(
                  event,
                  (form) =>
                    businessAdminService.createOffer({
                      campaignId,
                      businessId: campaign.business_id,
                      title: String(form.get("title")),
                      description: String(form.get("description")),
                      offerCode: String(form.get("offerCode")),
                    }),
                  "Draft member offer created",
                )
              }
            >
              <Field name="title" label="Offer title" required />
              <Field name="offerCode" label="Offer code" />
              <TextField name="description" label="Offer description" />
              <Button>Create offer</Button>
            </form>
            <ApprovalList
              items={workspace.offers}
              label={(item) => `${item.title} · ${item.status}`}
              onApprove={async (item) => {
                await businessAdminService.approveOffer(item.id);
                await load();
              }}
            />
          </EditorCard>

          <EditorCard icon={Megaphone} title="Advertisement creative">
            <form
              className="space-y-3"
              onSubmit={(event) =>
                submit(
                  event,
                  (form) =>
                    businessAdminService.createCreative({
                      campaignId,
                      format: String(form.get("format")),
                      headline: String(form.get("headline")),
                      body: String(form.get("body")),
                      callToAction: String(form.get("callToAction")),
                      destinationUrl: String(form.get("destinationUrl")),
                    }),
                  "Draft creative created",
                )
              }
            >
              <SelectField
                name="format"
                label="Format"
                options={[
                  "partner_card",
                  "spotlight",
                  "member_offer",
                  "sponsored_poll",
                  "sponsored_trivia",
                ]}
              />
              <Field name="headline" label="Headline" required />
              <TextField name="body" label="Body copy" />
              <Field name="callToAction" label="Call to action" />
              <Field name="destinationUrl" label="Destination URL" type="url" />
              <Button>Create creative</Button>
            </form>
            <ApprovalList
              items={workspace.creatives}
              label={(item) =>
                `${item.headline} · ${item.format.replaceAll("_", " ")} · ${item.status}`
              }
              onApprove={async (item) => {
                await businessAdminService.approveCreative(item.id);
                await load();
              }}
            />
          </EditorCard>

          <EditorCard icon={FileText} title="Partner documents">
            <form
              className="space-y-3"
              onSubmit={(event) =>
                submit(
                  event,
                  (form) =>
                    businessAdminService.createDocument({
                      campaignId,
                      businessId: campaign.business_id,
                      documentType: String(form.get("documentType")),
                      title: String(form.get("title")),
                      externalUrl: String(form.get("externalUrl")),
                    }),
                  "Document record created",
                )
              }
            >
              <SelectField
                name="documentType"
                label="Document type"
                options={[
                  "campaign_brief",
                  "asset_checklist",
                  "tracking_plan",
                  "campaign_report",
                  "case_study_approval",
                ]}
              />
              <Field name="title" label="Document title" required />
              <Field name="externalUrl" label="Secure document URL" type="url" />
              <Button>Create record</Button>
            </form>
            <RecordList
              items={workspace.documents.map(
                (item) =>
                  `${item.title} · ${item.document_type.replaceAll("_", " ")} · ${item.status}`,
              )}
            />
          </EditorCard>

          <EditorCard icon={CalendarClock} title="Placement scheduler">
            <form
              className="space-y-3"
              onSubmit={(event) =>
                submit(
                  event,
                  (form) =>
                    businessAdminService.createPlacement({
                      campaignId,
                      creativeId: String(form.get("creativeId")),
                      surface: String(form.get("surface")),
                      slotKey: String(form.get("slotKey")),
                      startsAt: String(form.get("startsAt")),
                      endsAt: String(form.get("endsAt")),
                    }),
                  "Draft placement created",
                )
              }
            >
              <div className="space-y-2">
                <Label htmlFor="creativeId">Creative</Label>
                <select
                  id="creativeId"
                  name="creativeId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {workspace.creatives.map((creative) => (
                    <option key={creative.id} value={creative.id}>
                      {creative.headline} ({creative.status})
                    </option>
                  ))}
                </select>
              </div>
              <SelectField
                name="surface"
                label="VYBE surface"
                options={[
                  "home",
                  "explore",
                  "play",
                  "trivia_result",
                  "poll_result",
                  "business_directory",
                ]}
              />
              <Field
                name="slotKey"
                label="Placement slot"
                placeholder="founding-partner-1"
                required
              />
              <Field name="startsAt" label="Starts" type="datetime-local" required />
              <Field name="endsAt" label="Ends" type="datetime-local" required />
              <Button disabled={workspace.creatives.length === 0}>Create draft placement</Button>
            </form>
            <ApprovalList
              items={workspace.placements}
              label={(item) =>
                `${item.surface} / ${item.slot_key} · ${new Date(item.starts_at).toLocaleDateString()} · ${item.status}`
              }
              onApprove={async (item) => {
                await businessAdminService.approvePlacement(item.id);
                await load();
              }}
            />
          </EditorCard>

          <EditorCard icon={BarChart3} title="Release readiness">
            <RecordList
              items={[
                `Business verified: ${campaign.business_profiles?.verification_status === "verified" ? "yes" : "no"}`,
                `Offer attached: ${workspace.offers.length > 0 ? "yes" : "no"}`,
                `Creative created: ${workspace.creatives.length > 0 ? "yes" : "no"}`,
                `Placement scheduled: ${workspace.placements.length > 0 ? "yes" : "no"}`,
                `Supporting documents: ${workspace.documents.length}`,
              ]}
            />
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Public release remains blocked until the business, campaign, creative, and placement
              are approved and the placement is inside its scheduled window.
            </p>
          </EditorCard>
        </div>
      </div>
    </RoleGuard>
  );
}

function EditorCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Tag;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
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
function TextField({ label, name }: { label: string; name: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} required />
    </div>
  );
}
function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
function RecordList({ items }: { items: string[] }) {
  return items.length ? (
    <div className="mt-5 space-y-2">
      {items.map((item) => (
        <div key={item} className="rounded-xl border p-3 text-sm">
          {item}
        </div>
      ))}
    </div>
  ) : null;
}
function ApprovalList<T extends { id: string; status: string }>({
  items,
  label,
  onApprove,
}: {
  items: T[];
  label: (item: T) => string;
  onApprove: (item: T) => Promise<void>;
}) {
  return items.length ? (
    <div className="mt-5 space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"
        >
          <span>{label(item)}</span>
          {item.status !== "approved" ? (
            <Button size="sm" variant="outline" onClick={() => void onApprove(item)}>
              Approve
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  ) : null;
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
