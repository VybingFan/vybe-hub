import { createFileRoute, Link } from "@tanstack/react-router";
import { InformationPage } from "@/components/layout/InformationPage";
import { Button } from "@/components/ui/button";
import { LEGAL_POLICY_VERSION } from "@/constants/legal";

export const Route = createFileRoute("/copyright")({ component: CopyrightPage });

function CopyrightPage() {
  return (
    <InformationPage
      eyebrow="Copyright"
      title="VYBE Copyright and Rights Policy"
      description={`Interim beta policy, version ${LEGAL_POLICY_VERSION}. Share only work you created or have permission to use. This process is operational now but is not yet a representation that VYBE has completed DMCA-agent registration.`}
      action={
        <Button asChild>
          <Link to="/copyright/report">Submit a copyright report</Link>
        </Button>
      }
      sections={[
        {
          title: "Uploader responsibility",
          body: "Uploaders must own or control every right needed for VYBE to host, reproduce, stream, display, process, and share the content according to its settings. Promotional or non-commercial use does not replace permission.",
        },
        {
          title: "Separate music rights",
          body: "A track may involve separate rights in the composition, lyrics, beat, samples, featured performances, artwork, and sound recording. A license covering one element may not cover all uses or elements.",
        },
        {
          title: "Rights certification",
          body: "VYBE records the uploader's selected rights basis, certification, policy version, and time. Documentation submitted by a creator is not independently verified or legally approved by VYBE.",
        },
        {
          title: "Reporting infringement",
          body: "A rights owner or authorized representative may submit the dedicated form identifying the work, the VYBE location, contact details, good-faith belief, accuracy statement, and electronic signature.",
        },
        {
          title: "Review and restriction",
          body: "VYBE may preserve a report, restrict access while reviewing it, contact affected users, request information, remove or restore material, and retain records of the decision.",
        },
        {
          title: "Counter-notices",
          body: "A creator who believes content was removed by mistake may be offered a counter-notice process requiring identification of the removed material, a statement under penalty of perjury, consent to appropriate jurisdiction, and a signature. Formal wording requires attorney review.",
        },
        {
          title: "Repeat infringers",
          body: "VYBE may suspend or terminate users who repeatedly infringe rights. Valid notices, counter-notices, retractions, court findings, user history, and other reliable information may be considered.",
        },
        {
          title: "False or abusive reports",
          body: "Do not knowingly submit false ownership claims, misrepresent authorization, or misuse the reporting system. VYBE may reject abusive reports and restrict accounts that misuse its processes.",
        },
      ]}
    />
  );
}
