import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileCheck2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LEGAL_POLICY_VERSION } from "@/constants/legal";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";

const REQUIRED_POLICIES = ["terms", "privacy", "community_guidelines", "copyright_policy"] as const;

export function LegalAcceptanceGate({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [needsAcceptance, setNeedsAcceptance] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    void supabase
      .from("user_policy_acceptances")
      .select("policy_key")
      .eq("user_id", user.id)
      .eq("policy_version", LEGAL_POLICY_VERSION)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Could not load legal acceptance", error);
          setNeedsAcceptance(true);
        } else {
          const found = new Set((data ?? []).map((item) => item.policy_key));
          setNeedsAcceptance(REQUIRED_POLICIES.some((policy) => !found.has(policy)));
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  async function saveAcceptance() {
    if (!user?.id || !accepted) return;
    setSaving(true);
    const { error } = await supabase.from("user_policy_acceptances").upsert(
      REQUIRED_POLICIES.map((policyKey) => ({
        user_id: user.id,
        policy_key: policyKey,
        policy_version: LEGAL_POLICY_VERSION,
        acceptance_source: "existing_user_gate",
      })),
      { onConflict: "user_id,policy_key,policy_version", ignoreDuplicates: true },
    );
    if (error) toast.error(error.message);
    else setNeedsAcceptance(false);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground">
        Loading your VYBE…
      </div>
    );
  }

  if (!needsAcceptance) return children;

  return (
    <div className="grid min-h-[70vh] place-items-center px-4 py-10">
      <section className="w-full max-w-xl rounded-3xl border border-border/70 bg-card p-7 shadow-elevated">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <FileCheck2 className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Review VYBE’s beta policies</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Before continuing, review and accept the current Terms, Privacy Policy, Community
          Guidelines, and Copyright Policy. These are interim beta policies pending attorney review.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link to="/terms" target="_blank" className="underline">
            Terms
          </Link>
          <Link to="/privacy" target="_blank" className="underline">
            Privacy
          </Link>
          <Link to="/community-guidelines" target="_blank" className="underline">
            Community Guidelines
          </Link>
          <Link to="/copyright" target="_blank" className="underline">
            Copyright Policy
          </Link>
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border/70 p-4">
          <Checkbox
            id="existing-user-legal-acceptance"
            checked={accepted}
            onCheckedChange={(value) => setAccepted(value === true)}
          />
          <Label
            htmlFor="existing-user-legal-acceptance"
            className="font-normal leading-6 text-muted-foreground"
          >
            I have reviewed and agree to these policies, version {LEGAL_POLICY_VERSION}.
          </Label>
        </div>
        <Button
          className="mt-6 w-full"
          disabled={!accepted || saving}
          onClick={() => void saveAcceptance()}
        >
          {saving ? "Saving acceptance…" : "Accept and continue"}
        </Button>
      </section>
    </div>
  );
}
