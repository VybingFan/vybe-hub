import { Navigate, createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/_authenticated/activity")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <Navigate to="/creator-analytics" replace />
    </RoleGuard>
  ),
});
