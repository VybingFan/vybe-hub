import { createFileRoute } from "@tanstack/react-router";
import { PlayExperience } from "@/features/play/PlayExperience";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";

export const Route = createFileRoute("/experience/play")({ component: PublicPlayExperience });

function PublicPlayExperience() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <PlayExperience />
      <Footer />
    </div>
  );
}
