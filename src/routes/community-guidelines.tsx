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
      description="These interim beta guidelines apply to public content, profiles, messages, comments, community features, links, and creator uploads."
      sections={[
        {
          title: "Respect people",
          body: "Harassment, threats, targeted abuse, exploitation, and hateful conduct are not part of the VYBE community.",
        },
        {
          title: "Respect creative work",
          body: "Do not impersonate creators, misrepresent credits, or upload work without the necessary permissions.",
        },
        {
          title: "Keep interactions authentic",
          body: "Avoid spam, manipulation, deceptive engagement, fraudulent promotions, and coordinated abuse.",
        },
        {
          title: "Protect privacy and consent",
          body: "Do not expose another person's private information, intimate material, recordings, likeness, or communications without authorization.",
        },
        {
          title: "Protect minors",
          body: "Sexual exploitation, grooming, predatory behavior, or content that endangers minors is prohibited and may be reported to appropriate authorities.",
        },
        {
          title: "No harmful or illegal activity",
          body: "Do not use VYBE for fraud, malware, dangerous threats, illegal transactions, evasion of access controls, or instructions intended to cause serious harm.",
        },
        {
          title: "Enforcement",
          body: "VYBE may restrict content or features, issue warnings, preserve evidence, suspend accounts, or terminate access based on severity, history, credible reports, and legal obligations.",
        },
        {
          title: "Report concerns",
          body: "Use the applicable VYBE reporting process for safety, rights, or policy concerns. Copyright complaints should use the dedicated copyright report form.",
        },
      ]}
    />
  );
}
