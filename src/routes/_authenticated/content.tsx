import { createFileRoute } from "@tanstack/react-router";
import { BookOpenText, Camera, Clapperboard, Mic2, Music2, Podcast } from "lucide-react";
import { ExperiencePreviewPage } from "@/components/experience/ExperiencePreviewPage";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/_authenticated/content")({ component: ContentPage });

function ContentPage() {
  return (
    <RoleGuard allow={["creator", "admin"]}>
      <ExperiencePreviewPage
        eyebrow="Creator Studio"
        title="One studio for every part of your creative world."
        description="Music works today. The wider VYBE content studio shows how filmmakers, poets, video creators, podcasters, photographers, and storytellers will eventually publish."
        accent="#7c3aed"
        cards={[
          {
            title: "Music",
            description:
              "Upload tracks, manage cover art, publish releases, and choose what appears on your public page.",
            icon: Music2,
            status: "Available now",
            to: "/music",
          },
          {
            title: "Videos",
            description:
              "Future music videos, performances, interviews, trailers, and behind-the-scenes publishing.",
            icon: Camera,
          },
          {
            title: "Short films",
            description:
              "Future film pages with credits, trailers, filmmaker context, screenings, and related work.",
            icon: Clapperboard,
          },
          {
            title: "Poetry & writing",
            description: "Future publishing for poems, lyrics, essays, stories, and creator notes.",
            icon: BookOpenText,
          },
          {
            title: "Podcasts & audio",
            description:
              "Future episodes, spoken word, interviews, serialized audio, and creator conversations.",
            icon: Podcast,
          },
          {
            title: "Live & performance",
            description:
              "Future sessions, readings, performances, premieres, and scheduled member experiences.",
            icon: Mic2,
          },
        ]}
        note="Only Music is enabled. The preview categories do not accept uploads yet; each requires its own storage, rights, moderation, publishing, and membership-limit foundation."
      />
    </RoleGuard>
  );
}
