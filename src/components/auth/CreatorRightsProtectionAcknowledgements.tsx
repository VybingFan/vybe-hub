import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  CREATOR_RIGHTS_PROTECTION_VERSION,
  type CreatorRightsProtectionAcknowledgementState,
} from "@/constants/creatorRightsProtection";

interface Props {
  value: CreatorRightsProtectionAcknowledgementState;
  onChange: (
    key: keyof CreatorRightsProtectionAcknowledgementState,
    checked: boolean,
  ) => void;
}

const acknowledgements: Array<{
  key: keyof CreatorRightsProtectionAcknowledgementState;
  text: string;
}> = [
  {
    key: "permissionConfirmed",
    text: "I understand I should only upload music or audio I have the rights or appropriate permission to use.",
  },
  {
    key: "fingerprintingUnderstood",
    text: "I understand VYBE may create an audio fingerprint of eligible audio I upload for identification, protection, platform integrity, and related VYBE features.",
  },
  {
    key: "matchLimitUnderstood",
    text: "I understand a similarity or fingerprint match does not automatically establish copyright ownership or infringement.",
  },
  {
    key: "workClassificationAccuracyConfirmed",
    text: "I agree to provide accurate information when asked whether a work is original, collaborative, a cover, a remix, contains samples, or otherwise uses third-party material.",
  },
  {
    key: "informationRequestUnderstood",
    text: "I understand VYBE may request additional information if a potential rights issue requires review.",
  },
];

export function CreatorRightsProtectionAcknowledgements({ value, onChange }: Props) {
  return (
    <section className="space-y-4 rounded-2xl border border-primary/25 bg-primary/5 p-4">
      <div className="space-y-2">
        <p className="flex items-center gap-2 font-semibold text-white">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Protect your work with VYBE
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          VYBE helps creators identify and protect their music. When eligible audio is uploaded,
          VYBE may create a digital audio fingerprint. The fingerprint can help identify the
          recording and detect audio that may be the same or similar, including some altered
          versions.
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          <strong className="text-zinc-200">
            A fingerprint match does not by itself prove copyright ownership or infringement.
          </strong>{" "}
          Potential matches may be reviewed before VYBE takes rights-related action. You are
          responsible for making sure you have the rights or appropriate permission to upload and
          use the content you provide to VYBE.
        </p>
        <p className="text-xs text-muted-foreground">
          <Link to="/copyright" target="_blank" className="text-foreground underline underline-offset-4">
            Learn about copyright protection, registration, and creator rights
          </Link>
          . Copyright registration is separate from VYBE audio fingerprinting.
        </p>
      </div>

      <div className="space-y-3">
        {acknowledgements.map((item) => {
          const id = `creator-rights-${item.key}`;
          return (
            <div key={item.key} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/10 p-3">
              <Checkbox
                id={id}
                checked={value[item.key]}
                onCheckedChange={(checked) => onChange(item.key, checked === true)}
              />
              <Label htmlFor={id} className="text-xs font-normal leading-5 text-muted-foreground">
                {item.text}
              </Label>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        VYBE Rights &amp; Protection acknowledgement version {CREATOR_RIGHTS_PROTECTION_VERSION}.
      </p>
    </section>
  );
}
