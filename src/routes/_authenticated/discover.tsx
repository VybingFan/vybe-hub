import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { EmptyState } from "@/components/common/EmptyState";

export const Route = createFileRoute("/_authenticated/discover")({
  component: DiscoverPage,
});

function DiscoverPage() {
  return (
    <RoleGuard allow={["supporter", "creator", "admin"]}>
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Discover</h1>
          <p className="mt-1 text-sm text-muted-foreground">Find and support new artists.</p>
        </header>
        <EmptyState
          icon={<Heart className="h-5 w-5" />}
          title="Nothing to show yet"
          description="Discovery feed is coming next."
        />
      </div>
    </RoleGuard>
  );
}
