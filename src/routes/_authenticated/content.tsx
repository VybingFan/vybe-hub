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
              "Publish hosted music videos, performances, interviews, trailers, and behind-the-scenes stories.",
            icon: Camera,
            status: "Available now",
            to: "/videos",
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
        note="Music and hosted-video publishing are enabled. Native VYBE video uploads will activate after Cloudflare Stream is connected; the remaining preview categories still require their own foundations."
      />
    </RoleGuard>
  );
}
