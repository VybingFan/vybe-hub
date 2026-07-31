import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { BarChart3, BriefcaseBusiness, Clock3, FileText, Megaphone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { businessStudioService, type MyBusiness } from "@/services/business/businessStudioService";

export const Route = createFileRoute("/_authenticated/business")({
  component: BusinessStudioPage,
});

function BusinessStudioPage() {
  const [business, setBusiness] = useState<MyBusiness | null>(null);
  const [campaigns, setCampaigns] = useState<Array<Record<string, string | null>>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const record = await businessStudioService.getMine();
      setBusiness(record);
      setCampaigns(record ? await businessStudioService.listCampaigns(record.id) : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load Business Studio");
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

  return (
    <RoleGuard allow={["business", "admin"]}>
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <div className="flex items-center gap-2 text-primary">
            <BriefcaseBusiness className="h-5 w-5" /> Business account
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Business Studio
          </h1>
          <p className="mt-2 max-w-3xl leading-7 text-muted-foreground">
            Build useful offers and campaigns for VYBE communities. Your work remains private until
            it is submitted, reviewed, approved, and scheduled.
          </p>
        </header>

        {!business && !loading ? <BusinessApplication onSubmit={apply} /> : null}
        {business ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Summary label="Application" value={business.verification_status} />
              <Summary label="Partnership" value={business.partner_status} />
              <Summary label="Campaigns" value={String(campaigns.length)} />
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
                  {business.package_code ? (
                    <Badge variant="secondary">{business.package_code}</Badge>
                  ) : null}
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {business.verification_status === "pending"
                    ? "VYBE is reviewing your business. Campaign creation unlocks after verification and package approval."
                    : "Your business is verified. Campaign-building tools will open in the next Business Studio release."}
                </p>
              </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Feature icon={Sparkles} title="AI campaign assistant" status="Next release" />
              <Feature icon={Megaphone} title="Campaign builder" status="Next release" />
              <Feature icon={BarChart3} title="Business analytics" status="Foundation ready" />
              <Feature icon={FileText} title="Partner documents" status="Foundation ready" />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Your campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.length ? (
                  campaigns.map((campaign) => (
                    <div key={campaign.id} className="mb-3 rounded-2xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{campaign.name}</p>
                        <Badge variant="outline">{campaign.status?.replaceAll("_", " ")}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{campaign.objective}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No campaigns yet.</p>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </RoleGuard>
  );
}

function BusinessApplication({
  onSubmit,
}: {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business partnership application</CardTitle>
      </CardHeader>
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
          <div className="sm:col-span-2">
            <Button>Submit for review</Button>
          </div>
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
function Feature({
  icon: Icon,
  title,
  status,
}: {
  icon: typeof Clock3;
  title: string;
  status: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <Icon className="h-5 w-5 text-primary" />
        <p className="mt-3 font-semibold">{title}</p>
        <p className="mt-2 text-xs text-muted-foreground">{status}</p>
      </CardContent>
    </Card>
  );
}
