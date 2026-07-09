import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { EmptyState } from "@/components/common/EmptyState";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Platform-wide moderation and controls.</p>
        </header>
        <EmptyState
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Admin tools coming soon"
          description="Only administrators can see this area."
        />
      </div>
    </RoleGuard>
  );
}
