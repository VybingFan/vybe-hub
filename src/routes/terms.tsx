import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/layout/InformationPage";

export const Route = createFileRoute("/terms")({ component: TermsPage });

function TermsPage() {
  return (
    <InformationPage
      eyebrow="Legal"
      title="VYBE Terms of Use"
      description="The complete legal terms are being prepared before open public enrollment and monetization."
      sections={[
        { title: "Platform use", body: "Users must use VYBE lawfully and follow the published community, copyright, privacy, and safety policies." },
        { title: "Uploaded content", body: "Uploaders remain responsible for their content, permissions, credits, representations, and compliance." },
        { title: "Accounts and access", body: "VYBE may restrict access when needed to protect users, rights holders, the platform, or the public." },
        { title: "Service changes", body: "Features, limits, and availability may evolve as the beta develops, with important changes communicated clearly." },
      ]}
    />
  );
}
