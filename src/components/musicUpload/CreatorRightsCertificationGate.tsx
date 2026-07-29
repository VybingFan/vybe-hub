import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileCard } from "@/components/profile/ProfileCard";
import {
  MUSIC_RIGHTS_BASES,
  MUSIC_RIGHTS_POLICY_VERSION,
  type MusicRightsBasis,
} from "@/constants/legal";

export function CreatorRightsCertificationGate({
  renewing,
  onCertify,
}: {
  renewing?: boolean;
  onCertify: (basis: MusicRightsBasis) => Promise<void>;
}) {
  const [basis, setBasis] = useState<MusicRightsBasis>("entirely_original");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!confirmed) {
      toast.error("Confirm your music rights responsibility before continuing.");
      return;
    }
    setSaving(true);
    try {
      await onCertify(basis);
      toast.success("Music rights certification recorded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record certification");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileCard
      title={renewing ? "Renew your music upload certification" : "Music upload certification"}
      description={
        renewing
          ? "VYBE asks creators to renew after every 15 uploaded songs."
          : "Complete this once to begin uploading. VYBE will ask you to renew after 15 songs."
      }
    >
      <div className="space-y-2">
        <Label htmlFor="usual-rights-basis">Which category applies to most of your music?</Label>
        <Select value={basis} onValueChange={(value) => setBasis(value as MusicRightsBasis)}>
          <SelectTrigger id="usual-rights-basis">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MUSIC_RIGHTS_BASES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          This becomes your usual category. You can change it for an individual song when needed.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
        <Checkbox
          id="creator-rights-confirmed"
          checked={confirmed}
          onCheckedChange={(checked) => setConfirmed(checked === true)}
        />
        <Label htmlFor="creator-rights-confirmed" className="font-normal leading-6">
          I certify that I will upload only music I own or have the necessary permission or licenses
          to use on VYBE. This responsibility applies to recordings, compositions, beats, samples,
          vocals, lyrics, artwork, and other included material.
        </Label>
      </div>

      <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          VYBE may request documentation, restrict or remove content, and enforce its{" "}
          <Link to="/copyright" target="_blank" className="text-foreground underline">
            Copyright Policy
          </Link>
          . Policy version {MUSIC_RIGHTS_POLICY_VERSION}.
        </p>
      </div>

      <Button type="button" disabled={saving} onClick={() => void submit()}>
        {saving ? "Recording…" : renewing ? "Renew and continue" : "Certify and begin uploading"}
      </Button>
    </ProfileCard>
  );
}
