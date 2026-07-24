import { createFileRoute } from "@tanstack/react-router";
import { Disc3, Headphones, ListMusic, Mic2, Radio, Sparkles } from "lucide-react";
import { ExperiencePreviewPage } from "@/components/experience/ExperiencePreviewPage";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/_authenticated/listen")({ component: ListenPage });

function ListenPage() {
  return (
    <RoleGuard allow={["supporter", "creator", "admin"]}>
      <ExperiencePreviewPage
        eyebrow="Listen on VYBE"
        title="Hear the work. Then meet the person behind it."
        description="VYBE begins with independent music and turns every listen into a path toward discovery, story, and community."
        accent="#22d3ee"
        cards={[
          {
            title: "Discover music",
            description: "Browse the artists and sounds currently available across VYBE.",
            icon: Headphones,
            status: "Available now",
            to: "/discover",
          },
          {
            title: "Creator playlists",
            description:
              "Experience the music creators deliberately choose and share with their audience.",
            icon: ListMusic,
            status: "Available now",
            to: "/discover",
          },
          {
            title: "New releases",
            description: "A future home for fresh singles, albums, and release stories.",
            icon: Disc3,
          },
          {
            title: "Listening parties",
            description: "Scheduled experiences where creators and members can listen together.",
            icon: Radio,
          },
          {
            title: "Live performances",
            description: "Recorded and live sessions that bring members closer to the performance.",
            icon: Mic2,
          },
          {
            title: "Made for discovery",
            description: "Curated paths across moods, cities, genres, and emerging creators.",
            icon: Sparkles,
          },
        ]}
        note="Music uploads, public creator pages, and shareable playlists are working now. Catalog-wide releases, live audio, and personalized listening remain planned."
      />
    </RoleGuard>
  );
}
