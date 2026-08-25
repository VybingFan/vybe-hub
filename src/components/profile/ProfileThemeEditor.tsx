import { Camera, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LockedFeatureCard } from "@/components/membership/LockedFeatureCard";
import type { CreatorPlanCode } from "@/features/membership/catalog";
import { creatorCanUploadProfileBackground } from "@/features/profile/profileThemes";

interface Props {
  planCode?: CreatorPlanCode;
  backgroundUrl?: string;
  uploading: boolean;
  onUploadBackground: (file?: File) => void;
  onRemoveBackground: () => void;
}

export function ProfileThemeEditor({
  planCode,
  backgroundUrl,
  uploading,
  onUploadBackground,
  onRemoveBackground,
}: Props) {
  if (!creatorCanUploadProfileBackground(planCode)) {
    return (
      <LockedFeatureCard
        title="Full-page creator backgrounds begin with Creator Pro"
        description="Creator Pro, Founding Creator, and Creator Studio can replace the standard public-page background with their own full-page image. This is separate from VYBE interface Appearance settings."
        requiredPlan="creator_pro"
        educationKey="profile_background"
      />
    );
  }

  return (
    <div className="space-y-4 min-[900px]:space-y-3">
      <div>
        <p className="font-semibold">Full-page creator background</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Replace the background behind your public creator page. Your cover stays separate, and VYBE keeps a readability layer over the image.
        </p>
      </div>

      {backgroundUrl ? (
        <div
          className="h-52 rounded-2xl border border-border bg-cover bg-center min-[900px]:h-36"
          style={{
            backgroundImage: `linear-gradient(rgba(5,6,14,.3), rgba(5,6,14,.68)), url("${backgroundUrl}")`,
          }}
        />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 text-center text-sm text-muted-foreground min-[900px]:h-28">
          Your public page is currently using the standard VYBE background.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Camera className="mr-2 h-4 w-4" />
          )}
          {backgroundUrl ? "Change full-page background" : "Upload full-page background"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(event) => onUploadBackground(event.target.files?.[0])}
          />
        </label>
        {backgroundUrl ? (
          <Button type="button" variant="outline" onClick={onRemoveBackground}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Use standard VYBE background
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Recommended: 2000 × 1400 px or larger, landscape orientation, JPG/PNG/WebP up to 8MB.
      </p>
    </div>
  );
}
