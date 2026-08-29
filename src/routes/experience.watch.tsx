import { createFileRoute } from "@tanstack/react-router";
import { Clapperboard, Film, PlaySquare, Video } from "lucide-react";
import { PublicExperiencePage } from "@/components/experience/PublicExperiencePage";

export const Route = createFileRoute("/experience/watch")({ component: WatchExperience });

function WatchExperience() {
  return (
    <PublicExperiencePage
      eyebrow="Watch on VYBE"
      title="A screen for independent vision."
      description="Discover films, trailers, performances, music videos, and visual stories from creators bringing their ideas to the screen."
      accent="#f43f5e"
      cards={[
        {
          title: "Films & stories",
          image: "/images/experience-cards/short-films.webp",
          description: "Independent visual work with creator context, credits, and a path back to the people who made it.",
          icon: Film,
        },
        {
          title: "Trailers & scenes",
          image: "/images/experience-cards/trailers-scenes.webp",
          description: "Preview upcoming films, screenings, series, performances, and creator projects.",
          icon: Clapperboard,
        },
        {
          title: "Music videos",
          image: "/images/experience-cards/music-videos.webp",
          description: "Experience the visual world creators build around a song or release.",
          icon: PlaySquare,
        },
        {
          title: "Behind the work",
          image: "/images/experience-cards/behind-scenes.webp",
          description: "Go behind the scenes with production diaries, commentary, studio sessions, and works in progress.",
          icon: Video,
        },
      ]}
      note="YouTube and Vimeo work can already be published through VYBE creator video tools. Native VYBE-hosted video continues to expand as streaming infrastructure is completed."
    />
  );
}
