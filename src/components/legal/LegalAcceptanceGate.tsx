import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileCheck2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LEGAL_POLICY_VERSION } from "@/constants/legal";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { copyrightComplianceService } from "@/services/compliance/copyrightComplianceService";

const REQUIRED_POLICIES = ["terms", "privacy", "community_guidelines", "copyright_policy"] as const;

export function LegalAcceptanceGate({ children }: { children: React.ReactNode }) {
  const { user, hasAnyRole } = useUser();
  const creatorAccount = hasAnyRole(["creator"]);
  const [loading, setLoading] = useState(true);
  const [needsGeneralAcceptance, setNeedsGeneralAcceptance] = useState(false);
  const [needsCreatorAcceptance, setNeedsCreatorAcceptance] = useState(false);
  const [generalAccepted, setGeneralAccepted] = useState(false);
  const [creatorAccepted, setCreatorAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    void Promise.all([
      supabase
        .from("user_policy_acceptances")
        .select("policy_key")
        .eq("user_id", user.id)
        .eq("policy_version", LEGAL_POLICY_VERSION),
      creatorAccount
        ? copyrightComplianceService.acceptanceReady(user.id)
        : Promise.resolve(true),
    ]).then(([generalResult, creatorReady]) => {
      if (!active) return;

      if (generalResult.error) {
        console.error("Could not load legal acceptance", generalResult.error);
        setNeedsGeneralAcceptance(true);
      } else {
        const found = new Set((generalResult.data ?? []).map((item) => item.policy_key));
        setNeedsGeneralAcceptance(REQUIRED_POLICIES.some((policy) => !found.has(policy)));
      }

      setNeedsCreatorAcceptance(creatorAccount && creatorReady !== true);
      setLoading(false);
    }).catch((error) => {
      if (!active) return;
      console.error("Could not check required policy updates", error);
      setNeedsGeneralAcceptance(true);
      if (creatorAccount) setNeedsCreatorAcceptance(true);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [user?.id, creatorAccount]);

  async function saveAcceptance() {
    if (!user?.id) return;
    if (needsGeneralAcceptance && !generalAccepted) return;
    if (needsCreatorAcceptance && !creatorAccepted) return;

    setSaving(true);
    try {
      if (needsGeneralAcceptance) {
        const { error } = await supabase.from("user_policy_acceptances").upsert(
          REQUIRED_POLICIES.map((policyKey) => ({
            user_id: user.id,
            policy_key: policyKey,
            policy_version: LEGAL_POLICY_VERSION,
            acceptance_source: "existing_user_gate",
          })),
          { onConflict: "user_id,policy_key,policy_version", ignoreDuplicates: true },
        );
        if (error) throw new Error(error.message);
      }

      if (needsCreatorAcceptance) {
        await copyrightComplianceService.accept(navigator.userAgent);
      }

      setNeedsGeneralAcceptance(false);
      setNeedsCreatorAcceptance(false);
      toast.success("Current policies accepted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record policy acceptance.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground">
        Checking for VYBE policy updates…
      </div>
    );
  }

  if (!needsGeneralAcceptance && !needsCreatorAcceptance) return children;

  const readyToContinue =
    (!needsGeneralAcceptance || generalAccepted) &&
    (!needsCreatorAcceptance || creatorAccepted);

  return (
    <div className="grid min-h-[75vh] place-items-center px-4 py-10">
      <section className="w-full max-w-2xl rounded-3xl border border-border/70 bg-card p-6 shadow-elevated sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          {needsCreatorAcceptance ? <ShieldCheck className="h-6 w-6" /> : <FileCheck2 className="h-6 w-6" />}
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[.16em] text-primary">
          Required policy update
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Review what changed before continuing
        </h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          VYBE records acceptance by policy version. Required agreements are shown separately from optional announcements and marketing choices.
        </p>

        {needsGeneralAcceptance ? (
          <div className="mt-6 rounded-2xl border border-border/70 p-4">
            <h2 className="font-semibold">VYBE account policies</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Review the current Terms, Privacy Policy, Community Guidelines, and Copyright Policy.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link to="/terms" target="_blank" className="underline">Terms</Link>
              <Link to="/privacy" target="_blank" className="underline">Privacy</Link>
              <Link to="/community-guidelines" target="_blank" className="underline">Community Guidelines</Link>
              <Link to="/copyright" target="_blank" className="underline">Copyright Policy</Link>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <Checkbox id="general-policy-acceptance" checked={generalAccepted} onCheckedChange={(value) => setGeneralAccepted(value === true)} />
              <Label htmlFor="general-policy-acceptance" className="font-normal leading-6 text-muted-foreground">
                I reviewed and agree to the VYBE account policies, version {LEGAL_POLICY_VERSION}.
              </Label>
            </div>
          </div>
        ) : null}

        {needsCreatorAcceptance ? (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <h2 className="font-semibold">Creator Upload and Repeat Infringer policies</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Creator accounts must accept the current upload, rights, and repeat-infringer rules before uploading or publishing new material.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link to="/copyright" hash="creator-agreement" target="_blank" className="underline">Creator Upload and Rights Agreement</Link>
              <Link to="/copyright" hash="repeat-infringer" target="_blank" className="underline">Repeat Infringer Policy</Link>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <Checkbox id="creator-policy-acceptance" checked={creatorAccepted} onCheckedChange={(value) => setCreatorAccepted(value === true)} />
              <Label htmlFor="creator-policy-acceptance" className="font-normal leading-6 text-muted-foreground">
                I read and agree to the current creator policies and will provide accurate rights information for uploaded content.
              </Label>
            </div>
          </div>
        ) : null}

        <Button className="mt-6 w-full" disabled={!readyToContinue || saving} onClick={() => void saveAcceptance()}>
          {saving ? "Recording acceptance…" : "Accept required policies and continue"}
        </Button>
        <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
          Acceptance is required only for the policies shown above. It does not subscribe you to marketing messages.
        </p>
      </section>
    </div>
  );
}

