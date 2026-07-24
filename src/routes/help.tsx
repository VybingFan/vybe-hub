import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/layout/InformationPage";

export const Route = createFileRoute("/help")({ component: HelpPage });

function HelpPage() {
  return (
    <InformationPage
      eyebrow="Help Center"
      title="Find your way around VYBE."
      description="Support documentation is being expanded alongside the platform. These categories establish the permanent help structure."
      sections={[
        { title: "Account help", body: "Sign-in, profile, role, onboarding, and account access guidance." },
        { title: "Creator help", body: "Creator profiles, music uploads, playlists, merchandise showcases, connections, and membership limits." },
        { title: "Fan help", body: "Discovery, playback, following, sharing, playlists, community participation, and future live access." },
        { title: "Safety and rights", body: "Reporting, copyright, privacy, community standards, and content-review guidance." },
      ]}
    />
  );
}
