import { createFileRoute } from "@tanstack/react-router";
import { Clapperboard, Film, Link2, Users } from "lucide-react";
import { PublicExperiencePage } from "@/components/experience/PublicExperiencePage";

export const Route = createFileRoute("/for-film-video")({ component: FilmVideoCreators });

function FilmVideoCreators() {
  return (
    <PublicExperiencePage
      eyebrow="For film & video creators"
      title="Give the work—and the world around it—a home."
      description="VYBE is preparing a creator-led path for filmmakers, directors, producers, performers, and video storytellers to present work, context, events, and community together."
      accent="#ef4444"
      cards={[
        {
          title: "Your creator home",
          description:
            "Introduce your body of work, identity, collaborators, credits, and creative direction.",
          icon: Film,
        },
        {
          title: "Shareable project pages",
          description:
            "Future direct links for films, trailers, scenes, series, and behind-the-scenes work.",
          icon: Link2,
        },
        {
          title: "Screenings & premieres",
          description:
            "Connect projects with screenings, premieres, conversations, and local events.",
          icon: Clapperboard,
        },
        {
          title: "Build an audience",
          description:
            "Give interested viewers a path from watching to following and participating.",
          icon: Users,
        },
      ]}
      note="This is an early product invitation. Film and video uploads are not enabled yet; the working creator pilot currently centers music."
    />
  );
}
