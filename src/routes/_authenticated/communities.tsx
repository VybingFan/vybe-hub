import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, HeartHandshake, MapPin, MessageCircle, Users, Vote } from "lucide-react";
import { ExperiencePreviewPage } from "@/components/experience/ExperiencePreviewPage";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/_authenticated/communities")({ component: CommunitiesPage });

function CommunitiesPage() {
  return (
    <RoleGuard allow={["supporter", "creator", "business", "admin"]}>
      <ExperiencePreviewPage
        eyebrow="VYBE Communities · Preview"
        title="The relationship continues after the work is shared."
        description="Creator-led spaces can give members a meaningful place to discuss, participate, discover, and belong."
        accent="#ec4899"
        cards={[
          {
            title: "Creator communities",
            description:
              "Dedicated spaces organized around a creator and the culture surrounding their work.",
            icon: Users,
          },
          {
            title: "Discussions",
            description:
              "Thoughtful conversations around releases, stories, scenes, ideas, and shared interests.",
            icon: MessageCircle,
          },
          {
            title: "Polls & questions",
            description:
              "Creators can invite members to respond, vote, and help shape future experiences.",
            icon: Vote,
          },
          {
            title: "Local communities",
            description:
              "Find creators, members, scenes, and cultural activity connected to a city or region.",
            icon: MapPin,
          },
          {
            title: "Member recognition",
            description:
              "Badges can recognize founding members, helpful participation, and community milestones.",
            icon: BadgeCheck,
          },
          {
            title: "Healthy participation",
            description:
              "Clear standards and creator controls help protect people and creative work.",
            icon: HeartHandshake,
          },
        ]}
        note="Community posting, replies, moderation, reporting, notifications, and creator controls are not active yet. The preview establishes the intended member and creator experience."
      />
    </RoleGuard>
  );
}
