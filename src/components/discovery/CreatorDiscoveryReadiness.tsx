import { useState } from "react";
import { CheckCircle2, ChevronDown, Circle, Compass } from "lucide-react";
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
  const [expanded, setExpanded] = useState(!ready);

  return (
    <section
      className={
        ready
          ? "overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/10"
          : "overflow-hidden rounded-2xl border border-primary/25 bg-primary/5"
      }
    >
      <div className="flex items-start gap-3 p-4">
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
              ? "Your required profile information and public music are ready."
              : `${missing.length} required ${missing.length === 1 ? "item remains" : "items remain"} before your creator page can appear in Discovery.`}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? "Hide" : "Details"}
          <ChevronDown
            className={`ml-1 h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </Button>
      </div>
      {expanded ? (
        <div className="border-t border-border/60 px-4 pb-4 pt-3">
          <div className="grid gap-2 sm:grid-cols-2">
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
      ) : null}
    </section>
  );
}
