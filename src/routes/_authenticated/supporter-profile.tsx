import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, LockKeyhole, Settings2, Sparkles } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/_authenticated/supporter-profile")({
  component: () => <RoleGuard allow={["supporter", "creator", "business", "admin"]}><SupporterProfile /></RoleGuard>,
});

function SupporterProfile() {
  const { user } = useUser();
  const name = String(user?.user_metadata?.display_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "VYBE supporter");
  return <div className="mx-auto max-w-5xl space-y-6">
    <WorkspacePageHeader eyebrow="Supporter account" title={name} description="Your private home for discovery preferences, saved music, followed creators, communities, and account controls." />
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardContent className="p-5"><Sparkles className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">Discovery interests</h2><p className="mt-2 text-sm text-muted-foreground">Choose genres and experiences that help VYBE guide your discovery.</p><Button asChild className="mt-4 w-full"><Link to="/supporter-interests">Tune interests</Link></Button></CardContent></Card>
      <Card><CardContent className="p-5"><Heart className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">My VYBE</h2><p className="mt-2 text-sm text-muted-foreground">Return to hearted songs, private lists, and followed creators.</p><Button asChild variant="outline" className="mt-4 w-full"><Link to="/my-vybe">Open My VYBE</Link></Button></CardContent></Card>
      <Card><CardContent className="p-5"><Settings2 className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">Account settings</h2><p className="mt-2 text-sm text-muted-foreground">Manage your name, membership, notifications, security, and privacy.</p><Button asChild variant="outline" className="mt-4 w-full"><Link to="/settings">Open settings</Link></Button></CardContent></Card>
    </div>
    <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>Your saved music and interests are private. Public activity is only shown when a VYBE feature clearly tells you it will be shared.</p></div>
  </div>;
}
