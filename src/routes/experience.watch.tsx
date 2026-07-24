import { createFileRoute } from "@tanstack/react-router";
import { Clapperboard, Film, PlaySquare, Video } from "lucide-react";
import { PublicExperiencePage } from "@/components/experience/PublicExperiencePage";

export const Route = createFileRoute("/experience/watch")({ component: WatchPreview });

function WatchPreview() {
  return (
    <PublicExperiencePage
      eyebrow="Watch on VYBE · Preview"
      title="A screen for independent vision."
      description="A future destination for filmmakers, directors, musicians, performers, and video creators to share their work and reach an audience."
      accent="#f43f5e"
      cards={[
        {
          title: "Short films",
          description:
            "Independent films presented with credits, creator context, and a path to the filmmaker.",
          icon: Film,
        },
        {
          title: "Trailers & scenes",
          description: "Shareable previews for upcoming films, screenings, series, and projects.",
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
      ]}
      note="Creators can now publish YouTube and Vimeo work through a VYBE Video Library and shareable VYBE pages. Native uploads, VYBE-hosted streaming, advanced moderation, and premieres activate in later infrastructure stages."
    />
  );
}
