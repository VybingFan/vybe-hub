import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, Copyright,
  HeartHandshake, Music2, ShieldCheck, Sparkles, Users, WandSparkles
} from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/build-with-vybe")({ component: BuildWithVybe });

const creatorPoints = [
  "Build a professional creator home",
  "Share music, stories, playlists and more",
  "Grow direct relationships with supporters",
  "Use Creator Studio to manage your VYBE presence",
];

const businessPoints = [
  "Explore campaigns, sponsorships and placements",
  "Create offers and partnership opportunities",
  "Work with VYBE creators and communities",
  "Use the Business Portal for professional requests",
];

function BuildWithVybe() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="pointer-events-none absolute left-1/4 top-0 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
            <Badge variant="outline" className="rounded-full border-primary/30 px-4 py-1.5 text-primary">
              <Sparkles className="mr-2 h-3.5 w-3.5" /> Build With VYBE
            </Badge>
            <div className="mt-7 max-w-4xl">
              <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                Create. Grow. Partner.
                <span className="block text-primary">Build your place in VYBE.</span>
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
                VYBE is built around creators, powered by community, and strengthened by businesses and partners
                who create meaningful opportunities. Creators can compare Free, Plus, and Pro before creating an account.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-brand text-primary-foreground shadow-glow">
                <Link to="/creator-memberships">Compare Creator Memberships <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/for-businesses">Explore Business & Partnerships</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-6 lg:grid-cols-[1.18fr_.82fr]">
            <article className="relative overflow-hidden rounded-[2rem] border border-primary/25 bg-card p-8 md:p-10">
              <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Music2 className="h-7 w-7" />
                </div>
                <p className="mt-7 text-sm font-semibold uppercase tracking-[.2em] text-primary">For Creators</p>
                <h2 className="mt-3 text-4xl font-bold tracking-tight">Your work deserves a professional home.</h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                  Creator Studio gives creators a dedicated place to build their presence while remaining part of
                  the same VYBE community their supporters enjoy.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {creatorPoints.map((point) => <Point key={point}>{point}</Point>)}
                </div>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Button asChild><Link to="/creator-memberships">Compare Memberships</Link></Button>
                  <Button asChild variant="outline"><Link to="/creator/sign-in">Creator Sign In</Link></Button>
                  <Button asChild variant="ghost"><Link to="/for-artists">Explore Creator Tools <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-border/70 bg-card p-8 md:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-foreground">
                <BriefcaseBusiness className="h-7 w-7" />
              </div>
              <p className="mt-7 text-sm font-semibold uppercase tracking-[.2em] text-muted-foreground">Businesses & Partners</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Create opportunities inside the ecosystem.</h2>
              <p className="mt-5 leading-7 text-muted-foreground">
                Brands, businesses, venues, sponsors and partners can work with VYBE through a dedicated professional path.
              </p>
              <div className="mt-7 grid gap-3">
                {businessPoints.map((point) => <Point key={point}>{point}</Point>)}
              </div>
              <Button asChild variant="outline" className="mt-8 w-full">
                <Link to="/for-businesses">Business & Partnership Information <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </article>
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/45">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">One ecosystem. Different roles.</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
                Everyone has a place in the VYBE.
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Supporters give the community life. Creators give people something meaningful to discover and support.
                Businesses and partners help create opportunities that can move the ecosystem forward.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <RoleCard icon={Users} title="Supporters" body="Discover, participate, follow, create, share and support the people and experiences you care about." />
              <RoleCard icon={WandSparkles} title="Creators" body="Build a professional presence, connect directly with your audience and grow within a creator-first environment." />
              <RoleCard icon={Building2} title="Businesses & Partners" body="Develop campaigns, partnerships, sponsorships and offers that create value across the VYBE ecosystem." />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Build responsibly</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">Know the rules. Protect the work.</h2>
              <p className="mt-5 leading-7 text-muted-foreground">
                Creators need professional guidance, and supporters increasingly need guidance too as playlists,
                uploads, videos and community participation grow across VYBE.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Resource to="/trust" icon={ShieldCheck} title="Trust & Safety" body="Understand safe participation, reporting and platform expectations." />
              <Resource to="/copyright" icon={Copyright} title="Copyright & Content Use" body="Understand ownership, permissions, uploads and responsible use of creator material." />
              <Resource to="/community-guidelines" icon={HeartHandshake} title="Community Guidelines" body="Know what healthy participation looks like across VYBE." />
              <Resource to="/help" icon={CheckCircle2} title="Help Center" body="Find guidance as VYBE tools and participation options continue to grow." />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-8 md:p-12">
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Ready to build?</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight md:text-5xl">
              Your professional VYBE starts here.
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/creator-memberships">View Creator Memberships</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/for-businesses">Work With VYBE</Link></Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Point({ children }: { children: React.ReactNode }) {
  return <p className="flex gap-2 text-sm text-muted-foreground"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{children}</p>;
}
function RoleCard({ icon: Icon, title, body }: { icon: typeof Users; title: string; body: string }) {
  return <article className="rounded-3xl border border-border/70 bg-card p-7"><Icon className="h-6 w-6 text-primary" /><h3 className="mt-5 text-xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-muted-foreground">{body}</p></article>;
}
function Resource({ to, icon: Icon, title, body }: { to: string; icon: typeof Users; title: string; body: string }) {
  return <Link to={to} className="rounded-2xl border border-border/70 bg-card p-6 transition hover:border-primary/40"><Icon className="h-5 w-5 text-primary" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></Link>;
}
