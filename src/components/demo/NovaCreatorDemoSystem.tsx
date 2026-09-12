import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Eye, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CREATOR_PLAN_CATALOG, type PublicCreatorPlanCode } from "@/features/membership/catalog";
import { NovaMembershipVisualPreview } from "@/components/demo/NovaMembershipVisualPreview";
import { NovaSupporterVisualPreview } from "@/components/demo/NovaSupporterVisualPreview";

type SupporterMode = "visitor" | "member" | "follower";
type DemoMode = "build" | "membership" | "supporter" | "finished";

const buildSteps = [
  ["Creator identity", "Create the creator", "Choose creator name, VYBE username, primary focus, category, and the identity supporters will recognize.", "Nova Vale / @novavale / Music / Country Soul", "A recognizable creator identity in discovery and shared links."],
  ["Membership", "Choose the starting membership", "See what Creator Free provides first, then compare Plus and Pro before deciding whether more tools are useful.", "Start with a membership that matches the amount of work Nova is ready to publish.", "Only the public presence and features included with that tier."],
  ["Profile", "Build the public introduction", "Add profile image, banner, short biography, discovery tags, location, and creator story.", "Nova adds her portraits, Country Soul positioning, biography, and discovery tags.", "A complete introduction instead of an unfinished profile."],
  ["Work", "Publish the first creative work", "Upload authorized work, add credits, choose public/private access, and select a strong lead item.", "Rise Together becomes Nova's public lead song.", "A playable reason to discover Nova and stay on the page."],
  ["Organization", "Create paths through the work", "Use playlists, stories, credits, EPK material, and collections to make the creator world understandable.", "Nova builds Start Here, origin stories, poetry, and EPK material.", "A guided experience instead of isolated uploads."],
  ["Return", "Give supporters a reason to return", "Add follower releases, events, community, merch, and updates as the membership and creator plan allow.", "Nova adds a follower listening room, event examples, and merch concepts.", "Clear reasons to follow, save, participate, and come back."],
  ["Discovery ready", "Review before discovery", "Preview the creator page by membership and supporter state, correct anything confusing, then make the creator discoverable.", "Nova checks Free, Plus, Pro and Visitor, Member, Follower views.", "A deliberate public VYBE that matches the creator's settings."],
] as const;

const supporterCards: Record<SupporterMode, Array<[string, string, boolean]>> = {
  visitor: [["Rise Together", "Public song", true], ["TRE2", "Member release", false], ["Lemme Fix It", "Follower release", false], ["Save / comment", "Free account required", false]],
  member: [["Rise Together", "Public song", true], ["TRE2", "Member release", true], ["Lemme Fix It", "Follower release", false], ["Save / comment", "Available", true]],
  follower: [["Rise Together", "Public song", true], ["TRE2", "Member release", true], ["Lemme Fix It", "Follower release", true], ["Save / comment", "Available", true]],
};const supporterCopy: Record<SupporterMode, string> = {
  visitor: "Listen and explore. Create a free VYBE account only when you want to follow, save, comment, or join something.",
  member: "You can use member releases and participation tools. Follow Nova to unlock anything she intentionally shares with followers.",
  follower: "You see the free-member experience plus Nova's follower-only releases and follower spaces. Paid or invited access stays separate.",
};

export function NovaCreatorDemoSystem({ onSupporterModeChange }: { onSupporterModeChange?: (mode: SupporterMode) => void }) {
  const [mode, setMode] = useState<DemoMode>("build");
  const [step, setStep] = useState(0);
  const [tier, setTier] = useState<PublicCreatorPlanCode>("creator_free");
  const [supporterMode, setSupporterMode] = useState<SupporterMode>("visitor");
  const activeStep = buildSteps[step];
  const activePlan = useMemo(() => CREATOR_PLAN_CATALOG.find((plan) => plan.code === tier) ?? CREATOR_PLAN_CATALOG[0], [tier]);

  const changeSupporterMode = (next: SupporterMode) => {
    setSupporterMode(next);
    onSupporterModeChange?.(next);
  };

  return (
    <section id="nova-demo-system" className="border-y border-primary/20 bg-primary/5">
      <style>{`@keyframes novaDemoReveal { from { opacity: 0; transform: translateY(10px) scale(.995); } to { opacity: 1; transform: translateY(0) scale(1); } } @media (prefers-reduced-motion: reduce) { #nova-demo-system * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } }`}</style>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Interactive creator demo</p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Build Nova. Preview the membership. Experience the supporter view.</h2>
            <p className="mt-3 leading-7 text-muted-foreground">Use one guided system to understand how a creator becomes discovery-ready, what Free, Plus, and Pro change, and what supporters actually experience.</p>
          </div>
          <Badge variant="outline" className="w-fit">Studio preview stays unavailable until Studio is complete</Badge>
        </div>        <div className="mt-7 grid gap-3 md:grid-cols-4">
          {([
            ["build", "1. Build Nova", "Walk through creator setup"],
            ["membership", "2. Membership preview", "Compare Free, Plus, Pro"],
            ["supporter", "3. Supporter view", "Visitor, Member, Follower"],
            ["finished", "4. Finished VYBE", "Explore Nova's full page"],
          ] as const).map(([id, title, copy]) => (
            <button key={id} type="button" onClick={() => setMode(id)} className={`rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${mode === id ? "border-primary/60 bg-primary/10" : "border-border bg-card hover:border-primary/30"}`}>
              <p className="font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{copy}</p>
            </button>
          ))}
        </div>

        <div key={mode} style={{ animation: "novaDemoReveal .35s ease-out both" }}>
          {mode === "build" ? <BuildPanel step={step} setStep={setStep} activeStep={activeStep} /> : null}
          {mode === "membership" ? <MembershipPanel tier={tier} setTier={setTier} plan={activePlan} /> : null}
          {mode === "supporter" ? <SupporterPanel mode={supporterMode} onChange={changeSupporterMode} /> : null}
          {mode === "finished" ? <FinishedPanel /> : null}
        </div>
      </div>
    </section>
  );
}

function BuildPanel({ step, setStep, activeStep }: { step: number; setStep: (step: number) => void; activeStep: (typeof buildSteps)[number] }) {
  const progress = ((step + 1) / buildSteps.length) * 100;
  return <div className="mt-7 grid gap-5 lg:grid-cols-[.72fr_1.28fr]">
    <div className="space-y-2">{buildSteps.map((item, index) => <button key={item[0]} type="button" onClick={() => setStep(index)} className={`w-full rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 ${step === index ? "border-primary/60 bg-primary/10" : "border-border bg-card"}`}><p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">Step {index + 1}</p><p className="mt-1 font-semibold">{item[1]}</p></button>)}</div>    <div className="rounded-3xl border border-primary/25 bg-card p-6 md:p-8">
      <div className="mb-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} /></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">{activeStep[0]}</p><h3 className="mt-2 text-2xl font-semibold">{activeStep[1]}</h3></div><Badge variant="outline">Step {step + 1} of {buildSteps.length}</Badge></div>
      <p className="mt-4 leading-7 text-muted-foreground">{activeStep[2]}</p>
      <div key={step} className="mt-6 grid gap-4 sm:grid-cols-2" style={{ animation: "novaDemoReveal .3s ease-out both" }}>
        <div className="rounded-2xl border border-border bg-background/50 p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Nova does</p><p className="mt-2 text-sm leading-6">{activeStep[3]}</p></div>
        <div className="rounded-2xl border border-border bg-background/50 p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-cyan-300">Supporters eventually see</p><p className="mt-2 text-sm leading-6">{activeStep[4]}</p></div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3"><Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>Previous</Button><Button type="button" onClick={() => setStep(Math.min(buildSteps.length - 1, step + 1))}>{step === buildSteps.length - 1 ? "Discovery ready" : "Next step"}<ArrowRight className="ml-2 h-4 w-4" /></Button></div>
    </div>
  </div>;
}

function MembershipPanel({ tier, setTier, plan }: { tier: PublicCreatorPlanCode; setTier: (tier: PublicCreatorPlanCode) => void; plan: (typeof CREATOR_PLAN_CATALOG)[number] }) {
  const tiers = CREATOR_PLAN_CATALOG.filter((item) => item.code !== "creator_studio");
  return <div className="mt-7 space-y-5">
    <div className="flex flex-wrap gap-2">{tiers.map((item) => <Button key={item.code} type="button" variant={tier === item.code ? "default" : "outline"} onClick={() => setTier(item.code)} className="transition duration-200 hover:-translate-y-0.5">{item.name}</Button>)}<Button type="button" variant="outline" disabled>Creator Studio - later</Button></div>
    <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><NovaMembershipVisualPreview tier={tier} plan={plan}/><aside key={tier} className="rounded-3xl border border-primary/25 bg-card p-6" style={{ animation: "novaDemoReveal .35s ease-out both" }}>
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">What changes at this tier</p><h3 className="mt-2 text-2xl font-semibold">{plan.name}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{plan.audience}</p>
      <div className="mt-5 space-y-3 text-sm"><p><span className="font-semibold">Public presence:</span> {plan.publicPresence.replaceAll("_", " ")}</p><p><span className="font-semibold">Published songs:</span> {plan.limits.publishedSongs}</p><p><span className="font-semibold">Playlists:</span> {plan.limits.playlists}</p><p><span className="font-semibold">Merch showcase:</span> {plan.limits.merchItems}</p><p><span className="font-semibold">Analytics:</span> {plan.analytics}</p></div>
      <div className="mt-5 rounded-2xl border border-border bg-background/50 p-4 text-sm leading-6 text-muted-foreground">This preview now changes the public layout itself so creators can feel the difference between a compact profile, enhanced showcase, and full creator website.</div>
    </aside></div>
  </div>;
}function SupporterPanel({ mode, onChange }: { mode: SupporterMode; onChange: (mode: SupporterMode) => void }) {
  return <div className="mt-7 space-y-5">
    <div className="flex flex-wrap gap-2">{(["visitor", "member", "follower"] as const).map((item) => <Button key={item} type="button" variant={mode === item ? "default" : "outline"} onClick={() => onChange(item)} className="transition duration-200 hover:-translate-y-0.5">{item === "visitor" ? "Public visitor" : item === "member" ? "Free VYBE member" : "Nova follower"}</Button>)}</div>
    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <NovaSupporterVisualPreview mode={mode} />
      <aside key={`${mode}-guide`} className="rounded-3xl border border-primary/25 bg-card p-6" style={{ animation: "novaDemoReveal .3s ease-out both" }}>
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">What changed?</p>
        <h3 className="mt-2 text-2xl font-semibold">{mode === "visitor" ? "Explore first" : mode === "member" ? "Participate free" : "Follow the creator"}</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{supporterCopy[mode]}</p>
        <div className="mt-5 space-y-2">{supporterCards[mode].map(([title, detail, available]) => <div key={title} className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm">{available ? <CheckCircle2 className="h-4 w-4 text-emerald-400"/> : <LockKeyhole className="h-4 w-4 text-muted-foreground"/>}<div><p className="font-medium">{title}</p><p className="text-xs text-muted-foreground">{detail}</p></div></div>)}</div>
      </aside>
    </div>
  </div>;
}

function FinishedPanel() {
  return <div className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
    <div className="overflow-hidden rounded-3xl border border-border bg-card transition duration-300 hover:-translate-y-1"><img src="/images/demo/nova-vale/cover-v2.webp" alt="Nova Vale" className="h-52 w-full object-cover object-[center_38%] transition duration-500 hover:scale-[1.02]"/><div className="p-6"><div className="flex items-center gap-4"><img src="/images/demo/nova-vale/profile-v2.webp" alt="Nova Vale" className="h-20 w-20 rounded-2xl object-cover"/><div><h3 className="text-2xl font-semibold">Nova Vale</h3><p className="text-sm text-muted-foreground">Country Soul · Americana · Blues-rooted storytelling</p></div></div><p className="mt-5 leading-7 text-muted-foreground">Now move through Nova's completed public experience: music, playlists, stories, poetry, video, EPK, merch, events, and community examples.</p><Button asChild className="mt-5"><a href="#tour">Explore the finished Nova VYBE<ArrowRight className="ml-2 h-4 w-4"/></a></Button></div></div>
    <aside className="rounded-3xl border border-primary/25 bg-card p-6 transition duration-300 hover:-translate-y-1"><Sparkles className="h-7 w-7 text-primary"/><h3 className="mt-4 text-xl font-semibold">The point of the demo</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Nova is the teaching model. Real creators should eventually get this same preview system populated with their own profile and content once they are sufficiently set up to become discoverable.</p><div className="mt-5 rounded-2xl border border-border bg-background/50 p-4 text-sm"><Eye className="mb-2 h-5 w-5 text-cyan-300"/>Future creator tool: <span className="font-semibold">Preview My VYBE</span> with Membership and Audience selectors.</div></aside>
  </div>;
}
