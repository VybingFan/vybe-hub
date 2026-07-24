import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/layout/InformationPage";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  return (
    <InformationPage
      eyebrow="Privacy"
      title="VYBE Privacy Policy"
      description="The full production privacy policy will explain what data VYBE collects, why it is used, how it is protected, and what choices users have."
      sections={[
        { title: "Account data", body: "Information used to create, secure, and operate creator, fan, business, and administrator accounts." },
        { title: "Content and activity", body: "Uploads, profiles, playlists, follows, playback activity, connections, and community interactions." },
        { title: "Service providers", body: "Infrastructure and payment providers receive only the information required to operate their services." },
        { title: "User choices", body: "Users will receive clear controls for profile visibility, communication preferences, account access, and eligible data requests." },
      ]}
    />
  );
}
