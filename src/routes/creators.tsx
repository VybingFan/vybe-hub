import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Briefcase, CheckCircle2, Music2, Sparkles, Users, WandSparkles } from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/creators")({ component: CreatorAudienceHub });

const benefits = [
  "Give supporters one place to find your work, updates, What's Happening, community, and links.",
  "Use creator tools to organize music, playlists, media, merch, stories, and your public presence.",
  "Understand supporter activity through Creator Insights as analytics continue to grow.",
  "Build direct continuity with followers instead of relying on one social feed to reach them again.",
];

export function CreatorAudienceHub() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="border-b border-border/60 bg-gradient-hero">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-24">
            <Badge className="border-primary/30 bg-primary/10 text-primary"><WandSparkles className="mr-2 h-4 w-4" /> VYBE for Creators</Badge>
            <h1 className="mt-6 max-w-5xl text-4xl font-black tracking-tight sm:text-5xl md:text-7xl">
              Give supporters somewhere to come back to.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              VYBE helps entertainment creators bring their work, updates, community, supporter
              relationships, and professional tools together without asking social media to do every job.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full bg-gradient-brand"><Link to="/creator-memberships">Compare Creator Memberships <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="rounded-full"><Link to="/creator/sign-in">Creator Sign In</Link></Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20">
          <div className="grid gap-4 lg:grid-cols-2">
            {benefits.map((benefit) => <p key={benefit} className="flex gap-3 rounded-3xl border border-border/70 bg-card p-5 leading-7 text-muted-foreground"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />{benefit}</p>)}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CreatorCard icon={Music2} title="Create & publish" body="Build your creator presence and organize the work supporters come to experience." />
            <CreatorCard icon={Users} title="Grow continuity" body="Give followers a reliable place to keep up, catch up, and return." />
            <CreatorCard icon={BarChart3} title="Understand activity" body="Use Creator Insights to learn how supporters are engaging with your work." />
            <CreatorCard icon={Briefcase} title="Present professionally" body="Use profiles, EPK/Industry Kit tools, commerce, and focus-specific creator features." />
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/35">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20">
            <p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Creator Focuses</p>
            <h2 className="mt-3 text-3xl font-bold md:text-5xl">One creator ecosystem. Different ways to create.</h2>
            <p className="mt-5 max-w-3xl leading-7 text-muted-foreground">
              Music is the strongest working foundation today. VYBE is expanding focus-specific experiences for film and video, writers and poets, actors, comedians, theater and performance, and other entertainment creators.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function CreatorCard({ icon: Icon, title, body }: { icon: typeof Sparkles; title: string; body: string }) {
  return <article className="rounded-3xl border border-border/70 bg-card p-6"><Icon className="h-6 w-6 text-primary" /><h2 className="mt-5 text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-muted-foreground">{body}</p></article>;
}
