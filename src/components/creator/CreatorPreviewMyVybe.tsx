import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, CheckCircle2, Eye, Heart, LockKeyhole, MessageCircle, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CREATOR_PLAN_CATALOG, type PublicCreatorPlanCode } from "@/features/membership/catalog";
import type { CreatorProfile } from "@/features/profile/schema";

type AudienceMode = "visitor" | "member" | "follower";
type TrackPreview = { title: string; status?: string | null; visibility?: string | null };
type PlaylistPreview = { title: string; is_published?: boolean | null; show_on_public_profile?: boolean | null; access_mode?: string | null; access_expires_at?: string | null };

type SetupRequirementId = "rules" | "profile" | "music" | "visibility" | "playlist";
type Props = {
  creator: CreatorProfile | null | undefined;
  planCode?: string | null;
  tracks: TrackPreview[];
  playlists: PlaylistPreview[];
  readiness: { isReady: boolean; completedCount: number; totalRequired: number; complete: Record<SetupRequirementId, boolean>; nextRequiredId: SetupRequirementId | null };
};

const publicTiers = CREATOR_PLAN_CATALOG.filter((plan) => plan.code !== "creator_studio");
const audienceLabels: Record<AudienceMode, string> = { visitor: "Public visitor", member: "VYBE member", follower: "Follower" };
const setupRequirements: Record<SetupRequirementId, { label: string; route: string }> = {
  rules: { label: "Creator rules", route: "/creator-compliance" },
  profile: { label: "Profile & images", route: "/profile" },
  music: { label: "First song", route: "/music/upload" },
  visibility: { label: "Content visibility", route: "/music" },
  playlist: { label: "First playlist", route: "/playlists" },
};

function normalizePlan(code?: string | null): PublicCreatorPlanCode {
  if (code === "creator_plus" || code === "creator_pro" || code === "creator_free") return code;
  if (code === "founding_beta") return "creator_pro";
  return "creator_free";
}
export function CreatorPreviewMyVybe({ creator, planCode, tracks, playlists, readiness }: Props) {
  const currentPlan = normalizePlan(planCode);
  const [tier, setTier] = useState<PublicCreatorPlanCode>(currentPlan);
  const [audience, setAudience] = useState<AudienceMode>("visitor");
  const plan = CREATOR_PLAN_CATALOG.find((item) => item.code === tier) ?? CREATOR_PLAN_CATALOG[0];
  const publishedTracks = useMemo(() => tracks.filter((track) => track.status === "published" && (!track.visibility || track.visibility === "public")).slice(0, 3), [tracks]);
  const publishedPlaylists = useMemo(() => playlists.filter((playlist) => playlist.is_published && playlist.access_mode === "public" && playlist.show_on_public_profile === true && (!playlist.access_expires_at || new Date(playlist.access_expires_at).getTime() > Date.now())).slice(0, 2), [playlists]);

  return <section id="preview-my-vybe" className={`rounded-3xl border bg-card p-5 sm:p-6 ${readiness.isReady ? "border-primary/25" : "border-amber-400/40 ring-1 ring-amber-400/15"}`}>
    {!readiness.isReady ? <div className="mb-5 rounded-2xl border border-amber-400/35 bg-amber-400/10 p-4 shadow-[0_0_28px_rgba(251,191,36,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60 motion-reduce:animate-none"/><span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400"/></span><div><p className="font-semibold text-amber-200">Not discoverable to supporters yet</p><p className="mt-1 text-sm text-muted-foreground">Your setup is {readiness.completedCount} of {readiness.totalRequired} essentials complete.</p></div></div><Badge variant="outline" className="border-amber-400/40 text-amber-200">Action needed</Badge></div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Look at the supporter preview below exactly as it stands now. Missing images, identity details, music, or playlists will look incomplete here too. That is intentional: this preview shows what still needs attention before discovery opens.</p>
      <div className="mt-4 flex flex-wrap gap-2">{(Object.keys(setupRequirements) as SetupRequirementId[]).map((id) => <span key={id} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${readiness.complete[id] ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-amber-400/30 bg-background/45 text-amber-100"}`}>{readiness.complete[id] ? <CheckCircle2 className="h-3.5 w-3.5"/> : <span className="h-2 w-2 rounded-full bg-amber-400"/>}{setupRequirements[id].label}</span>)}</div>
      <div className="mt-4 flex flex-wrap gap-2">{readiness.nextRequiredId ? <Button asChild size="sm" className="bg-amber-500 text-black hover:bg-amber-400"><Link to={setupRequirements[readiness.nextRequiredId].route as any}>Fix next requirement</Link></Button> : null}<Button asChild size="sm" variant="outline"><Link to="/settings">Open VYBE Guide</Link></Button></div>
    </div> : null}
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Preview My VYBE</p><h2 className="mt-2 text-2xl font-semibold">{readiness.isReady ? "See your creator presence before supporters do" : "This is what supporters would see right now"}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">This is a safe preview. It does not change your membership, create follows, save content, send comments, make purchases, or record listener activity.</p></div><Badge className={readiness.isReady ? "" : "animate-pulse bg-amber-500 text-black motion-reduce:animate-none"}>{readiness.isReady ? "Discovery ready" : "Not discoverable"}</Badge></div>
    <div className="mt-5 grid gap-4 lg:grid-cols-2"><Selector title="Membership preview" helper={`Current account: ${CREATOR_PLAN_CATALOG.find((item)=>item.code===currentPlan)?.name ?? "Creator Free"}`} buttons={publicTiers.map((item)=>({key:item.code,label:item.name,active:tier===item.code,onClick:()=>setTier(item.code)}))}/><Selector title="Supporter view" helper="What this viewer can do" buttons={(Object.keys(audienceLabels) as AudienceMode[]).map((item)=>({key:item,label:audienceLabels[item],active:audience===item,onClick:()=>setAudience(item)}))}/></div>
    <PreviewSurface creator={creator} tier={tier} planName={plan.name} audience={audience} tracks={publishedTracks} playlists={publishedPlaylists}/>
  </section>;
}
function Selector({ title, helper, buttons }: { title: string; helper: string; buttons: { key: string; label: string; active: boolean; onClick: () => void }[] }) {
  return <div className="rounded-2xl border border-border bg-background/50 p-4"><p className="font-semibold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{helper}</p><div className="mt-3 flex flex-wrap gap-2">{buttons.map((button)=><Button key={button.key} type="button" size="sm" variant={button.active ? "default" : "outline"} onClick={button.onClick}>{button.label}</Button>)}</div></div>;
}

function PreviewSurface({ creator, tier, planName, audience, tracks, playlists }: { creator: CreatorProfile | null | undefined; tier: PublicCreatorPlanCode; planName: string; audience: AudienceMode; tracks: TrackPreview[]; playlists: PlaylistPreview[] }) {
  const isMember = audience !== "visitor";
  const isFollower = audience === "follower";
  const free = tier === "creator_free";
  const plus = tier === "creator_plus";
  const cover = creator?.cover_url || creator?.profile_background_url;
  const avatar = creator?.avatar_url;
  const displayName = creator?.artist_name || creator?.display_name || "Your creator name";
  const genre = creator?.genres?.[0] || creator?.genre || "Creator focus";
  return <div key={`${tier}-${audience}`} className="vybe-preview-swap mt-5 overflow-hidden rounded-3xl border border-border bg-background/40">
    <div className={`relative overflow-hidden bg-muted ${free ? "h-24" : plus ? "h-36" : "h-44"}`}>{cover ? <img src={cover} alt="" className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Your cover image</div>}<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"/><div className="absolute left-4 top-4 flex flex-wrap gap-2"><Badge className="bg-background/85 text-foreground backdrop-blur">{planName}</Badge><Badge variant="outline" className="border-white/40 bg-black/30 text-white backdrop-blur">Viewing as: {audienceLabels[audience]}</Badge></div></div>
    {!free ? <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3 text-xs"><Badge variant="outline">Home</Badge><Badge variant="outline">Work</Badge><Badge variant="outline">Stories</Badge>{plus ? <Badge variant="outline">EPK Lite</Badge> : <Badge variant="outline">EPK</Badge>}<Badge variant="outline">Merch</Badge>{tier === "creator_pro" ? <Badge variant="outline">Updates</Badge> : null}</div> : null}
    <div className="p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="flex items-center gap-4">{avatar ? <img src={avatar} alt={displayName} className="h-20 w-20 rounded-2xl border-2 border-background object-cover"/> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-background bg-muted text-xl font-semibold">{displayName.slice(0,2).toUpperCase()}</div>}<div><h3 className="text-2xl font-semibold">{displayName}</h3><p className="text-sm text-muted-foreground">@{creator?.username || "yourname"} · {genre}</p><p className="mt-2 text-xs text-muted-foreground">{free ? "Compact creator profile" : plus ? "Website-style creator showcase" : "Professional creator website"}</p></div></div><Button size="sm" variant={isFollower ? "secondary" : "default"}>{isFollower ? "Following" : isMember ? "Follow creator" : "Sign in to follow"}</Button></div>
    <div className="mt-6 grid gap-3 md:grid-cols-3">{tracks.length ? tracks.map((track,index)=><PreviewItem key={`${track.title}-${index}`} title={track.title} detail={track.visibility === "private" ? "Private" : "Published work"} available={track.visibility !== "private" || isFollower}/>) : <PreviewItem title="Your first published work" detail="Published work appears here" available={false}/>} {playlists.slice(0, free ? 1 : 2).map((playlist,index)=><PreviewItem key={`${playlist.title}-${index}`} title={playlist.title} detail="Published playlist" available />)}</div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><Action icon={<Heart className="h-4 w-4"/>} label="Heart" available={isMember}/><Action icon={<Bookmark className="h-4 w-4"/>} label="Save" available={isMember}/><Action icon={<MessageCircle className="h-4 w-4"/>} label="Comment" available={isMember}/></div>
    </div>
  </div>;
}
function PreviewItem({ title, detail, available }: { title: string; detail: string; available: boolean }) {
  return <div className={`rounded-2xl border p-4 ${available ? "border-primary/25 bg-primary/5" : "border-border bg-background/50"}`}><div className="flex items-center justify-between gap-3">{available ? <PlayCircle className="h-6 w-6 text-primary"/> : <LockKeyhole className="h-5 w-5 text-muted-foreground"/>}<Badge variant="outline">{available ? "Visible" : "Preview only"}</Badge></div><p className="mt-4 font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>;
}

function Action({ icon, label, available }: { icon: React.ReactNode; label: string; available: boolean }) {
  return <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${available ? "border-emerald-400/25 bg-emerald-400/5" : "border-border bg-background/50 text-muted-foreground"}`}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">{icon}</span><span className="font-medium">{label}</span>{available ? <Eye className="ml-auto h-4 w-4 text-emerald-400"/> : <LockKeyhole className="ml-auto h-4 w-4"/>}</div>;
}
