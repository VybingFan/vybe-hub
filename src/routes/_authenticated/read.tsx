import { createFileRoute } from "@tanstack/react-router";
import {
  BookHeart,
  BookOpenText,
  Feather,
  MessageSquareQuote,
  Newspaper,
  PenLine,
} from "lucide-react";
import { ExperiencePreviewPage } from "@/components/experience/ExperiencePreviewPage";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/_authenticated/read")({ component: ReadPage });

function ReadPage() {
  return (
    <RoleGuard allow={["supporter", "creator", "business", "admin"]}>
      <ExperiencePreviewPage
        eyebrow="Read on VYBE · Preview"
        title="Words deserve a stage, too."
        description="A future home for poets, lyricists, storytellers, journalists, and creators sharing the meaning behind their work."
        accent="#f59e0b"
        cards={[
          {
            title: "Poetry",
            description:
              "Poems presented as creative works with the voice and identity of the poet.",
            icon: Feather,
          },
          {
            title: "Lyrics",
            description:
              "Creator-authorized lyrics paired with songs, credits, and the story behind them.",
            icon: PenLine,
          },
          {
            title: "Creator stories",
            description:
              "Personal essays, milestones, inspirations, and the experiences shaping the work.",
            icon: BookHeart,
          },
          {
            title: "Behind the work",
            description: "Notes from the studio, set, writing desk, stage, and editing room.",
            icon: BookOpenText,
          },
          {
            title: "Interviews",
            description: "Conversations that introduce members to creators in their own words.",
            icon: MessageSquareQuote,
          },
          {
            title: "Culture & learning",
            description:
              "Editorial features exploring genres, movements, craft, and creative history.",
            icon: Newspaper,
          },
        ]}
        note="These layouts preview future written-content publishing. Authorship, rights, moderation, drafts, publishing, and reading collections must be built before public submissions open."
      />
    </RoleGuard>
  );
}
