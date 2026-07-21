import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, CalendarDays, Handshake, MapPin } from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/for-businesses")({ component: ForBusinesses });

function ForBusinesses() {
  const cards = [
    {
      icon: MapPin,
      title: "Be part of the local scene",
      body: "Help members discover the venues, shops, studios, restaurants, and spaces that make music communities possible.",
    },
    {
      icon: CalendarDays,
      title: "Create real-world moments",
      body: "Connect showcases, listening events, pop-ups, and community programs to the artists and members they serve.",
    },
    {
      icon: Handshake,
      title: "Partner with purpose",
      body: "Support artists and member experiences with transparent, relevant partnerships—not disruptive advertising.",
    },
  ];
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="max-w-4xl">
            <Building2 className="h-12 w-12 text-genre-country" />
            <p className="mt-7 text-sm font-semibold uppercase tracking-[.2em] text-genre-country">
              For businesses and community partners
            </p>
            <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-7xl">
              Show up where music becomes <span className="text-gradient-brand">community.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              VYBE creates a focused entry point for businesses that want to contribute to local
              culture, artist growth, and meaningful member experiences.
            </p>
            <Button asChild size="lg" className="mt-8 bg-gradient-brand text-primary-foreground">
              <Link to="/auth/sign-up">
                Join the partner pilot <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
        <section className="border-y border-border bg-surface/50">
          <div className="mx-auto grid max-w-7xl gap-4 px-6 py-20 md:grid-cols-3">
            {cards.map(({ icon: Icon, title, body }) => (
              <article key={title} className="rounded-3xl border border-border bg-card p-7">
                <Icon className="h-7 w-7 text-genre-country" />
                <h2 className="mt-7 text-xl font-semibold">{title}</h2>
                <p className="mt-3 leading-7 text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-[2rem] border border-primary/20 bg-card p-8 md:p-12">
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">
              Pilot principle
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              Partners listen before the platform scales.
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
              Early business and artist partners will test the experience with their own audiences.
              Their feedback—and the behavior of the members they invite—will shape profiles,
              events, offers, and collaboration tools.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
