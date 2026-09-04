import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About VYBE | Creator Discovery & Connection" },
      { name: "description", content: "Learn how VYBE helps supporters discover creators, keep up with their world, find what they missed, and connect across VYBE and the web." },
    ],
    links: [{ rel: "canonical", href: "https://vybewithvybe.com/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="relative overflow-hidden border-b border-border/60 bg-surface/35">
          <div className="bg-gradient-hero absolute inset-0 -z-10 opacity-70" />
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20 lg:py-24">
            <Badge className="rounded-full border border-primary/25 bg-primary/10 text-primary">
              <Sparkles className="mr-2 h-3.5 w-3.5" /> About VYBE
            </Badge>
            <h1 className="mt-6 max-w-5xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Creators are everywhere.<br />
              <span className="text-gradient-brand">VYBE helps bring their world together.</span>
            </h1>
            <p className="mt-6 max-w-4xl text-lg leading-8 text-muted-foreground sm:text-xl">
              VYBE is a creator-centered entertainment discovery and connection platform built to bring creators,
              everything they do, and the people who support them together in one place.
            </p>
            <p className="mt-4 max-w-4xl leading-7 text-muted-foreground">
              It is for creators at every stage—from emerging talent building an audience to established creators
              whose supporters already follow them across many platforms—and for people who want an easier way to
              discover them, keep up with them, and find their way back to the things they care about.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">            <article className="rounded-3xl border border-border/70 bg-card p-7 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">For supporters</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">More than following. A place to come back to.</h2>
              <p className="mt-5 leading-7 text-muted-foreground">
                Discover creators you already love and people you have not found yet. Listen, watch, read, play,
                follow what is happening, revisit what mattered, and explore more of a creator's world without
                depending on a single fast-moving feed.
              </p>
            </article>
            <article className="rounded-3xl border border-border/70 bg-card p-7 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">For creators</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Emerging or established, give your supporters a home base.</h2>
              <p className="mt-5 leading-7 text-muted-foreground">
                Bring together your music, films, performances, writing, releases, updates, appearances, events,
                merchandise, communities, important links, and more. VYBE can help supporters see the bigger picture
                of what you do while you continue creating everywhere you already do.
              </p>
            </article>
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/35">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Built to work with your social world</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">VYBE is not trying to replace social media.</h2>
            </div>            <div className="space-y-4 text-lg leading-8 text-muted-foreground">
              <p>
                Keep your social media, streaming services, website, store, ticketing pages, and the other places
                where you have already built your presence. VYBE is designed to help connect those pieces.
              </p>
              <p>
                Social feeds move quickly, and algorithms influence what people are shown. VYBE gives supporters
                somewhere they can intentionally return to for a creator they care about—and a way to follow the
                paths back out to that creator's social media, website, music, store, tickets, and other destinations.
              </p>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-base leading-7">
                <strong className="text-foreground">Keep creating everywhere. Bring it together on VYBE.</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-surface/45">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Find It Again</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">You remember seeing it. VYBE can help you find your way back.</h2>
              </div>
              <div>
                <p className="text-lg leading-8 text-muted-foreground">
                  As creator posts and organized links grow on VYBE, creators will be able to help supporters find
                  important things they shared around the web. The original post can stay where it belongs; VYBE can
                  help supporters rediscover it and return directly to the source.
                </p>
                <p className="mt-4 leading-7 text-muted-foreground">
                  That makes VYBE useful both when a supporter is trying to remember something and when a creator
                  wants followers to have another way to find an announcement, release, appearance, story, or moment.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
          <div className="rounded-[2rem] border border-primary/20 bg-gradient-brand p-7 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/75">One creator. Many places. One connected world.</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-bold text-primary-foreground md:text-5xl">
              Your creators. Their world. Your VYBE.
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-primary-foreground/80">
              VYBE gives supporters a place to discover, return, connect, and then keep exploring everything their
              creators have going on—on VYBE and beyond.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="rounded-full">
                <Link to="/explore" search={{ q: "" }}>Discover Creators <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <a href="https://creators.vybewithvybe.com">For Creators <ExternalLink className="ml-2 h-4 w-4" /></a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
