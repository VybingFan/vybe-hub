import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/layout/InformationPage";
import { LEGAL_POLICY_VERSION } from "@/constants/legal";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  return (
    <InformationPage
      eyebrow="Privacy"
      title="VYBE Privacy Policy"
      description={`Interim beta privacy notice, version ${LEGAL_POLICY_VERSION}. It describes current product data practices and remains subject to attorney review.`}
      sections={[
        {
          title: "Information collected",
          body: "VYBE processes account details, profile information, uploaded content, playlists, follows, playback and engagement activity, community interactions, device information, support requests, and policy-acceptance records.",
        },
        {
          title: "How information is used",
          body: "Information is used to authenticate users, deliver creator and fan features, secure the service, enforce limits and policies, process reports, understand performance, prevent abuse, and communicate about accounts.",
        },
        {
          title: "Service providers",
          body: "VYBE uses providers including Supabase for application data and authentication and Cloudflare for delivery and hosting. Providers process information needed to perform their contracted services under their own applicable terms.",
        },
        {
          title: "Public and restricted information",
          body: "Public profiles, published creator content, credits, playlists, and interactions may be visible to others. Drafts, private account information, license evidence, and internal review notes should remain access-controlled.",
        },
        {
          title: "Rights and copyright records",
          body: "VYBE records upload certifications, selected rights bases, copyright complaints, moderation actions, and related evidence to operate its rights-compliance process and address disputes.",
        },
        {
          title: "Retention and deletion",
          body: "VYBE retains information while accounts or content are active and as reasonably needed for security, disputes, legal obligations, policy enforcement, backups, and fraud prevention. Eligible deletion requests may be subject to required retention.",
        },
        {
          title: "Security and limits",
          body: "VYBE uses technical and organizational safeguards but no service can promise absolute security. Users should use strong passwords and promptly report suspected unauthorized access.",
        },
        {
          title: "Children and contact",
          body: "VYBE is not intended for children who cannot legally consent to the service. Age rules, regional privacy rights, request procedures, and a formal privacy contact must be finalized before broad public launch.",
        },
      ]}
    />
  );
}
