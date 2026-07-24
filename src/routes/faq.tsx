import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/layout/InformationPage";

export const Route = createFileRoute("/faq")({ component: FaqPage });

function FaqPage() {
  return (
    <InformationPage
      eyebrow="Frequently Asked Questions"
      title="Answers for listeners, creators, and partners."
      description="This is the first VYBE help foundation. More detailed account, upload, membership, and partnership guidance will be added as features launch."
      sections={[
        { title: "Can I listen without an account?", body: "Public creator pages and shared public content can be explored without registering where the creator has made them available." },
        { title: "Who can create on VYBE?", body: "VYBE currently centers music creators and is being prepared for filmmakers, directors, video creators, podcasters, and other creative disciplines." },
        { title: "Can businesses join?", body: "Yes. Businesses and creative partners use a separate entry path so the fan experience remains focused on discovery and community." },
        { title: "Where do I get help?", body: "Use the Help Center for product guidance and the Trust, Copyright, or Community Guidelines pages for policy-related questions." },
      ]}
    />
  );
}
