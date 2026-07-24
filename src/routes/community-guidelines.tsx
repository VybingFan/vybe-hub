import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/layout/InformationPage";

export const Route = createFileRoute("/community-guidelines")({
  component: CommunityGuidelinesPage,
});

function CommunityGuidelinesPage() {
  return (
    <InformationPage
      eyebrow="Community Guidelines"
      title="Create, discover, and participate with respect."
      description="VYBE is designed for meaningful creator and fan communities. Participation should protect people, creative work, and healthy conversation."
      sections={[
        { title: "Respect people", body: "Harassment, threats, targeted abuse, exploitation, and hateful conduct are not part of the VYBE community." },
        { title: "Respect creative work", body: "Do not impersonate creators, misrepresent credits, or upload work without the necessary permissions." },
        { title: "Keep interactions authentic", body: "Avoid spam, manipulation, deceptive engagement, fraudulent promotions, and coordinated abuse." },
        { title: "Report concerns", body: "Safety, rights, and policy concerns should be reported through the appropriate VYBE review channel." },
      ]}
    />
  );
}
