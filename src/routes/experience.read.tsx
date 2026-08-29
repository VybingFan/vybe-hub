import { createFileRoute } from "@tanstack/react-router";
import { BookHeart, BookOpenText, Feather, PenLine } from "lucide-react";
import { PublicExperiencePage } from "@/components/experience/PublicExperiencePage";

export const Route = createFileRoute("/experience/read")({ component: ReadExperience });

function ReadExperience() {
  return (
    <PublicExperiencePage
      eyebrow="Read on VYBE"
      title="Words deserve a stage, too."
      description="Discover poetry, lyrics, stories, creator notes, and original writing from people with something to say."
      accent="#f59e0b"
      cards={[
        {
          title: "Poetry",
          image: "/images/experience-cards/poetry.webp",
          description: "Discover poems and spoken-word work presented with the identity and voice of the creator.",
          icon: Feather,
        },
        {
          title: "Lyrics",
          image: "/images/experience-cards/lyrics.webp",
          description: "Read creator-authorized lyrics alongside songs, credits, and the story behind the work.",
          icon: PenLine,
        },
        {
          title: "Creator stories",
          image: "/images/supporter-cards/creator-stories.webp",
          description: "Explore personal essays, milestones, inspirations, and experiences shaping what creators make.",
          icon: BookHeart,
        },
        {
          title: "Behind the work",
          image: "/images/experience-cards/behind-the-work.webp",
          description: "Read notes from the studio, set, writing desk, stage, editing room, and creative process.",
          icon: BookOpenText,
        },
      ]}
      note="Public written-content publishing is still expanding. VYBE will open deeper reading experiences as creator rights, moderation, collections, and publishing tools are completed."
    />
  );
}
