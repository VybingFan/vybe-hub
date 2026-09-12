import { CheckCircle2, Globe2, Headphones, LockKeyhole, PlayCircle, ShoppingBag, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CreatorPlanCatalogEntry, PublicCreatorPlanCode } from "@/features/membership/catalog";

export function NovaMembershipVisualPreview({ tier, plan }: { tier: PublicCreatorPlanCode; plan: CreatorPlanCatalogEntry }) {
  const free = tier === "creator_free";
  const plus = tier === "creator_plus";
  const pro = tier === "creator_pro";
  return (
    <div key={tier} className="overflow-hidden rounded-3xl border border-border bg-card" style={{ animation: "novaDemoReveal .35s ease-out both" }}>
      <div className={`relative overflow-hidden ${free ? "h-24" : plus ? "h-40" : "h-44"}`}>
        <img src="/images/demo/nova-vale/cover-v2.webp" alt="" className="h-full w-full object-cover object-[center_38%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
        {plus ? <Badge className="absolute right-4 top-4 bg-background/80 text-foreground backdrop-blur">Website-style creator showcase</Badge> : null}
        {pro ? <Badge className="absolute right-4 top-4 bg-background/80 text-foreground backdrop-blur">Professional creator website</Badge> : null}
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4"><img src="/images/demo/nova-vale/profile-v2.webp" alt="Nova Vale" className="h-20 w-20 rounded-2xl border-2 border-background object-cover"/><div><h3 className="text-2xl font-semibold">Nova Vale</h3><p className="text-sm text-muted-foreground">@novavale · Country Soul</p><Badge className="mt-2" variant="outline">{plan.name}</Badge></div></div>
          <div className="text-sm text-muted-foreground">{free ? "Compact creator profile" : plus ? "Website-style creator showcase" : "Full professional creator website"}</div>
        </div>

        {free ? <FreePreview plan={plan} /> : null}
        {plus ? <PlusPreview plan={plan} /> : null}
        {pro ? <ProPreview plan={plan} /> : null}
      </div>
    </div>
  );
}
function FreePreview({ plan }: { plan: CreatorPlanCatalogEntry }) {
  return <div className="mt-6 space-y-4"><div className="rounded-2xl border border-border bg-background/50 p-4"><p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Creator Free public profile</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Identity first. A simple public profile highlights only a few selected items instead of looking like a website.</p></div><div className="grid gap-3 sm:grid-cols-3">{["Rise Together", "Start Here playlist", "Creator story"].map((item, index)=><div key={item} className="rounded-2xl border border-border bg-background/50 p-4"><div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">{index === 0 ? <Headphones className="h-4 w-4"/> : index === 1 ? <PlayCircle className="h-4 w-4"/> : <Sparkles className="h-4 w-4"/>}</div><p className="font-medium">{item}</p><p className="mt-1 text-xs text-muted-foreground">Featured public item {index + 1} of {plan.limits.featuredPublicItems}</p></div>)}</div><LockedStrip text="Creator Free stays intentionally compact: no website navigation and no full website-style layout." /></div>;
}

function PlusPreview({ plan }: { plan: CreatorPlanCatalogEntry }) {
  return <div className="mt-6 space-y-4">
    <div className="flex flex-wrap gap-2 border-b border-border pb-4 text-sm"><Badge>Home</Badge><Badge variant="outline">Music</Badge><Badge variant="outline">Stories</Badge><Badge variant="outline">EPK Lite</Badge><Badge variant="outline">Merch</Badge></div>
    <div className="grid gap-4 md:grid-cols-[1.15fr_.85fr]"><div className="space-y-3"><div className="rounded-2xl border border-border bg-background/50 p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Featured creator showcase</p><div className="mt-3 flex items-center gap-3"><img src="/images/demo/nova-vale/profile-v2.webp" alt="" className="h-14 w-14 rounded-xl object-cover"/><div><p className="font-semibold">Nova's Top 5</p><p className="text-sm text-muted-foreground">Selected catalog, stories, and media</p></div><PlayCircle className="ml-auto h-7 w-7 text-primary"/></div></div><div className="grid gap-3 sm:grid-cols-2"><ShowcaseCard icon={<Sparkles className="h-4 w-4"/>} title="EPK Lite" copy="Biography, links, Top 5, and selected media in one polished destination."/><ShowcaseCard icon={<ShoppingBag className="h-4 w-4"/>} title="Expanded merch" copy={`${plan.limits.merchItems} showcase items support a richer public experience.`}/></div></div><aside className="rounded-2xl border border-primary/25 bg-primary/5 p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Creator Plus</p><p className="mt-3 text-lg font-semibold">A website-style creator showcase</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Plus should already feel like a creator destination: banner, identity, navigation-style sections, selected catalog, stories, EPK Lite, merch, and public links.</p><div className="mt-4 text-sm text-muted-foreground">Up to {plan.limits.featuredPublicItems} featured public items · {plan.limits.publicLinks} public links</div></aside></div>
    <LockedStrip text="Pro expands this website-style presence into the fuller professional creator website with deeper access controls, Full EPK, larger limits, and professional workflow tools." />
  </div>;
}
function ProPreview({ plan }: { plan: CreatorPlanCatalogEntry }) {
  return <div className="mt-6 space-y-4">
    <div className="flex flex-wrap gap-2 border-b border-border pb-4 text-sm"><Badge>Home</Badge><Badge variant="outline">Music</Badge><Badge variant="outline">Stories</Badge><Badge variant="outline">Watch</Badge><Badge variant="outline">EPK</Badge><Badge variant="outline">Merch</Badge><Badge variant="outline">Updates</Badge></div>
    <div className="grid gap-4 md:grid-cols-[1.2fr_.8fr]"><div className="space-y-3"><div className="rounded-2xl border border-border bg-background/50 p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Featured release</p><div className="mt-3 flex items-center gap-3"><img src="/images/demo/nova-vale/profile-v2.webp" alt="" className="h-14 w-14 rounded-xl object-cover"/><div><p className="font-semibold">Rise Together</p><p className="text-sm text-muted-foreground">Lead release · full public song</p></div><PlayCircle className="ml-auto h-7 w-7 text-primary"/></div></div><div className="grid gap-3 sm:grid-cols-2"><ShowcaseCard icon={<Sparkles className="h-4 w-4"/>} title="Full EPK" copy="Private sharing, export, and viewer analytics foundations."/><ShowcaseCard icon={<CheckCircle2 className="h-4 w-4"/>} title="Professional access" copy="Approved listeners, sign-in controls, revocation, and reporting."/><ShowcaseCard icon={<Globe2 className="h-4 w-4"/>} title="Expanded public website" copy={`${plan.limits.publicLinks} public links and ${plan.limits.featuredPublicItems} featured public items.`}/><ShowcaseCard icon={<Headphones className="h-4 w-4"/>} title="Professional catalog scale" copy={`${plan.limits.publishedSongs} published songs and ${plan.limits.playlists} playlists.`}/></div></div><aside className="rounded-2xl border border-primary/25 bg-primary/5 p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Creator Pro</p><p className="mt-3 text-lg font-semibold">A fuller professional creator website</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Pro builds on the Plus website-style showcase with deeper navigation, stronger professional presentation, Full EPK, advanced access controls, more content capacity, and longer analytics history.</p><div className="mt-4 text-sm text-muted-foreground">{plan.analytics}</div></aside></div>
  </div>;
}

function ShowcaseCard({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return <div className="rounded-2xl border border-border bg-background/50 p-4"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div><p className="mt-3 font-semibold">{title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p></div>;
}

function LockedStrip({ text }: { text: string }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0"/><span>{text}</span></div>;
}
