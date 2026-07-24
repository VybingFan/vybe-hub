import { createFileRoute } from "@tanstack/react-router";
import { Award, Map, MicVocal, Music, Puzzle, Trophy } from "lucide-react";
import { PublicExperiencePage } from "@/components/experience/PublicExperiencePage";

export const Route = createFileRoute("/experience/play")({ component: PlayPreview });

function PlayPreview() {
  return (
    <PublicExperiencePage
      eyebrow="Play on VYBE · Preview"
      title="Discovery becomes something you do."
      description="Games, challenges, learning, and recognition can make VYBE worth visiting even when your favorite creator has not posted something new."
      accent="#84cc16"
      cards={[
        {
          title: "Guess the song",
          description: "Identify a track, artist, sound, or era from carefully designed clues.",
          icon: Music,
        },
        {
          title: "Finish the lyric",
          description: "Test what you remember while discovering creators behind the words.",
          icon: MicVocal,
        },
        {
          title: "Trivia & quizzes",
          description:
            "Explore artists, genres, instruments, production, film, and creative history.",
          icon: Puzzle,
        },
        {
          title: "Daily challenges",
          description: "Return for a fresh listening, watching, reading, or discovery challenge.",
          icon: Trophy,
        },
        {
          title: "Scavenger hunts",
          description:
            "Follow clues across releases, creator pages, events, and local communities.",
          icon: Map,
        },
        {
          title: "Badges",
          description:
            "Recognize discovery, participation, knowledge, and early community support.",
          icon: Award,
        },
      ]}
      note="This is an experience preview—not a live points or rewards program. Rules, rights, age considerations, moderation, fairness, and reward economics come later."
    />
  );
}
