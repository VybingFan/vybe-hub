import { createFileRoute } from "@tanstack/react-router";
import { PlayExperience } from "@/features/play/PlayExperience";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";

export const Route = createFileRoute("/experience/play")({
  head: () => ({
    meta: [
      { title: "VYBE Play | Games, Trivia & Creator Discovery" },
      { name: "description", content: "Play VYBE games, trivia and discovery experiences built around entertainment, creators and culture." },
    ],
    links: [{ rel: "canonical", href: "https://vybewithvybe.com/experience/play" }],
  }),
  component: PublicPlayExperience,
});

function PublicPlayExperience() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <PlayExperience />
      <Footer />
    </div>
  );
}
