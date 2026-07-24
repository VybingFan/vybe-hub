import { createFileRoute } from "@tanstack/react-router";
import { Clapperboard, Film, PlaySquare, Popcorn, RadioTower, Video } from "lucide-react";
import { ExperiencePreviewPage } from "@/components/experience/ExperiencePreviewPage";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/_authenticated/watch")({ component: WatchPage });

function WatchPage() {
  return (
    <RoleGuard allow={["supporter", "creator", "admin"]}>
      <ExperiencePreviewPage
        eyebrow="Watch on VYBE · Preview"
        title="A screen for independent vision."
        description="See how filmmakers, directors, musicians, performers, and video creators will present their work and bring audiences behind the scenes."
        accent="#f43f5e"
        cards={[
          {
            title: "Short films",
            description:
              "Independent films presented with credits, creator context, and a direct path to the filmmaker.",
            icon: Film,
          },
          {
            title: "Trailers & scenes",
            description:
              "Shareable previews for upcoming films, screenings, series, and creative projects.",
            icon: Clapperboard,
          },
          {
            title: "Music videos",
            description: "Pair a release with the visual world the artist created around it.",
            icon: PlaySquare,
          },
          {
            title: "Behind the scenes",
            description:
              "Production diaries, director commentary, studio sessions, and works in progress.",
            icon: Video,
          },
          {
            title: "Screenings",
            description:
              "Scheduled premieres and community screenings with audience participation.",
            icon: Popcorn,
          },
          {
            title: "Live video",
            description:
              "Future performances, conversations, interviews, and creator-hosted broadcasts.",
            icon: RadioTower,
          },
        ]}
        note="This page demonstrates the intended experience for prospective film and video creators. Video hosting, publishing, moderation, rights controls, and streaming are not enabled yet."
      />
    </RoleGuard>
  );
}
