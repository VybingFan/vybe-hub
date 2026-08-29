import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BriefcaseBusiness, Heart, Sparkles, Users, WandSparkles } from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/build-with-vybe")({ component: BuildWithVybe });

const paths = [
  {
    icon: WandSparkles,
    eyebrow: "For Creators",
    title: "Build the place supporters come back to.",
    body: "Create a professional VYBE presence, publish your work, organize your creator world, grow supporter continuity, and use creator tools built around entertainment.",
    to: "https://creators.vybewithvybe.com",
    external: true,
    cta: "Explore VYBE for Creators",
  },
  {
    icon: Heart,
    eyebrow: "For Supporters",
    title: "Participation can become creation, too.",
    body: "Supporters already follow, save, play, join communities, and participate. Future supporter creation tools can let fans build creator-centered content and experiences without turning VYBE into another general social feed.",
    to: "/auth/sign-up",
    cta: "Join VYBE",
  },
  {
    icon: BriefcaseBusiness,
    eyebrow: "For Businesses",
    title: "Build opportunity around the ecosystem.",
    body: "Explore the advertising, sponsorship, and partnership direction for businesses that want to reach VYBE audiences and support the creator ecosystem.",
    to: "https://businessads.vybewithvybe.com",
    external: true,
    cta: "Explore Advertising & Partnerships",
  },
];

function BuildWithVybe() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="border-b border-border/60 bg-gradient-hero">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-24">
            <Badge variant="outline" className="rounded-full border-primary/30 px-4 py-1.5 text-primary">
              <Sparkles className="mr-2 h-3.5 w-3.5" /> Build on VYBE
            </Badge>
            <h1 className="mt-6 max-w-5xl text-4xl font-black tracking-tight sm:text-5xl md:text-7xl">
              There is more than one way to build on VYBE.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              Creators build their presence and communities. Supporters participate today and can
              gain more creator-centered creation tools over time. Businesses help fund opportunity
              through advertising, sponsorships, and partnerships.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20">
          <div className="grid gap-5 lg:grid-cols-3">
            {paths.map(({ icon: Icon, eyebrow, title, body, to, cta, external }) => (
              <article key={eyebrow} className="flex flex-col rounded-[2rem] border border-border/70 bg-card p-6 sm:p-8">
                <Icon className="h-7 w-7 text-primary" />
                <p className="mt-6 text-xs font-semibold uppercase tracking-[.18em] text-primary">{eyebrow}</p>
                <h2 className="mt-3 text-2xl font-bold">{title}</h2>
                <p className="mt-4 flex-1 leading-7 text-muted-foreground">{body}</p>
                <Button asChild variant="outline" className="mt-7 rounded-full">
                  {external ? (
                    <a href={to}>{cta} <ArrowRight className="ml-2 h-4 w-4" /></a>
                  ) : (
                    <Link to={to}>{cta} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  )}
                </Button>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/35">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20">
            <Users className="h-7 w-7 text-primary" />
            <h2 className="mt-5 max-w-4xl text-3xl font-bold md:text-5xl">One ecosystem. Different roles. Shared momentum.</h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
              Supporters give the platform life. Creators give people something meaningful to
              discover and support. Businesses help generate revenue and opportunities that can strengthen the creator ecosystem.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
