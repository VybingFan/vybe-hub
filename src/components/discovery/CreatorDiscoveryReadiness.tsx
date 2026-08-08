import { CheckCircle2, Circle, Compass } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { CreatorProfile } from "@/features/profile/schema";
import type { Track } from "@/features/music/schema";
import { creatorDiscoveryRequirements } from "@/features/discovery/readiness";

export function CreatorDiscoveryReadiness({
  profile,
  tracks,
  onEditProfile,
}: {
  profile: CreatorProfile | null;
  tracks: Track[];
  onEditProfile?: () => void;
}) {
  const hasPublicMusic = tracks.some(
    (track) => track.status === "published" && track.visibility === "public",
  );
  const requirements = creatorDiscoveryRequirements(profile, hasPublicMusic);
  const missing = requirements.filter((requirement) => !requirement.complete);
  const ready = missing.length === 0;

  return (
    <div
      className={
        ready
          ? "rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5"
          : "rounded-2xl border border-primary/25 bg-primary/5 p-5"
      }
    >
      <div className="flex items-start gap-3">
        <Compass
          className={
            ready
              ? "mt-0.5 h-5 w-5 text-emerald-500"
              : "mt-0.5 h-5 w-5 text-primary"
          }
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">
            {ready
              ? "Eligible for VYBE Discovery"
              : "Complete your Discovery setup"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {ready
              ? "Your creator profile has the required information and public music for Discovery."
              : "Incomplete creator pages are kept out of public Discovery until the required items below are ready."}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {requirements.map((requirement) => (
              <div
                key={requirement.key}
                className="flex items-center gap-2 text-sm"
              >
                {requirement.complete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={
                    requirement.complete
                      ? "text-muted-foreground"
                      : "font-medium"
                  }
                >
                  {requirement.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {!ready && onEditProfile ? (
              <Button size="sm" onClick={onEditProfile}>
                Complete profile
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link to="/public-music">Set up public music</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
