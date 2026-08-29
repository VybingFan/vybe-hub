import { createFileRoute, Link } from "@tanstack/react-router";
import { Disc3, Headphones, ListMusic, Radio, ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/experience/listen")({ component: ListenExperience });

const paths = [
  {
    icon: Headphones,
    title: "Discover music",
    body: "Browse published music from creators across VYBE and find the people behind the sound.",
    to: "/discover/music",
    status: "Available now",
  },
  {
    icon: ListMusic,
    title: "Creator playlists",
    body: "Hear playlists creators deliberately organize and share with supporters.",
    to: "/explore",
    status: "Available now",
  },
  {
    icon: Disc3,
    title: "New releases",
    body: "Follow creators so new music and release activity can become easier to find through VYBE.",
    status: "Growing",
  },
  {
    icon: Radio,
    title: "Listening experiences",
    body: "VYBE-hosted listening rooms and live audio experiences can bring creators and supporters together.",
    status: "Planned",
  },
];

function ListenExperience() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="border-b border-border/60 bg-gradient-hero">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20">
            <Badge className="border-cyan-700/30 bg-cyan-100 text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-cyan-200">
              <Headphones className="mr-2 h-3.5 w-3.5" /> Listen
            </Badge>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
              Find the sound that fits your VYBE.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Discover songs, playlists, and independent music across genres. Listen to the work,
              save what matters, and find the creators behind the sound.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full bg-gradient-brand">
              <Link to="/discover/music">Explore Music <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {paths.map(({ icon: Icon, title, body, to, status }) => (
              <article key={title} className="flex flex-col rounded-3xl border border-border/70 bg-card p-5 sm:p-6">
                <Icon className="h-6 w-6 text-primary" />
                <h2 className="mt-5 text-xl font-semibold">{title}</h2>
                <p className="mt-3 flex-1 leading-7 text-muted-foreground">{body}</p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <Badge variant="outline">{status}</Badge>
                  {to ? <a href={to} className="text-sm font-medium text-primary">Open →</a> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
