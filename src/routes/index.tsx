import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  CalendarDays,
  Headphones,
  Heart,
  MessageCircle,
  Music2,
  Play,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({ component: Landing });

const genres = [
  { name: "Rock", image: "/images/discover/rock.webp", color: "var(--genre-rock)" },
  { name: "Country", image: "/images/discover/country.webp", color: "var(--genre-country)" },
  { name: "Pop", image: "/images/discover/pop.webp", color: "var(--genre-pop)" },
  {
    name: "Electronic",
    image: "/images/discover/electronic.webp",
    color: "var(--genre-electronic)",
  },
  { name: "Gospel & Soul", image: "/images/discover/gospel-soul.webp", color: "var(--genre-soul)" },
  { name: "Jazz & Lo-fi", image: "/images/discover/jazz-lofi.webp", color: "var(--genre-jazz)" },
];

const connectionCards = [
  {
    icon: Headphones,
    title: "Discover your next favorite",
    body: "Follow sounds, scenes, and people—not an algorithmic mold.",
  },
  {
    icon: MessageCircle,
    title: "Join the conversation",
    body: "React, comment, share stories, and belong to the moments around the music.",
  },
  {
    icon: CalendarDays,
    title: "Show up together",
    body: "Find listening parties, local showcases, drops, and member-only events.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="bg-gradient-hero absolute inset-0 -z-20" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-background via-background/35 to-transparent" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
            <div>
              <Badge className="mb-6 rounded-full border border-primary/25 bg-primary/10 text-primary">
                <Sparkles className="mr-2 h-3.5 w-3.5" /> Built around the members
              </Badge>
              <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl">
                Where music becomes <span className="text-gradient-brand">community.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                Discover independent music, get closer to the stories behind it, and build lasting
                connections with artists and fellow supporters.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-brand text-primary-foreground shadow-glow"
                >
                  <Link to="/auth/sign-up">
                    Join the community <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full bg-background/40 backdrop-blur"
                >
                  <a href="#discover">
                    <Play className="mr-2 h-4 w-4" /> Start discovering
                  </a>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap gap-7 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> People, not profiles
                </span>
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-genre-pop" /> Support that feels personal
                </span>
              </div>
            </div>

            <div className="relative min-h-[470px]">
              <img
                src="/images/editorial/member-experience-hero.webp"
                alt="VYBE members discovering individual artists, events, playlists, community and merch"
                className="h-[470px] w-full rounded-[2rem] object-cover shadow-elevated"
              />
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-background/90 via-transparent to-transparent" />
              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 rounded-2xl border border-white/10 bg-background/65 p-5 backdrop-blur-xl">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-genre-country">
                    Your music world
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Discover. Connect. Belong.</h2>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-background">
                  <Play className="ml-0.5 h-5 w-5 fill-current" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="discover" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Explore your way
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                Every genre brings a different VYBE.
              </h2>
            </div>
            <p className="max-w-md text-muted-foreground">
              Bright, distinct worlds make discovery feel alive while the VYBE shell stays
              unmistakably ours.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {genres.map((genre) => (
              <a
                key={genre.name}
                href="/auth/sign-up"
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-card content-glow"
                style={{ "--card-glow": genre.color } as CSSProperties}
              >
                <img
                  src={genre.image}
                  alt={`${genre.name} music`}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
                  <h3 className="font-semibold text-white">{genre.name}</h3>
                  <ArrowRight className="h-4 w-4 text-white/75 transition group-hover:translate-x-1" />
                </div>
              </a>
            ))}
          </div>
        </section>

        <section id="community" className="border-y border-border/60 bg-surface/45">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-genre-electronic">
                More than music
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                Come for the sound. Stay for the people.
              </h2>
            </div>
            <div className="relative mt-10 overflow-hidden rounded-[2rem] border border-white/10">
              <img
                src="/images/editorial/connected-members.webp"
                alt="VYBE members of different ages and abilities connecting through independent music"
                className="aspect-[16/7] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/35 via-transparent to-background/10" />
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {connectionCards.map((item, index) => (
                <article
                  key={item.title}
                  className="rounded-3xl border border-border/70 bg-card/75 p-7"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-7 text-xs text-muted-foreground">0{index + 1}</p>
                  <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="stories"
          className="mx-auto grid max-w-7xl scroll-mt-24 items-center gap-10 px-6 py-24 lg:grid-cols-2"
        >
          <img
            src="/images/editorial/artist-stories.webp"
            alt="Independent artist sharing the story behind a song"
            className="aspect-[3/2] w-full rounded-[2rem] object-cover shadow-elevated"
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-genre-pop">
              Behind the music
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              Hear the story. Meet the person.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Lyrics, credits, creative notes, conversations, and the moments that turned an idea
              into a song.
            </p>
            <Button asChild variant="outline" size="lg" className="mt-7 rounded-full">
              <Link to="/auth/sign-up">
                Explore artist stories <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section
          id="merch"
          className="mx-auto grid max-w-7xl scroll-mt-24 items-center gap-10 px-6 pb-24 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <img
            src="/images/merch/artist-marketplace-grid.webp"
            alt="Four artist merch collections featuring music, art, fragrance, jewelry, keepsakes and collectibles"
            className="aspect-square w-full rounded-[2rem] object-cover shadow-elevated"
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-genre-country">
              More than a T-shirt
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              Every artist has something only they can create.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Explore music, art, collectibles, handmade objects, accessories, keepsakes, limited
              drops, and unexpected pieces that carry an artist's story into your world.
            </p>
            <Button asChild size="lg" className="mt-7 rounded-full bg-gradient-brand">
              <Link to="/auth/sign-up">
                <ShoppingBag className="mr-2 h-4 w-4" /> Explore artist merch
              </Link>
            </Button>
          </div>
        </section>

        <section id="artists" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-24">
          <div className="overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-brand p-8 md:p-12">
            <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-medium text-primary-foreground/75">
                  For artists and the people who believe in them
                </p>
                <h2 className="mt-2 max-w-2xl text-3xl font-bold text-primary-foreground md:text-4xl">
                  One home for your music, your story, and your community.
                </h2>
              </div>
              <Button asChild size="lg" variant="secondary" className="shrink-0 rounded-full">
                <Link to="/auth/sign-up">
                  <Music2 className="mr-2 h-4 w-4" /> Create your VYBE
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
