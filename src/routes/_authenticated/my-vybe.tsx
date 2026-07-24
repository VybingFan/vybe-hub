import { createFileRoute } from "@tanstack/react-router";
import { Award, Bookmark, Clock3, Heart, ListMusic, UserRoundCheck } from "lucide-react";
import { ExperiencePreviewPage } from "@/components/experience/ExperiencePreviewPage";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/_authenticated/my-vybe")({ component: MyVybePage });

function MyVybePage() {
  return (
    <RoleGuard allow={["supporter", "creator", "admin"]}>
      <ExperiencePreviewPage
        eyebrow="My VYBE · Preview"
        title="Keep what moves you close."
        description="Your personal place for followed creators, saved experiences, playlists, participation, recognition, and the things you want to revisit."
        accent="#8b5cf6"
        cards={[
          {
            title: "Followed creators",
            description:
              "A future personal directory of the creators whose work and updates matter to you.",
            icon: UserRoundCheck,
          },
          {
            title: "Saved experiences",
            description: "Return to music, videos, films, writing, events, and creator stories.",
            icon: Bookmark,
          },
          {
            title: "Your playlists",
            description:
              "Save creator playlists and eventually create personal listening collections.",
            icon: ListMusic,
          },
          {
            title: "Recently experienced",
            description: "Continue listening, watching, or reading from where you left off.",
            icon: Clock3,
          },
          {
            title: "Communities",
            description: "Reenter the creator spaces and conversations you have joined.",
            icon: Heart,
          },
          {
            title: "Badges & recognition",
            description:
              "See founding-member recognition, achievements, and participation milestones.",
            icon: Award,
          },
        ]}
        note="Member saving, following, personal history, collections, badges, and recognition require supporting data and privacy controls. This preview establishes their future home."
      />
    </RoleGuard>
  );
}
