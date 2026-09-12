import { Bookmark, CheckCircle2, Heart, LockKeyhole, MessageCircle, PlayCircle, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type NovaSupporterPreviewMode = "visitor" | "member" | "follower";

const modeLabels: Record<NovaSupporterPreviewMode, string> = {
  visitor: "Public visitor",
  member: "Free VYBE member",
  follower: "Nova follower",
};

export function NovaSupporterVisualPreview({ mode }: { mode: NovaSupporterPreviewMode }) {
  const member = mode !== "visitor";
  const follower = mode === "follower";
  return (
    <div key={mode} className="overflow-hidden rounded-3xl border border-border bg-card" style={{ animation: "novaDemoReveal .35s ease-out both" }}>
      <div className="relative h-40 overflow-hidden sm:h-52">
        <img src="/images/demo/nova-vale/cover-v2.webp" alt="" className="h-full w-full object-cover object-[center_38%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2"><Badge className="bg-primary text-primary-foreground">Creator Pro demo</Badge><Badge className="bg-background/85 text-foreground backdrop-blur">Website-style creator profile</Badge></div>
        <Badge className="absolute bottom-4 right-4 bg-background/85 text-foreground backdrop-blur">Viewing as: {modeLabels[mode]}</Badge>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4"><img src="/images/demo/nova-vale/profile-v2.webp" alt="Nova Vale" className="h-20 w-20 rounded-2xl border-2 border-background object-cover"/><div><h3 className="text-2xl font-semibold">Nova Vale</h3><p className="text-sm text-muted-foreground">Country Soul · @novavale</p><p className="mt-1 text-xs text-muted-foreground">Shown here as a Creator Pro demo account so supporter states are demonstrated inside the full creator-website experience.</p></div></div>
          {mode === "visitor" ? <Button size="sm"><UserPlus className="mr-2 h-4 w-4"/>Create account to follow</Button> : <Button size="sm" variant={follower ? "secondary" : "default"}><Heart className={`mr-2 h-4 w-4 ${follower ? "fill-current" : ""}`}/>{follower ? "Following Nova" : "Follow Nova"}</Button>}
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-b border-border pb-4 text-sm"><Badge>Home</Badge><Badge variant="outline">Music</Badge><Badge variant="outline">Stories</Badge><Badge variant="outline">EPK</Badge><Badge variant="outline">Merch</Badge><Badge variant="outline">Updates</Badge></div>
        <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Featured release</p><div className="mt-3 flex items-center gap-3"><img src="/images/demo/nova-vale/profile-v2.webp" alt="" className="h-14 w-14 rounded-xl object-cover"/><div><p className="font-semibold">Rise Together</p><p className="text-sm text-muted-foreground">Lead release · full public song</p></div><PlayCircle className="ml-auto h-7 w-7 text-primary"/></div></div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ReleaseCard title="Rise Together" detail="Public full song" available />
          <ReleaseCard title="TRE2" detail="Free VYBE member release" available={member} lockedCopy="Sign in free to listen" />
          <ReleaseCard title="Lemme Fix It" detail="Follower release" available={follower} lockedCopy={member ? "Follow Nova to listen" : "Sign in, then follow Nova"} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ActionState icon={<Heart className="h-4 w-4"/>} label="Heart music" available={member} />
          <ActionState icon={<Bookmark className="h-4 w-4"/>} label="Save playlists" available={member} />
          <ActionState icon={<MessageCircle className="h-4 w-4"/>} label="Comment" available={member} />
        </div>
        {follower ? <div className="mt-4 rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/5 p-4"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-fuchsia-300"/><p className="font-semibold">Follower-only listening room unlocked</p></div><p className="mt-2 text-sm text-muted-foreground">Nova After Dark and other follower releases now appear inside the same Creator Pro website-style profile.</p></div> : null}
      </div>
    </div>
  );
}

function ReleaseCard({ title, detail, available, lockedCopy }: { title: string; detail: string; available: boolean; lockedCopy?: string }) {
  return <div className={`rounded-2xl border p-4 ${available ? "border-primary/25 bg-primary/5" : "border-border bg-background/50"}`}><div className="flex items-center justify-between gap-3">{available ? <PlayCircle className="h-6 w-6 text-primary"/> : <LockKeyhole className="h-5 w-5 text-muted-foreground"/>}<Badge variant="outline">{available ? "Playable" : "Locked"}</Badge></div><p className="mt-4 font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p>{!available ? <p className="mt-3 text-xs font-medium text-primary">{lockedCopy}</p> : null}</div>;
}

function ActionState({ icon, label, available }: { icon: React.ReactNode; label: string; available: boolean }) {
  return <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${available ? "border-emerald-400/25 bg-emerald-400/5" : "border-border bg-background/50 text-muted-foreground"}`}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">{icon}</span><span className="font-medium">{label}</span>{available ? <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400"/> : <LockKeyhole className="ml-auto h-4 w-4"/>}</div>;
}
