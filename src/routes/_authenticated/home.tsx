import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Compass, Gamepad2, Heart, Sparkles, UsersRound } from "lucide-react";
import { ExperiencePreviewPage } from "@/components/experience/ExperiencePreviewPage";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/_authenticated/home")({ component: HomePage });

function HomePage() {
  return (
    <RoleGuard allow={["supporter", "creator", "admin"]}>
      <ExperiencePreviewPage
        eyebrow="Your member home"
        title="Something worth returning to—every day."
        description="Follow what is new across the creators, communities, challenges, and experiences that make up your VYBE."
        accent="#a855f7"
        cards={[
          {
            title: "Discover creators",
            description:
              "Move across artists, genres, stories, playlists, and emerging creative voices.",
            icon: Compass,
            status: "Available now",
            to: "/discover",
          },
          {
            title: "Daily challenge",
            description: "A fresh trivia, listening, or discovery challenge designed for members.",
            icon: Gamepad2,
          },
          {
            title: "From your creators",
            description:
              "Future updates from creators you follow, gathered into one personal feed.",
            icon: Sparkles,
          },
          {
            title: "Community activity",
            description: "Return to conversations, polls, contests, and creator-led spaces.",
            icon: UsersRound,
          },
          {
            title: "Upcoming events",
            description:
              "See releases, listening parties, screenings, performances, and local events.",
            icon: CalendarDays,
          },
          {
            title: "Saved to My VYBE",
            description:
              "Pick up where you left off across saved creators, playlists, videos, and stories.",
            icon: Heart,
          },
        ]}
        note="Discovery is available now. Personalized following, challenges, communities, events, and saved experiences are presented here as the next member-centered phase."
      />
    </RoleGuard>
  );
}
