import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, MapPin, MessageCircle, Users, Vote } from "lucide-react";
import { PublicExperiencePage } from "@/components/experience/PublicExperiencePage";

export const Route = createFileRoute("/experience/communities")({ component: CommunitiesPreview });

function CommunitiesPreview() {
  return (
    <PublicExperiencePage
      eyebrow="VYBE Communities · Preview"
      title="The relationship continues after the work is shared."
      description="Creator-led spaces can give members a meaningful place to discuss, participate, discover, and belong."
      accent="#ec4899"
      cards={[
        {
          title: "Creator communities",
          description: "Spaces organized around creators and the culture surrounding their work.",
          icon: Users,
        },
        {
          title: "Discussions",
          description:
            "Conversations around releases, stories, scenes, ideas, and shared interests.",
          icon: MessageCircle,
        },
        {
          title: "Polls & questions",
          description: "Creators can invite members to respond, vote, and shape experiences.",
          icon: Vote,
        },
        {
          title: "Local communities",
          description:
            "Find creators, scenes, and cultural activity connected to a city or region.",
          icon: MapPin,
        },
        {
          title: "Member recognition",
          description: "Recognize founding members, helpful participation, and milestones.",
          icon: BadgeCheck,
        },
      ]}
      note="Posting, replies, moderation, reporting, notifications, and creator controls are not active yet."
    />
  );
}
