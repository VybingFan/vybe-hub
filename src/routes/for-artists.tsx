import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Headphones, Link2, ListMusic, MessageCircle, Upload } from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/for-artists")({ component: ForArtists });

const steps = [
  {
    icon: Upload,
    title: "Bring your music",
    body: "Upload releases, demos, live cuts, or a hand-picked set for a specific moment.",
  },
  {
    icon: ListMusic,
    title: "Shape the playlist",
    body: "Choose the songs and context—tour warm-up, inspirations, fan favorites, a mood, or what comes next.",
  },
  {
    icon: Link2,
    title: "Send one direct link",
    body: "Fans arrive at your listening page and can play the complete sequence without hunting across services.",
  },
];

function ForArtists() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">
              Your music. Your people.
            </p>
            <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-7xl">
              Give every share a place to <span className="text-gradient-brand">belong.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              VYBE gives independent artists a direct path from a song to a relationship—playlist
              links, stories, community, events, and support in one artist-led home.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-brand text-primary-foreground">
                <Link to="/auth/sign-up">
                  Join the artist pilot <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth/sign-in">Artist sign in</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-[2rem] border border-primary/20 bg-card/75 p-8 shadow-elevated">
            <Headphones className="h-12 w-12 text-primary" />
            <h2 className="mt-8 text-3xl font-semibold">
              The first test: shareable listening rooms
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Create a playlist, send the link to partner fans, and learn what makes them listen,
              connect, and return.
            </p>
            <div className="mt-8 rounded-2xl border border-border bg-background/60 p-5">
              <MessageCircle className="h-5 w-5 text-genre-pop" />
              <p className="mt-3 font-medium">Built with artists and followers</p>
              <p className="mt-2 text-sm text-muted-foreground">
                This pilot is deliberately focused. Feedback from real members determines what gets
                deeper next.
              </p>
            </div>
          </div>
        </section>
        <section className="border-y border-border bg-surface/50">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <h2 className="text-3xl font-semibold md:text-5xl">
              From your library to their headphones.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {steps.map((step, i) => (
                <article key={step.title} className="rounded-3xl border border-border bg-card p-7">
                  <step.icon className="h-7 w-7 text-primary" />
                  <p className="mt-7 text-xs text-muted-foreground">0{i + 1}</p>
                  <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
