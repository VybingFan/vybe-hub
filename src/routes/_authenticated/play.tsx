import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { PlayExperience } from "@/features/play/PlayExperience";

export const Route = createFileRoute("/_authenticated/play")({ component: PlayPage });

function PlayPage() {
  return (
    <RoleGuard allow={["supporter", "creator", "admin"]}>
      <PlayExperience isMember />
    </RoleGuard>
  );
}
