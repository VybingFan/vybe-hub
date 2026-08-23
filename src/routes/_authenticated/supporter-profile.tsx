import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Loader2, LockKeyhole, MapPin, Pencil, Settings2, Sparkles } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ErrorState } from "@/components/common/ErrorState";
import { SupporterProfileForm } from "@/components/supporter/SupporterProfileForm";
import { SupporterProfileView } from "@/components/supporter/SupporterProfileView";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import type { SupporterProfileInput } from "@/features/supporter/schema";
import { useSupporterProfile, useSaveSupporterProfile } from "@/hooks/useSupporterProfile";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/_authenticated/supporter-profile")({
  component: SupporterProfilePage,
});

function SupporterProfilePage() {
  return <RoleGuard allow={["supporter", "creator", "business", "admin"]}><SupporterProfileWorkspace /></RoleGuard>;
}

function SupporterProfileWorkspace() {
  const { user, isLoading: isUserLoading } = useUser();
  const { data: profile, isLoading, error, refetch } = useSupporterProfile(user?.id);
  const save = useSaveSupporterProfile(user?.id);
  const [editingRequested, setEditingRequested] = useState(false);

  if (isUserLoading || !user || isLoading) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (error) return <ErrorState title="Couldn't load your supporter profile" message={(error as Error).message} onRetry={() => void refetch()} />;

  const isEditing = editingRequested || !profile;
  const handleSave = async (values: SupporterProfileInput) => {
    await save.mutateAsync(values);
    setEditingRequested(false);
  };

  if (isEditing) {
    return <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <WorkspacePageHeader eyebrow="Supporter profile" title={profile ? "Edit your supporter identity" : "Create your supporter identity"} description="Choose how you appear when you follow creators, join conversations, save experiences, and participate across VYBE." />
      <SupporterProfileForm initial={profile ?? null} userId={user.id} onSubmit={handleSave} onCancel={() => setEditingRequested(false)} submitting={save.isPending} />
    </div>;
  }

  const name = profile.display_name || user?.email?.split("@")[0] || "VYBE supporter";
  return <div className="mx-auto max-w-5xl space-y-6 pb-12">
    <WorkspacePageHeader eyebrow="Supporter account" title="Your supporter profile" description="Review and change the identity connected to your supporter activity." status={<Button onClick={() => setEditingRequested(true)}><Pencil className="mr-2 h-4 w-4" />Edit profile</Button>} />

    <Card className="overflow-hidden border-primary/20"><CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
      <Avatar className="h-24 w-24 rounded-3xl border shadow-elevated"><AvatarImage src={profile.avatar_url || undefined} alt={`${name} supporter profile`} /><AvatarFallback className="rounded-3xl bg-gradient-brand text-xl text-white">{name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
      <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Your supporter identity</p><h1 className="mt-1 text-3xl font-semibold">{name}</h1><p className="mt-1 text-sm font-medium text-primary">@{profile.username}</p>{profile.location ? <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{profile.location}</p> : null}</div>
    </CardContent></Card>

    <SupporterProfileView profile={profile} />

    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardContent className="p-5"><Sparkles className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">Discovery interests</h2><p className="mt-2 text-sm text-muted-foreground">Adjust the interests that help guide your discovery.</p><Button asChild variant="outline" className="mt-4 w-full"><Link to="/supporter-interests">Tune interests</Link></Button></CardContent></Card>
      <Card><CardContent className="p-5"><Heart className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">My VYBE</h2><p className="mt-2 text-sm text-muted-foreground">Return to your saved experiences and followed creators.</p><Button asChild variant="outline" className="mt-4 w-full"><Link to="/my-vybe">Open My VYBE</Link></Button></CardContent></Card>
      <Card><CardContent className="p-5"><Settings2 className="h-5 w-5 text-primary" /><h2 className="mt-4 font-semibold">Account settings</h2><p className="mt-2 text-sm text-muted-foreground">Manage membership, notifications, security, and privacy.</p><Button asChild variant="outline" className="mt-4 w-full"><Link to="/settings">Open settings</Link></Button></CardContent></Card>
    </div>
    <div className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p>Your saved music and interests remain private. VYBE only displays activity publicly when a feature clearly tells you it will be shared.</p></div>
  </div>;
}
