import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Building2, Handshake, Megaphone, Sparkles, Target } from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/businessads")({ component: BusinessAdvertisingHub });

export function BusinessAdvertisingHub() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="border-b border-border/60 bg-gradient-hero">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-24">
            <Badge className="border-primary/30 bg-primary/10 text-primary"><Megaphone className="mr-2 h-4 w-4" /> Advertise & Partner with VYBE</Badge>
            <h1 className="mt-6 max-w-5xl text-4xl font-black tracking-tight sm:text-5xl md:text-7xl">
              Reach audiences gathered around creators and entertainment.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              VYBE is building advertising, sponsorship, and partnership opportunities designed to
              support the platform while creating more resources and opportunity around creators.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BusinessCard icon={Target} title="Relevant audiences" body="Reach supporters who intentionally explore creators, entertainment, communities, events, and marketplace activity." />
            <BusinessCard icon={Megaphone} title="Advertising" body="Develop placements and campaigns that fit the VYBE experience rather than interrupt it." />
            <BusinessCard icon={Handshake} title="Sponsorships" body="Support VYBE programming, creator experiences, showcases, and community initiatives." />
            <BusinessCard icon={BarChart3} title="Reporting" body="Build toward responsible campaign measurement and reporting as the business platform matures." />
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/35">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-6 sm:py-20 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <Building2 className="h-8 w-8 text-primary" />
              <h2 className="mt-5 text-3xl font-bold md:text-5xl">Business conversations go through VYBE.</h2>
            </div>
            <div>
              <p className="text-lg leading-8 text-muted-foreground">
                Advertising, platform partnerships, sponsorships, and VYBE marketing opportunities
                are managed through VYBE rather than through individual creator profiles.
              </p>
              <p className="mt-4 leading-7 text-muted-foreground">
                If a business wants to hire or book a particular creator, it can use the creator's
                published professional contact path. VYBE-platform advertising remains a VYBE business relationship.
              </p>
              <Button size="lg" className="mt-7 rounded-full bg-gradient-brand" disabled>
                Business inquiry workflow coming soon
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function BusinessCard({ icon: Icon, title, body }: { icon: typeof Sparkles; title: string; body: string }) {
  return <article className="rounded-3xl border border-border/70 bg-card p-6"><Icon className="h-6 w-6 text-primary" /><h2 className="mt-5 text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-muted-foreground">{body}</p></article>;
}
