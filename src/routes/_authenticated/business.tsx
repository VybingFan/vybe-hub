import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { BarChart3, BriefcaseBusiness, Clock3, CreditCard, FileText, Megaphone, Settings, Sparkles, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { businessStudioService, type MyBusiness } from "@/services/business/businessStudioService";

export const Route = createFileRoute("/_authenticated/business")({ component: BusinessStudioPage });

const portalAreas = [
  { icon: Megaphone, title: "Campaigns", description: "Review current VYBE campaigns and prepare future campaign proposals.", status: "Current reads" },
  { icon: Sparkles, title: "Creative Studio", description: "AI-assisted ad preparation and campaign creative tools will live here.", status: "Coming next" },
  { icon: BriefcaseBusiness, title: "Offers & Sponsorships", description: "Prepare offers, sponsorship ideas, and placement requests for VYBE review.", status: "Coming next" },
  { icon: BarChart3, title: "Reports", description: "View business-facing campaign results released by VYBE.", status: "Foundation ready" },
  { icon: FileText, title: "Partner Documents", description: "Access partner-visible agreements, requests, and campaign documents.", status: "Foundation ready" },
  { icon: CreditCard, title: "Billing", description: "Invoices, billing history, and payment information will remain business-specific.", status: "Planned" },
  { icon: UsersRound, title: "Team", description: "Authorized business team members will be managed separately from VYBE staff.", status: "Planned" },
  { icon: Settings, title: "Business Settings", description: "Manage your public business details and portal preferences.", status: "Planned" },
];

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
      toast.error(error instanceof Error ? error.message : "Could not load Business Portal");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => void load(), [load]);

  async function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await businessStudioService.apply({
        publicName: String(form.get("publicName")), slug: String(form.get("slug")), category: String(form.get("category")),
        description: String(form.get("description")), websiteUrl: String(form.get("websiteUrl")), contactName: String(form.get("contactName")),
        contactEmail: String(form.get("contactEmail")), serviceArea: String(form.get("serviceArea")), targetAudience: String(form.get("targetAudience")),
      });
      formElement.reset();
      toast.success("Business application submitted for VYBE review");
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not submit application"); }
  }

  return <RoleGuard allow={["business", "admin"]}>
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="rounded-3xl border bg-card/70 p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="rounded-full">Professional workspace</Badge><Badge variant="secondary" className="rounded-full">Business Studio</Badge></div>
        <div className="mt-4 flex items-center gap-2 text-primary"><BriefcaseBusiness className="h-5 w-5" /> VYBE for Business</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Business Portal</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">A dedicated professional workspace for businesses, advertisers, sponsors, and partners. Prepare opportunities for VYBE communities while VYBE Operations handles internal review, approval, scheduling, and platform administration separately.</p>
      </header>
      {!business && !loading ? <BusinessApplication onSubmit={apply} /> : null}
      {business ? <>
        <div className="grid gap-4 sm:grid-cols-3"><Summary label="Application" value={business.verification_status} /><Summary label="Partnership" value={business.partner_status} /><Summary label="Campaigns" value={String(campaigns.length)} /></div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><BriefcaseBusiness className="h-5 w-5 text-primary" /> {business.public_name}</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2"><Badge>{business.verification_status}</Badge><Badge variant="outline">{business.category}</Badge>{business.package_code ? <Badge variant="secondary">{business.package_code}</Badge> : null}</div><p className="mt-4 text-sm leading-6 text-muted-foreground">{business.verification_status === "pending" ? "VYBE is reviewing your business. Professional campaign proposal tools will unlock in a later Business Portal release after the required approval boundary is in place." : "Your business is verified. This portal will expand with business-owned proposal, creative, reporting, billing, and team tools without exposing internal VYBE Operations."}</p></CardContent></Card>
        <section aria-labelledby="business-portal-tools"><div className="mb-4"><h2 id="business-portal-tools" className="text-2xl font-semibold">Professional tools</h2><p className="mt-1 text-sm text-muted-foreground">Active areas are usable now. Upcoming areas are shown so the professional portal has a clear home before write permissions and workflows are added.</p></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{portalAreas.map(area => <PortalArea key={area.title} {...area} />)}</div></section>
        <Card><CardHeader><CardTitle>Your campaigns</CardTitle></CardHeader><CardContent>{campaigns.length ? campaigns.map(campaign => <div key={campaign.id} className="mb-3 rounded-2xl border p-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{campaign.name}</p><Badge variant="outline">{campaign.status?.replaceAll("_", " ")}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{campaign.objective}</p></div>) : <p className="text-sm text-muted-foreground">No campaigns yet.</p>}</CardContent></Card>
      </> : null}
    </div>
  </RoleGuard>;
}

function BusinessApplication({ onSubmit }: { onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <Card><CardHeader><CardTitle>Business partnership application</CardTitle></CardHeader><CardContent><form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
    <Field name="publicName" label="Public business name" required />
    <Field name="slug" label="Business URL" placeholder="business-name" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" title="Lowercase letters, numbers, and hyphens only." required onInput={(event) => { event.currentTarget.value = event.currentTarget.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }} />
    <Field name="category" label="Business category" required /><Field name="contactName" label="Contact person" /><Field name="contactEmail" label="Private contact email" type="email" required /><Field name="websiteUrl" label="Website" type="url" placeholder="https://" /><Field name="serviceArea" label="Service area" /><Field name="targetAudience" label="Audience you serve" />
    <div className="space-y-2 sm:col-span-2"><Label htmlFor="description">About the business and member benefit</Label><Textarea id="description" name="description" required /></div><div className="sm:col-span-2"><Button>Submit for review</Button></div>
  </form></CardContent></Card>;
}
function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) { return <div className="space-y-2"><Label htmlFor={props.name}>{label}</Label><Input id={props.name} {...props} /></div>; }
function Summary({ label, value }: { label: string; value: string }) { return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold capitalize">{value.replaceAll("_", " ")}</p></CardContent></Card>; }
function PortalArea({ icon: Icon, title, description, status }: { icon: typeof Clock3; title: string; description: string; status: string }) { return <Card className="h-full"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><Icon className="h-5 w-5 text-primary" /><Badge variant="outline" className="text-[10px]">{status}</Badge></div><p className="mt-3 font-semibold">{title}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p></CardContent></Card>; }
