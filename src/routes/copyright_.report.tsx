import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/copyright_/report")({
  component: CopyrightReportPage,
});

const initial = {
  reporterName: "",
  reporterEmail: "",
  rightsOwnerName: "",
  contentUrl: "",
  originalWorkDescription: "",
  signature: "",
};

function CopyrightReportPage() {
  const [values, setValues] = useState(initial);
  const [goodFaith, setGoodFaith] = useState(false);
  const [accurate, setAccurate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const update = (key: keyof typeof values, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!goodFaith || !accurate) {
      toast.error("Both legal statements must be confirmed.");
      return;
    }
    try {
      const hostname = new URL(values.contentUrl).hostname.toLowerCase();
      if (hostname !== "vybewithvybe.com" && !hostname.endsWith(".vybewithvybe.com")) {
        toast.error("Enter the vybewithvybe.com URL containing the reported material.");
        return;
      }
    } catch {
      toast.error("Enter a valid VYBE content URL.");
      return;
    }
    setSubmitting(true);
    try {
      const reportId = crypto.randomUUID();
      const { error } = await supabase.from("copyright_reports").insert({
        id: reportId,
        reporter_name: values.reporterName.trim(),
        reporter_email: values.reporterEmail.trim(),
        rights_owner_name: values.rightsOwnerName.trim(),
        content_url: values.contentUrl.trim(),
        original_work_description: values.originalWorkDescription.trim(),
        signature: values.signature.trim(),
        good_faith_statement: true,
        accuracy_statement: true,
      });
      if (error) throw error;
      setConfirmation(reportId);
      setValues(initial);
      setGoodFaith(false);
      setAccurate(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The report could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary/12 p-3 text-primary">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Copyright report
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">
              Report content you believe infringes your rights.
            </h1>
            <p className="mt-4 leading-7 text-muted-foreground">
              This form creates a review record. It does not replace legal advice or establish that
              infringement occurred. Review the{" "}
              <Link to="/copyright" className="text-foreground underline">
                VYBE Copyright Policy
              </Link>{" "}
              before submitting.
            </p>
          </div>
        </div>

        {confirmation ? (
          <div className="mt-10 rounded-3xl border border-primary/30 bg-primary/5 p-7">
            <h2 className="text-xl font-semibold">Report received</h2>
            <p className="mt-3 text-muted-foreground">
              Keep this reference number:{" "}
              <span className="font-mono text-foreground">{confirmation}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              VYBE will preserve the report for review. Submission does not guarantee removal.
            </p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mt-10 space-y-6 rounded-3xl border border-border/70 bg-card p-6 sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Your legal name">
                <Input
                  required
                  minLength={2}
                  maxLength={160}
                  value={values.reporterName}
                  onChange={(event) => update("reporterName", event.target.value)}
                />
              </Field>
              <Field label="Your email">
                <Input
                  required
                  type="email"
                  maxLength={320}
                  value={values.reporterEmail}
                  onChange={(event) => update("reporterEmail", event.target.value)}
                />
              </Field>
              <Field label="Copyright owner">
                <Input
                  required
                  minLength={2}
                  maxLength={200}
                  value={values.rightsOwnerName}
                  onChange={(event) => update("rightsOwnerName", event.target.value)}
                />
              </Field>
              <Field label="VYBE URL containing the material">
                <Input
                  required
                  type="url"
                  maxLength={2000}
                  placeholder="https://vybewithvybe.com/..."
                  value={values.contentUrl}
                  onChange={(event) => update("contentUrl", event.target.value)}
                />
              </Field>
            </div>
            <Field label="Describe the original work and why you believe this use is unauthorized">
              <Textarea
                required
                minLength={20}
                maxLength={5000}
                rows={7}
                value={values.originalWorkDescription}
                onChange={(event) => update("originalWorkDescription", event.target.value)}
              />
            </Field>
            <Field label="Electronic signature">
              <Input
                required
                minLength={2}
                maxLength={200}
                placeholder="Type your full legal name"
                value={values.signature}
                onChange={(event) => update("signature", event.target.value)}
              />
            </Field>
            <LegalCheck
              id="good-faith"
              checked={goodFaith}
              onCheckedChange={setGoodFaith}
              text="I have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law."
            />
            <LegalCheck
              id="accurate"
              checked={accurate}
              onCheckedChange={setAccurate}
              text="I state that the information in this report is accurate and that I am the rights owner or authorized to act for the rights owner."
            />
            <SubmitButton loading={submitting}>Submit copyright report</SubmitButton>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function LegalCheck({
  id,
  checked,
  onCheckedChange,
  text,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Label htmlFor={id} className="font-normal leading-6">
        {text}
      </Label>
    </div>
  );
}
