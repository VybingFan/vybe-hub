import { createFileRoute } from "@tanstack/react-router";
import { BookHeart, Feather, Link2, Users } from "lucide-react";
import { PublicExperiencePage } from "@/components/experience/PublicExperiencePage";

export const Route = createFileRoute("/for-writers-poets")({ component: WritersPoets });

function WritersPoets() {
  return (
    <PublicExperiencePage
      eyebrow="For writers & poets"
      title="Let people experience the voice behind the words."
      description="VYBE is preparing a creator-led space for poets, lyricists, essayists, spoken-word artists, and storytellers to publish, share, and gather community around their work."
      accent="#f59e0b"
      cards={[
        {
          title: "Your creator home",
          description:
            "Present your voice, story, body of work, influences, and creative identity.",
          icon: Feather,
        },
        {
          title: "Shareable work",
          description:
            "Future direct links for poems, lyrics, essays, stories, readings, and collections.",
          icon: Link2,
        },
        {
          title: "Words with context",
          description:
            "Connect each work to its inspiration, audio, video, event, or related release.",
          icon: BookHeart,
        },
        {
          title: "Reader community",
          description:
            "Create future spaces for discussion, readings, questions, and participation.",
          icon: Users,
        },
      ]}
      note="This is an early product invitation. Written-content publishing is not enabled yet; the working creator pilot currently centers music."
    />
  );
}
