import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { SavedMusicLists } from "@/components/engagement/SavedMusicLists";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";

export const Route = createFileRoute("/_authenticated/my-vybe")({ component: MyVybePage });

function MyVybePage() {
  return (
    <RoleGuard allow={["supporter", "creator", "business", "admin"]}>
      <div className="mx-auto max-w-6xl space-y-6">
        <WorkspacePageHeader eyebrow="My VYBE" title="Keep what moves you close." description="Return to music you hearted or saved while discovering VYBE creators." />
        <SavedMusicLists />
      </div>
    </RoleGuard>
  );
}
