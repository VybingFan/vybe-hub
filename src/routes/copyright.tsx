import { FormEvent, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dmcaConfig, dmcaConfigReady } from "@/features/compliance/dmcaConfig";
import { copyrightComplianceService } from "@/services/compliance/copyrightComplianceService";

export const Route = createFileRoute("/copyright")({ component: CopyrightPage });

function CopyrightPage() {
  const [caseNumber, setCaseNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSubmitting(true);
    try {
      const number = await copyrightComplianceService.submitNotice({
        _claimant_name: String(form.get("name") || ""),
        _organization: String(form.get("organization") || ""),
        _email: String(form.get("email") || ""),
        _phone: String(form.get("phone") || ""),
        _address: String(form.get("address") || ""),
        _capacity: String(form.get("capacity") || ""),
        _work: String(form.get("work") || ""),
        _url: String(form.get("url") || ""),
        _material: String(form.get("material") || ""),
        _good_faith: form.get("goodFaith") === "on",
        _accuracy: form.get("accuracy") === "on",
        _signature: String(form.get("signature") || ""),
      });
      setCaseNumber(number);
      formElement.reset();
      toast.success("Copyright notice received.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Notice could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };
  return <main className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
    <header className="space-y-3"><div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /><span className="text-sm font-semibold uppercase tracking-[.18em]">Trust and safety</span></div><h1 className="text-3xl font-semibold">Copyright and DMCA Policy</h1><p className="max-w-3xl text-muted-foreground">VYBE respects copyright and responds to properly submitted infringement notices and counter-notices. Policy version {dmcaConfig.policyVersion}.</p></header>
    {!dmcaConfigReady ? <Card className="border-amber-500/40"><CardContent className="p-5"><p className="font-semibold">Deployment configuration incomplete</p><p className="mt-1 text-sm text-muted-foreground">The operator must add and register the final designated-agent information before relying on this page for public launch.</p></CardContent></Card> : null}
    {dmcaConfigReady?<section className="grid gap-4 sm:grid-cols-2"><Card><CardContent className="space-y-2 p-5"><h2 className="font-semibold">Designated agent</h2><p className="text-sm">{dmcaConfig.agentName}<br />{dmcaConfig.agentOrganization}<br />{dmcaConfig.agentAddress}<br />{dmcaConfig.agentPhone}<br />{dmcaConfig.agentEmail}</p></CardContent></Card><Card><CardContent className="space-y-2 p-5"><h2 className="font-semibold">Service provider</h2><p className="text-sm">{dmcaConfig.serviceProviderLegalName}<br />Alternate names: {dmcaConfig.alternateNames}</p></CardContent></Card></section>:null}
    <section className="space-y-3"><h2 className="text-2xl font-semibold">How VYBE responds</h2><p className="text-sm leading-6 text-muted-foreground">VYBE reviews notices for the information required by 17 U.S.C. §512. When appropriate, VYBE may disable access, notify the affected creator, accept a compliant counter-notice, forward it to the claimant, and restore material within the applicable statutory process unless VYBE receives notice of a qualifying court action. VYBE may preserve records and maintain access restrictions when required by law, court order, safety, fraud prevention or a separate contractual basis.</p></section>
    <section id="repeat-infringer" className="space-y-3"><h2 className="text-2xl font-semibold">Repeat Infringer Policy</h2><p className="text-sm leading-6 text-muted-foreground">VYBE may issue a copyright strike after documented review. Three counting strikes within a rolling 12-month period trigger suspension and termination review. VYBE may act sooner for deliberate, serious or repeated misconduct. A notice alone is not automatically a strike; reversed decisions stop counting. Appropriate circumstances, evidence, counter-notices, court actions and abuse of the process are considered.</p></section>
    <section id="creator-agreement" className="space-y-3"><h2 className="text-2xl font-semibold">Creator Upload and Rights Agreement</h2><div className="space-y-2 text-sm leading-6 text-muted-foreground"><p>By uploading or publishing content, a creator certifies that they own it or possess every permission needed for VYBE to host, reproduce, stream, display, distribute and, when separately enabled, sell it.</p><p>The creator must accurately disclose writers, producers, performers, samples, interpolations, beats, artwork, licenses and conflicting agreements; maintain evidence; cooperate with audits and disputes; and not upload content after access has been disabled. VYBE may request evidence, restrict access, pause sales, preserve records or terminate accounts under its policies.</p></div></section>
    <Card><CardContent className="p-5"><h2 className="text-xl font-semibold">Submit a copyright takedown notice</h2>{caseNumber ? <div className="mt-4 rounded-xl bg-primary/10 p-4"><p className="font-semibold">Notice received: {caseNumber}</p><p className="text-sm text-muted-foreground">Save this number. VYBE or its designated agent may request additional information.</p></div> : <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
      <Field label="Your full legal name" name="name" required /><Field label="Organization" name="organization" />
      <Field label="Email" name="email" type="email" required /><Field label="Phone" name="phone" />
      <div className="sm:col-span-2"><Label htmlFor="address">Physical mailing address</Label><Input id="address" name="address" required className="mt-2" /></div>
      <div className="sm:col-span-2"><Label htmlFor="capacity">Authority to act for the copyright owner</Label><Input id="capacity" name="capacity" className="mt-2" /></div>
      <div className="sm:col-span-2"><Label htmlFor="work">Identify the copyrighted work</Label><Textarea id="work" name="work" required className="mt-2" /></div>
      <div className="sm:col-span-2"><Label htmlFor="url">Exact VYBE URL of the material</Label><Input id="url" name="url" required className="mt-2" /></div>
      <div className="sm:col-span-2"><Label htmlFor="material">Information sufficient to locate and identify the material</Label><Textarea id="material" name="material" required className="mt-2" /></div>
      <Check name="goodFaith" label="I have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent or the law." />
      <Check name="accuracy" label="Under penalty of perjury, this notice is accurate and I am authorized to act for the owner of the exclusive right." />
      <div className="sm:col-span-2"><Label htmlFor="signature">Electronic signature (type full legal name)</Label><Input id="signature" name="signature" required className="mt-2" /></div>
      <Button disabled={submitting} className="sm:col-span-2">{submitting ? "Submitting..." : "Submit copyright notice"}</Button>
    </form>}</CardContent></Card>
    <p className="text-xs leading-5 text-muted-foreground">Misrepresentations in notices or counter-notices may create liability under 17 U.S.C. §512(f). This page describes VYBE operations and is not legal advice. Creators can review affected cases and submit eligible counter-notices from Creator Studio → Copyright Center.</p>
    <Button asChild variant="outline"><Link to="/">Return to VYBE</Link></Button>
  </main>;
}

function Field({ label, name, type="text", required=false }: { label:string; name:string; type?:string; required?:boolean }) { return <div><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} required={required} className="mt-2" /></div>; }
function Check({ name, label }: { name:string; label:string }) { return <Label className="flex items-start gap-3 rounded-xl border p-3 text-sm font-normal"><Checkbox name={name} required className="mt-0.5" /><span>{label}</span></Label>; }
