import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MUSIC_RIGHTS_BASES,
  MUSIC_RIGHTS_POLICY_VERSION,
  type MusicRightsBasis,
} from "@/constants/legal";
import { ProfileCard } from "@/components/profile/ProfileCard";

export function RightsCertification({
  basis,
  confirmed,
  onBasisChange,
  onConfirmedChange,
}: {
  basis: MusicRightsBasis;
  confirmed: boolean;
  onBasisChange: (basis: MusicRightsBasis) => void;
  onConfirmedChange: (confirmed: boolean) => void;
}) {
  return (
    <ProfileCard
      title="Rights certification"
      description="Required for every track, including drafts. VYBE records your selection and certification."
    >
      <div className="space-y-2">
        <Label htmlFor="rights-basis">What rights basis applies to this music?</Label>
        <Select value={basis} onValueChange={(value) => onBasisChange(value as MusicRightsBasis)}>
          <SelectTrigger id="rights-basis">
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
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
        <Checkbox
          id="rights-confirmed"
          checked={confirmed}
          onCheckedChange={(checked) => onConfirmedChange(checked === true)}
        />
        <Label htmlFor="rights-confirmed" className="font-normal leading-6">
          I certify that I own or control the rights needed to upload and share this music through
          VYBE, including the recording, composition, beat, samples, vocals, lyrics, artwork, and
          other included material, or that I have valid permission or licenses covering this use. I
          understand that “free,” “promotional,” or “for feedback” does not replace permission.
        </Label>
      </div>

      <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          VYBE may request documentation, restrict or remove content, and enforce its{" "}
          <Link to="/copyright" target="_blank" className="text-foreground underline">
            Copyright Policy
          </Link>
          . Submitted documentation is not independently verified by VYBE. Rights policy version{" "}
          {MUSIC_RIGHTS_POLICY_VERSION}.
        </p>
      </div>
    </ProfileCard>
  );
}
