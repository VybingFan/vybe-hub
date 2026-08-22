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
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <Badge className="border-primary/30 bg-primary/10 text-primary"><Sparkles className="mr-2 h-3.5 w-3.5" />Start discovering</Badge>
          <h1 className="mt-6 max-w-5xl text-4xl font-bold tracking-tight md:text-7xl">Choose how you want to experience VYBE.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">VYBE discovery is organized by how supporters experience the work—not by forcing every creator into a music-shaped space. Listen, watch, read, or take part.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button asChild className="bg-gradient-brand"><Link to="/discover/music">Play music now</Link></Button><Button asChild variant="outline"><Link to="/explore" search={{ q: "" }}>Search all available creators</Link></Button></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-2">
          {lanes.map((lane) => <Link key={lane.eyebrow} to={lane.to} className={`group rounded-[2rem] border p-7 transition hover:-translate-y-0.5 ${lane.accent}`}>
            <lane.icon className="h-7 w-7" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[.2em]">{lane.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground md:text-3xl">{lane.title}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{lane.description}</p>
            <div className="mt-7 flex items-center justify-between gap-4 text-sm font-medium"><span>{lane.status}</span><ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" /></div>
          </Link>)}
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Creator focuses</p>
          <h2 className="mt-3 max-w-4xl text-3xl font-semibold md:text-5xl">Different creators. Shared discovery lanes.</h2>
          <p className="mt-5 max-w-3xl leading-7 text-muted-foreground">A creator focus identifies the creator. Listen, Watch, Read, and Experience identify how supporters encounter the work. One creator may appropriately appear in more than one lane.</p>
          <div className="mt-8 flex flex-wrap gap-3">{focuses.map((focus) => <span key={focus} className="rounded-full border border-border bg-background px-4 py-2 text-sm">{focus}</span>)}</div>
        </div>
      </section>
    </main>
    <Footer />
  </div>;
}
