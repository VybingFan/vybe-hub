import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/layout/InformationPage";
import { LEGAL_POLICY_VERSION } from "@/constants/legal";

export const Route = createFileRoute("/terms")({ component: TermsPage });

function TermsPage() {
  return (
    <InformationPage
      eyebrow="Legal"
      title="VYBE Terms of Use"
      description={`Interim beta terms, version ${LEGAL_POLICY_VERSION}. These terms govern current use of VYBE and remain subject to attorney review and future revision with notice.`}
      sections={[
        {
          title: "Agreement and eligibility",
          body: "By creating an account or using VYBE, you agree to these Terms, the Privacy Policy, Community Guidelines, and Copyright Policy. You must provide accurate information and be legally able to enter this agreement.",
        },
        {
          title: "Your ownership; VYBE license",
          body: "You retain ownership of content you create. You grant VYBE a limited, non-exclusive license to host, store, process, reproduce, stream, display, and distribute that content only as needed to operate, secure, promote, and improve the VYBE service according to your selected sharing settings.",
        },
        {
          title: "Your rights responsibilities",
          body: "You are responsible for every recording, composition, beat, sample, lyric, performance, image, video, name, likeness, and other element you upload. You must own the necessary rights or have valid permission or licenses for VYBE's uses.",
        },
        {
          title: "No guarantee against misuse",
          body: "VYBE uses access controls and reporting processes but cannot guarantee that another person will never copy, record, download, misuse, or redistribute content. VYBE does not insure creators against infringement or theft.",
        },
        {
          title: "Moderation and preservation",
          body: "VYBE may review, preserve, restrict, disable, or remove content and may suspend or terminate accounts to enforce policies, protect people or rights holders, respond to legal requests, or protect the platform.",
        },
        {
          title: "Repeat infringement",
          body: "VYBE may terminate accounts of users who repeatedly infringe intellectual-property rights. VYBE may consider valid notices, counter-notices, retractions, court findings, user history, and other reliable information.",
        },
        {
          title: "Beta service and limitations",
          body: "Features, availability, limits, and pricing may change during the beta. The service is provided on an as-available basis. To the extent permitted by law, VYBE disclaims implied warranties and limits liability; legal obligations that cannot be waived remain unaffected.",
        },
        {
          title: "Creator responsibility and indemnity",
          body: "To the extent permitted by law, users are responsible for claims and costs resulting from content they upload, their breach of these Terms, or their violation of another person's rights. This interim clause requires attorney review before commercial expansion.",
        },
      ]}
    />
  );
}
