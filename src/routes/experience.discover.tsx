import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpenText, Clapperboard, Headphones, Radio, Sparkles } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/experience/discover")({ component: DiscoveryHub });

const lanes = [
  {
    icon: Headphones,
    eyebrow: "Listen",
    title: "Music, audio, podcasts, and spoken word",
    description: "Play published music now, then move through genres, creator playlists, scenes, moods, and the people behind the sound.",
    to: "/discover/music",
    status: "Music available now",
    accent: "border-cyan-400/30 bg-cyan-400/5 text-cyan-300",
  },
  {
    icon: Clapperboard,
    eyebrow: "Watch",
    title: "Film, video, acting, theater, comedy, and dance",
    description: "Explore how trailers, scenes, performances, visual stories, and behind-the-scenes work can live beside creator identity.",
    to: "/experience/watch",
    status: "Video foundation growing",
    accent: "border-rose-400/30 bg-rose-400/5 text-rose-300",
  },
  {
    icon: BookOpenText,
    eyebrow: "Read",
    title: "Writing, poetry, lyrics, stories, and creator context",
    description: "Discover words as creative work and read the stories, credits, ideas, and experiences behind every kind of creator.",
    to: "/experience/read",
    status: "Experience preview",
    accent: "border-amber-400/30 bg-amber-400/5 text-amber-300",
  },
  {
    icon: Radio,
    eyebrow: "Experience",
    title: "Events, communities, premieres, games, and participation",
    description: "Move beyond passive viewing through creator-led events, conversations, listening rooms, challenges, and shared moments.",
    to: "/experience/events",
    status: "Demonstrations available",
    accent: "border-lime-400/30 bg-lime-400/5 text-lime-300",
  },
] as const;

const focuses = ["Music", "Film & video", "Actors & performers", "Theater", "Comedy", "Podcasts", "Writers & poets", "Dance", "Visual art"];

function DiscoveryHub() {
  return <div className="min-h-screen bg-background">
    <MarketingNav />
    <main>
      <section className="border-b border-border/60 bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-16 md:py-24">
          <Badge className="border-primary/30 bg-primary/10 text-primary"><Sparkles className="mr-2 h-3.5 w-3.5" />Start discovering</Badge>
          <h1 className="mt-4 max-w-5xl text-3xl font-bold tracking-tight sm:mt-6 sm:text-4xl md:text-7xl">Choose how you want to experience VYBE.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">VYBE discovery is organized by how supporters experience the work—not by forcing every creator into a music-shaped space. Listen, watch, read, or take part.</p>
          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap"><Button asChild className="w-full bg-gradient-brand sm:w-auto"><Link to="/discover/music">Play music now</Link></Button><Button asChild variant="outline" className="w-full sm:w-auto"><Link to="/explore" search={{ q: "" }}>Search all available creators</Link></Button></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-16">
        <div className="grid gap-3 sm:gap-5 md:grid-cols-2">
          {lanes.map((lane) => <Link key={lane.eyebrow} to={lane.to} className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:rounded-[2rem] sm:p-7 ${lane.accent}`}>
            <lane.icon className="h-6 w-6 sm:h-7 sm:w-7" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[.2em] sm:mt-6">{lane.eyebrow}</p>
            <h2 className="mt-1.5 text-xl font-semibold leading-7 text-foreground sm:mt-2 sm:text-2xl md:text-3xl">{lane.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:mt-3 sm:text-base sm:leading-7">{lane.description}</p>
            <div className="mt-4 flex items-center justify-between gap-3 text-xs font-medium sm:mt-7 sm:gap-4 sm:text-sm"><span>{lane.status}</span><ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1 sm:h-5 sm:w-5" /></div>
          </Link>)}
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Creator focuses</p>
          <h2 className="mt-2 max-w-4xl text-2xl font-semibold sm:mt-3 sm:text-3xl md:text-5xl">Different creators. Shared discovery lanes.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:mt-5 sm:text-base sm:leading-7">A creator focus identifies the creator. Listen, Watch, Read, and Experience identify how supporters encounter the work. One creator may appropriately appear in more than one lane.</p>
          <div className="mt-5 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">{focuses.map((focus) => <span key={focus} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">{focus}</span>)}</div>
        </div>
      </section>
    </main>
    <Footer />
  </div>;
}
