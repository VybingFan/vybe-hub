import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/layout/InformationPage";

export const Route = createFileRoute("/trust")({ component: TrustPage });

function TrustPage() {
  return (
    <InformationPage
      eyebrow="Trust & Safety"
      title="Clear protections for creators, fans, and their work."
      description="VYBE will publish only security and safety practices that are implemented and verifiable."
      sections={[
        { title: "Account protection", body: "Authentication, access controls, and role-aware permissions help keep creator and fan areas separated appropriately." },
        { title: "Content control", body: "Creators choose what is public, while private or restricted content must be protected by backend access rules." },
        { title: "Reporting", body: "Users will have clear ways to report unsafe, illegal, infringing, or policy-violating content." },
        { title: "Incident response", body: "VYBE will document how security and safety concerns are reviewed, contained, communicated, and resolved." },
      ]}
    />
  );
}
