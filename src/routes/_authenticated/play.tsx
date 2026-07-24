import { createFileRoute } from "@tanstack/react-router";
import { Award, BookOpenCheck, Gift, Map, MicVocal, Music, Puzzle, Trophy } from "lucide-react";
import { ExperiencePreviewPage } from "@/components/experience/ExperiencePreviewPage";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/_authenticated/play")({ component: PlayPage });

function PlayPage() {
  return (
    <RoleGuard allow={["supporter", "creator", "admin"]}>
      <ExperiencePreviewPage
        eyebrow="Play on VYBE · Preview"
        title="Discovery becomes something you do."
        description="Games, challenges, learning, and rewards can make VYBE worth visiting even when your favorite creator has not posted something new."
        accent="#84cc16"
        cards={[
          {
            title: "Guess the song",
            description: "Identify a track, artist, sound, or era from carefully designed clues.",
            icon: Music,
          },
          {
            title: "Finish the lyric",
            description:
              "Test what you remember while discovering the stories and creators behind the words.",
            icon: MicVocal,
          },
          {
            title: "Trivia & quizzes",
            description:
              "Explore artist trivia, genres, instruments, production, film, and creative history.",
            icon: Puzzle,
          },
          {
            title: "Daily challenges",
            description:
              "Return for a new listening, watching, reading, or creator-discovery challenge.",
            icon: Trophy,
          },
          {
            title: "Scavenger hunts",
            description:
              "Follow clues across releases, creator pages, events, and local communities.",
            icon: Map,
          },
          {
            title: "Learn on VYBE",
            description:
              "Short interactive lessons about genres, craft, instruments, production, and history.",
            icon: BookOpenCheck,
          },
          {
            title: "Badges & achievements",
            description:
              "Recognize discovery, participation, knowledge, and early community support.",
            icon: Award,
          },
          {
            title: "Rewards & collectibles",
            description:
              "Future creator-approved rewards, digital collectibles, and community recognition.",
            icon: Gift,
          },
        ]}
        note="This is the experience blueprint—not a live points or rewards program. Game rules, rights, age considerations, moderation, fairness, and reward economics require a separate implementation phase."
      />
    </RoleGuard>
  );
}
