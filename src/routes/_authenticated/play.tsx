import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { CreatorBrowseGuard } from "@/components/membership/CreatorBrowseGuard";
import { PlayExperience } from "@/features/play/PlayExperience";

export const Route = createFileRoute("/_authenticated/play")({ component: PlayPage });

function PlayPage() {
  return (
    <RoleGuard allow={["supporter", "creator", "business", "admin"]}>
      <CreatorBrowseGuard>
      <PlayExperience isMember />
      </CreatorBrowseGuard>
    </RoleGuard>
  );
}
