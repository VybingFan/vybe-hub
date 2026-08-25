import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  BookOpenText,
  BriefcaseBusiness,
  CalendarDays,
  Clapperboard,
  Headphones,
  Heart,
  MessageCircle,
  Music2,
  Play,
  ShoppingBag,
  Sparkles,
  Users,
  WandSparkles,
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
    to: "/explore",
    status: "Available now",
    image: "/images/supporter-cards/discover.webp",
  },
  {
    icon: MessageCircle,
    title: "Join the conversation",
    body: "Preview how creator-led conversations and communities can grow around the music.",
    to: "/experience/communities",
    status: "Experience preview",
    image: "/images/supporter-cards/community.webp",
  },
  {
    icon: CalendarDays,
    title: "Show up together",
    body: "Preview listening parties, local showcases, drops, and member events.",
    to: "/experience/events",
    status: "Experience preview",
    image: "/images/supporter-cards/events.webp",
  },
];

const audiencePaths = [
  {
    icon: Heart,
    eyebrow: "For Supporters",
    title: "Find creators worth returning to.",
    body: "Listen, watch, read, discover, follow, save, connect, and take part as VYBE's community grows.",
    to: "/auth/sign-up",
    cta: "Create a free supporter account",
    image: "/images/landing-paths/supporters.webp",
  },
  {
    icon: WandSparkles,
    eyebrow: "For Creators",
    title: "Give your work one professional home.",
    body: "Share your work, organize your creator presence, understand your audience, and build direct supporter relationships.",
    to: "/build-with-vybe",
    cta: "Explore creator paths",
    image: "/images/landing-paths/creators.webp",
  },
  {
    icon: BriefcaseBusiness,
    eyebrow: "For Businesses & Partners",
    title: "Create opportunities around the work.",
    body: "Explore partnerships, campaigns, venues, sponsorships, and responsible ways to work with VYBE and its creators.",
    to: "/for-businesses",
    cta: "Explore business opportunities",
    image: "/images/landing-paths/business-partners.webp",
  },
];

const creatorPaths = [
  { icon: Music2, title: "Music Creators", body: "Songs, playlists, stories, merch, sharing, and audience insights.", to: "/for-artists", status: "Available now", image: "/images/supporter-cards/discover.webp" },
  { icon: Clapperboard, title: "Film & Video Creators", body: "Trailers, clips, project media, reviews, screenings, and visual storytelling.", to: "/for-film-video", status: "Foundation growing", image: "/images/experience-cards/short-films.webp" },
  { icon: BookOpenText, title: "Writers & Poets", body: "Poetry, lyrics, stories, readings, written releases, and creator discovery.", to: "/for-writers-poets", status: "Experience preview", image: "/images/experience-cards/poetry.webp" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="bg-gradient-hero absolute inset-0 -z-20" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-background via-background/35 to-transparent" />
          <div className="mx-auto grid max-w-7xl items-center gap-9 px-5 py-10 sm:gap-12 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
            <div>
              <Badge className="mb-6 rounded-full border border-primary/25 bg-primary/10 text-primary">
                <Sparkles className="mr-2 h-3.5 w-3.5" /> A creator-first entertainment community
              </Badge>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl md:text-7xl">
                Where creators and supporters <span className="text-gradient-brand">connect.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Discover independent music, film, video, writing, stories, and the people behind
                them. VYBE gives creators a professional home and supporters a meaningful way to
                find, follow, and connect.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-brand text-primary-foreground shadow-glow sm:w-auto"
                >
                  <Link to="/explore" search={{ q: "" }}>
                    Explore VYBE <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full bg-background/40 backdrop-blur sm:w-auto"
                >
                  <Link to="/experience/discover">
                    <Play className="mr-2 h-4 w-4" /> Start discovering
                  </Link>
                </Button>
              </div>
              <div className="mt-7 flex flex-col gap-3 text-sm text-muted-foreground sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-7">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> People behind the work
                </span>
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-genre-pop" /> Support that feels personal
                </span>
              </div>
            </div>

            <div className="relative min-h-[360px] sm:min-h-[470px]">
              <img
                src="/images/editorial/member-experience-hero.webp"
                alt="VYBE members discovering individual artists, events, playlists, community and merch"
                className="h-[360px] w-full rounded-[1.5rem] object-cover shadow-elevated sm:h-[470px] sm:rounded-[2rem]"
              />
              <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-t from-background/90 via-transparent to-transparent sm:rounded-[2rem]" />
              <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-border bg-card/95 p-4 shadow-elevated backdrop-blur-xl sm:inset-x-5 sm:bottom-5 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-genre-country">
                      Supporter discovery
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">Find your next VYBE.</h2>
                  </div>
                  <Link
                    to="/explore"
                    search={{ q: "" }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background shadow-md transition hover:scale-105"
                    aria-label="Explore creators on VYBE"
                  >
                    <Play className="ml-0.5 h-5 w-5 fill-current" />
                  </Link>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/70 pt-4 text-sm">
                  <Link to="/explore" search={{ q: "" }} className="font-medium text-primary hover:underline">
                    Explore real creators
                  </Link>
                  <Link to="/auth/sign-up" className="text-muted-foreground hover:text-foreground hover:underline">
                    Create a free supporter account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">One VYBE. Different reasons to belong.</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Know where you fit from the first visit.</h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">Supporters discover and participate. Creators build and grow. Businesses and partners help create responsible opportunities.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 lg:grid-cols-3">
            {audiencePaths.map((path) => (
              <Link key={path.eyebrow} to={path.to} className="group flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card transition hover:-translate-y-0.5 hover:border-primary/40">
                <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-border/60">
                  <img src={path.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/65 via-transparent to-black/15" />
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6 lg:p-7">
                  <path.icon className="h-6 w-6 text-primary" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[.18em] text-primary sm:mt-5">{path.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-semibold sm:mt-3 sm:text-2xl">{path.title}</h3>
                  <p className="mt-2 flex-1 leading-6 text-muted-foreground sm:mt-3 sm:leading-7">{path.body}</p>
                  <p className="mt-4 flex items-center gap-2 text-sm font-medium text-primary sm:mt-6">{path.cta}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/35">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-20">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Built beyond one kind of creator</p><h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Entertainment lives in more than one format.</h2></div>
              <p className="max-w-md text-muted-foreground">Music is VYBE's strongest working foundation today. Film, video, writing, poetry, and additional entertainment creator paths continue to grow from it.</p>
            </div>
            <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-3">
              {creatorPaths.map((path) => <Link key={path.title} to={path.to} className="group overflow-hidden rounded-3xl border border-border/70 bg-background/70 transition hover:border-primary/40"><div className="relative aspect-video overflow-hidden border-b border-border/60"><img src={path.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /><div className="absolute inset-0 bg-gradient-to-t from-background/75 via-transparent to-black/15" /></div><div className="p-5 sm:p-7"><path.icon className="h-6 w-6 text-primary" /><h3 className="mt-5 text-xl font-semibold">{path.title}</h3><p className="mt-3 leading-7 text-muted-foreground">{path.body}</p><div className="mt-6 flex items-center justify-between text-xs font-medium text-primary"><span>{path.status}</span><ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div></div></Link>)}
            </div>
          </div>
        </section>

        <section id="discover" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-14 sm:px-6 sm:py-20">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Music discovery starts here
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                Every sound brings a different VYBE.
              </h2>
            </div>
            <p className="max-w-md text-muted-foreground">
              Bright, distinct worlds make discovery feel alive while the VYBE shell stays
              unmistakably ours.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
            {genres.map((genre) => (
              <Link
                key={genre.name}
                to="/explore"
                search={{ q: genre.name }}
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
              </Link>
            ))}
          </div>
        </section>

        <section id="community" className="border-y border-border/60 bg-surface/45">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-genre-electronic">
                More than music
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                Come for the sound. Stay for the people.
              </h2>
            </div>
            <div className="relative mt-8 overflow-hidden rounded-[1.5rem] border border-white/10 sm:mt-10 sm:rounded-[2rem]">
              <img
                src="/images/editorial/connected-members.webp"
                alt="VYBE members of different ages and abilities connecting through independent music"
                className="aspect-[4/3] w-full object-cover sm:aspect-[16/7]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/35 via-transparent to-background/10" />
            </div>
            <div className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-3">
              {connectionCards.map((item, index) => (
                <Link
                  key={item.title}
                  to={item.to}
                  search={item.to === "/explore" ? { q: "" } : undefined}
                  className="group overflow-hidden rounded-3xl border border-border/70 bg-card/75 transition hover:-translate-y-0.5 hover:border-primary/40"
                >
                  <div className="relative aspect-video overflow-hidden border-b border-border/60">
                    <img src={item.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-black/15" />
                  </div>
                  <div className="p-5 sm:p-7">
                    <div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary"><item.icon className="h-5 w-5" /></div><p className="text-xs text-muted-foreground">0{index + 1}</p></div>
                    <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-3 leading-7 text-muted-foreground">{item.body}</p>
                    <div className="mt-5 flex items-center justify-between text-xs font-medium text-primary"><span>{item.status}</span><ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section
          id="stories"
          className="mx-auto grid max-w-7xl scroll-mt-24 items-center gap-7 px-5 py-16 sm:gap-10 sm:px-6 sm:py-24 lg:grid-cols-2"
        >
          <img
            src="/images/editorial/artist-stories.webp"
            alt="Independent artist sharing the story behind a song"
            className="aspect-[3/2] w-full rounded-[1.5rem] object-cover shadow-elevated sm:rounded-[2rem]"
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
              <Link to="/explore" search={{ q: "" }}>
                Discover creators and their stories <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section
          id="merch"
          className="mx-auto grid max-w-7xl scroll-mt-24 items-center gap-7 px-5 pb-16 sm:gap-10 sm:px-6 sm:pb-24 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <img
            src="/images/merch/artist-marketplace-grid.webp"
            alt="Four artist merch collections featuring music, art, fragrance, jewelry, keepsakes and collectibles"
            className="aspect-square w-full rounded-[1.5rem] object-cover shadow-elevated sm:rounded-[2rem]"
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
              <Link to="/shop">
                <ShoppingBag className="mr-2 h-4 w-4" /> Shop creator merch
              </Link>
            </Button>
          </div>
        </section>

        <section id="artists" className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-16 sm:px-6 sm:pb-24">
          <div className="overflow-hidden rounded-[1.5rem] border border-primary/20 bg-gradient-brand p-5 sm:rounded-[2rem] sm:p-8 md:p-12">
            <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-medium text-primary-foreground/75">
                  For creators and the people who believe in them
                </p>
                <h2 className="mt-2 max-w-2xl text-3xl font-bold text-primary-foreground md:text-4xl">
                  One home for your work, your story, and your community.
                </h2>
              </div>
              <Button asChild size="lg" variant="secondary" className="shrink-0 rounded-full">
                <Link to="/build-with-vybe">
                  <WandSparkles className="mr-2 h-4 w-4" /> Build your VYBE
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
