import { createFileRoute } from "@tanstack/react-router";
import { BookHeart, BookOpenText, Feather, PenLine } from "lucide-react";
import { PublicExperiencePage } from "@/components/experience/PublicExperiencePage";

export const Route = createFileRoute("/experience/read")({ component: ReadPreview });

function ReadPreview() {
  return (
    <PublicExperiencePage
      eyebrow="Read on VYBE · Preview"
      title="Words deserve a stage, too."
      description="A future home for poets, lyricists, storytellers, journalists, and creators sharing the meaning behind their work."
      accent="#f59e0b"
      cards={[
        {
          title: "Poetry",
          image: "/images/experience-cards/poetry.webp",
          description: "Poems presented as creative works with the identity and voice of the poet.",
          icon: Feather,
        },
        {
          title: "Lyrics",
          image: "/images/experience-cards/lyrics.webp",
          description: "Creator-authorized lyrics paired with songs, credits, and their stories.",
          icon: PenLine,
        },
        {
          title: "Creator stories",
          image: "/images/supporter-cards/creator-stories.webp",
          description:
            "Personal essays, milestones, inspirations, and experiences shaping the work.",
          icon: BookHeart,
        },
        {
          title: "Behind the work",
          image: "/images/experience-cards/behind-the-work.webp",
          description: "Notes from the studio, set, writing desk, stage, and editing room.",
          icon: BookOpenText,
        },
      ]}
      note="Written-content drafts, publishing, rights, moderation, and reading collections must be built before public submissions open."
    />
  );
}
