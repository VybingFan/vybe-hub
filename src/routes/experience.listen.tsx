import { createFileRoute } from "@tanstack/react-router";
import { Disc3, Headphones, ListMusic, Radio } from "lucide-react";
import { PublicExperiencePage } from "@/components/experience/PublicExperiencePage";

export const Route = createFileRoute("/experience/listen")({ component: ListenPreview });

function ListenPreview() {
  return (
    <PublicExperiencePage
      eyebrow="Listen on VYBE"
      title="Hear the work. Then meet the person behind it."
      description="VYBE begins with independent music and turns every listen into a path toward discovery, story, and community."
      accent="#22d3ee"
      cards={[
        {
          title: "Discover music",
          description: "Browse independent artists and published music available across VYBE.",
          icon: Headphones,
          status: "Available now",
          to: "/explore",
        },
        {
          title: "Creator playlists",
          description: "Hear the music creators deliberately choose and share with their audience.",
          icon: ListMusic,
          status: "Available now",
          to: "/explore",
        },
        {
          title: "New releases",
          description: "A future home for fresh singles, albums, and the stories surrounding them.",
          icon: Disc3,
        },
        {
          title: "Listening parties",
          description: "Scheduled experiences where creators and members can listen together.",
          icon: Radio,
        },
      ]}
      note="Music, creator pages, and shareable playlists work today. Personalized listening, catalog-wide releases, and live audio remain planned."
    />
  );
}
