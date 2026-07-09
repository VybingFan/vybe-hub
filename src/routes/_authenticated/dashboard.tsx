import { createFileRoute } from "@tanstack/react-router";
import { Music2 } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { EmptyState } from "@/components/common/EmptyState";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <RoleGuard allow={["creator", "admin"]}>
      <DashboardContent />
    </RoleGuard>
  );
}

function DashboardContent() {
  const { profile } = useUser();
  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <header>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
          {profile?.display_name || "Creator"} Studio
        </h1>
      </header>
      <EmptyState
        icon={<Music2 className="h-5 w-5" />}
        title="Your studio is ready"
        description="Dashboard features will land here soon."
      />
    </div>
  );
}
