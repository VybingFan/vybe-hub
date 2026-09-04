import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenText,
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
} from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreatorAudienceHub } from "@/routes/creators";
import { BusinessAdvertisingHub } from "@/routes/businessads";

export const Route = createFileRoute("/")({
  loader: ({ serverContext }: any) => ({ publicSiteIdentity: serverContext?.publicSiteIdentity ?? "supporters" }),
  head: ({ loaderData }) => {
    const identity = loaderData?.publicSiteIdentity ?? "supporters";
    const canonical = identity === "creators"
      ? "https://creators.vybewithvybe.com/"
      : identity === "business"
        ? "https://businessads.vybewithvybe.com/"
        : "https://vybewithvybe.com/";
    const name = identity === "creators" ? "VYBE for Creators" : identity === "business" ? "VYBE for Businesses" : "VYBE";
    const description = identity === "creators"
      ? "A creator home for bringing work, updates and important links together and keeping supporters connected."
      : identity === "business"
        ? "Business, advertising, partnership and promotional opportunities across VYBE."
        : "An entertainment discovery and connection platform for creators and the people who support them.";
    return {
      links: [{ rel: "canonical", href: canonical }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name,
          url: canonical,
          description,
          publisher: { "@type": "Organization", name: "VYBE", url: "https://vybewithvybe.com/" },
        }),
      }],
    };
  },
  component: Landing,
});

const supporterBenefits = [
  {
    icon: Heart,
    eyebrow: "KEEP UP",
    title: "See what's happening.",
    body: "Keep important releases, updates, and activity from creators you follow within reach.",
  },
  {
    icon: Sparkles,
    eyebrow: "CATCH UP",
    title: "See what you missed.",
    body: "Return to your VYBE instead of depending on an algorithm to show you everything at the right time.",
  },
  {
    icon: Headphones,
    eyebrow: "FIND IT AGAIN",
    title: "Find what you remember.",
    body: "Search a creator's work and updates, with creator-organized links to important posts around the web coming to VYBE.",
  },
];

const discoverFocuses = [
  {
    icon: Music2,
    title: "Music",
    body: "Artists, producers, DJs, musicians, and the sounds they create.",
    to: "/explore",
  },
  {
    icon: Clapperboard,
    title: "Film & Video",
    body: "Filmmakers, directors, visual storytellers, and screen creators.",
    to: "/experience/watch",
  },
  {
    icon: BookOpenText,
    title: "Writing & Spoken Word",
    body: "Writers, poets, storytellers, lyrics, readings, and original words.",
    to: "/experience/read",
  },
  {
    icon: Users,
    title: "Performance",
    body: "Actors, comedians, theater creators, and live performers.",
    to: "/explore",
  },
];

const explorePaths = [
  {
    icon: Headphones,
    title: "Listen",
    body: "Songs, playlists, and music from independent creators across genres.",
    to: "/discover/music",
  },
  {
    icon: Clapperboard,
    title: "Watch",
    body: "Films, trailers, performances, and visual creator experiences.",
    to: "/experience/watch",
  },
  {
    icon: BookOpenText,
    title: "Read",
    body: "Poetry, stories, lyrics, and original written work.",
    to: "/experience/read",
  },
  {
    icon: Play,
    title: "Play",
    body: "Trivia, challenges, discovery games, and other ways to experience VYBE.",
    to: "/experience/play",
  },
];


function Landing() {
  const { publicSiteIdentity } = Route.useLoaderData();

  if (publicSiteIdentity === "creators") {
    return <CreatorAudienceHub />;
  }

  if (publicSiteIdentity === "business") {
    return <BusinessAdvertisingHub />;
  }

  return <SupporterLanding />;
}

function SupporterLanding() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="bg-gradient-hero absolute inset-0 -z-20" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-background via-background/35 to-transparent" />
          <div className="mx-auto grid max-w-7xl items-center gap-9 px-5 py-10 sm:gap-12 sm:px-6 sm:py-20 lg:grid-cols-[0.92fr_1.08fr] lg:py-24">
            <div className="relative z-10">
              <Badge className="mb-6 rounded-full border border-primary/25 bg-primary/10 text-primary">
                <Sparkles className="mr-2 h-3.5 w-3.5" /> Keep up • Find it again • Discover what's next
              </Badge>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl md:text-7xl">
                Your creators.<br />
                Their world.<br />
                <span className="text-gradient-brand">Your VYBE.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Keep up with the creators you care about and discover new ones. Find what you missed,
                connect more personally, and find your way to their music, films, stories, performances,
                social media, websites, events, and more—on VYBE and beyond.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap">
                <Button asChild size="lg" className="w-full bg-gradient-brand text-primary-foreground shadow-glow sm:w-auto">
                  <Link to="/explore" search={{ q: "" }}>
                    Start Discovering <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full rounded-full bg-background/40 backdrop-blur sm:w-auto">
                  <a href="#how-vybe-works">See How VYBE Works</a>
                </Button>
              </div>
            </div>

            <picture className="relative block min-h-[360px] sm:min-h-[470px]">
              <source media="(max-width: 639px)" srcSet="/images/editorial/vybe-supporter-hero-mobile-v24-67a.webp" />
              <img
                src="/images/editorial/vybe-supporter-hero-desktop-v24-67a.webp"
                alt="A diverse group of entertainment creators and supporters connected through VYBE"
                className="h-[390px] w-full rounded-[1.5rem] object-cover object-center shadow-elevated sm:h-[470px] sm:rounded-[2rem]"
              />
            </picture>
          </div>
        </section>

        <section id="how-vybe-works" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-14 sm:px-6 sm:py-20">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">How VYBE works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Find them. Follow them. Keep their world within reach.</h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              VYBE gives supporters a simple path from discovering a creator to keeping up with what they do. Explore creators, follow the people who matter to you, return through My VYBE, and move directly into their music, videos, stories, updates, events, communities, merchandise, and links across the web.
            </p>
          </div>
          <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Following shouldn't mean hoping.</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">You followed them for a reason.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Social feeds move fast. Posts get buried. Announcements get missed. Finding something
                you remember seeing can mean scrolling through weeks—or months—of content.
              </p>
              <p className="mt-4 leading-7 text-muted-foreground">
                VYBE gives you a place to intentionally keep up with the creators you care about
                without replacing the social platforms you already use.
              </p>
            </div>
            <img
              src="/images/editorial/vybe-keep-up-find-again-v24-67a.webp"
              alt="A supporter moving from fast-moving social posts to an organized creator experience"
              className="aspect-[16/9] w-full rounded-[1.5rem] object-cover shadow-elevated sm:rounded-[2rem]"
            />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {supporterBenefits.map((item) => (
              <div key={item.eyebrow} className="rounded-3xl border border-border/70 bg-card/75 p-5 sm:p-6">
                <item.icon className="h-6 w-6 text-primary" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{item.eyebrow}</p>
                <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/35">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-20">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Discover</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Find creators worth coming back for.</h2>
                <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
                  Explore independent creators across the entertainment you already love—and meet people
                  you may not have discovered anywhere else.
                </p>
                <Button asChild size="lg" className="mt-7 rounded-full bg-gradient-brand">
                  <Link to="/explore" search={{ q: "" }}>
                    Discover Creators <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <img
                src="/images/editorial/vybe-discover-focuses-v24-67a.webp"
                alt="Creators across music, film, writing, performance, and community"
                className="aspect-[16/9] w-full rounded-[1.5rem] object-cover shadow-elevated sm:rounded-[2rem]"
              />
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {discoverFocuses.map((focus) => (
                <a key={focus.title} href={focus.to} className="group rounded-3xl border border-border/70 bg-background/70 p-5 transition hover:-translate-y-0.5 hover:border-primary/40">
                  <focus.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-5 text-xl font-semibold">{focus.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{focus.body}</p>
                  <p className="mt-5 flex items-center gap-2 text-sm font-medium text-primary">
                    Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-20">
          <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
            <img
              src="/images/editorial/vybe-explore-experiences-v24-67a.webp"
              alt="Music, film, writing, and play experiences across VYBE"
              className="order-2 aspect-[16/9] w-full rounded-[1.5rem] object-cover shadow-elevated sm:rounded-[2rem] lg:order-1"
            />
            <div className="order-1 lg:order-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Explore</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Follow whatever moves you.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Music. Film. Stories. Performances. Games. Different creators bring different kinds
                of entertainment to VYBE.
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {explorePaths.map((item) => (
              <a key={item.title} href={item.to} className="group rounded-3xl border border-border/70 bg-card/75 p-5 transition hover:-translate-y-0.5 hover:border-primary/40">
                <item.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{item.body}</p>
                <p className="mt-5 flex items-center gap-2 text-sm font-medium text-primary">
                  Explore {item.title} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </p>
              </a>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-surface/45">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">My VYBE</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Following should lead somewhere.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                When you follow a creator on VYBE, you're choosing to keep them within reach. My VYBE
                gives you a personal place to return to the creators, updates, saved music, communities,
                and experiences you care about.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <p className="font-semibold">Creators You Follow</p>
                  <p className="mt-1 text-sm text-muted-foreground">Your creators, easier to find.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <p className="font-semibold">From Your Creators</p>
                  <p className="mt-1 text-sm text-muted-foreground">Catch updates and activity you may have missed.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <p className="font-semibold">Saved for Later</p>
                  <p className="mt-1 text-sm text-muted-foreground">Return to music and things you wanted to keep.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <p className="font-semibold">Coming Up</p>
                  <p className="mt-1 text-sm text-muted-foreground">See what's ahead from creators you follow.</p>
                </div>
              </div>
              <Button asChild size="lg" className="mt-7 rounded-full bg-gradient-brand">
                <Link to="/auth/sign-up">Join VYBE <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <img
              src="/images/editorial/vybe-my-vybe-overview-v24-67a.webp"
              alt="Example My VYBE supporter dashboard showing followed music, comedy, and poetry creators"
              className="max-h-[780px] w-full rounded-[1.5rem] object-contain object-top shadow-elevated sm:rounded-[2rem]"
            />
          </div>
        </section>

        <section id="find-what-matters" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-12 sm:px-6 sm:py-20">
          <div className="grid items-center gap-7 lg:grid-cols-[0.86fr_1.14fr] lg:gap-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Find what matters</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                Spend less time searching. More time enjoying.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                VYBE is designed to organize a creator's world so you can get to what you came for—
                music, videos, stories, updates, merch, communities, and what's happening—without
                digging through an endless stream of unrelated posts.
              </p>
              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <p className="font-semibold">Go directly to the creator</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Find the person first, then choose what you want from their VYBE.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <p className="font-semibold">Search with purpose</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Look for something specific instead of scrolling and hoping it appears.</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <p className="font-semibold">Pick up where you left off</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Return to saved creators, music, communities, and activity through My VYBE.</p>
                </div>
              </div>
            </div>
            <img
              src="/images/editorial/vybe-find-what-matters-v24-67b.webp"
              alt="A visual contrast between crowded social feeds and an organized VYBE creator experience"
              className="max-h-[640px] w-full rounded-[1.5rem] object-cover object-center shadow-elevated sm:rounded-[2rem]"
            />
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/35">
          <div className="mx-auto grid max-w-7xl items-center gap-7 px-5 py-12 sm:px-6 sm:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
            <div>
              <Badge className="rounded-full border border-primary/25 bg-primary/10 text-primary">
                <Sparkles className="mr-2 h-3.5 w-3.5" /> Coming to VYBE
              </Badge>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl">
                You remember the post. Just not where to find it.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Creators will be able to organize links to important posts they've shared around the
                web so supporters can search their VYBE and return directly to the original post.
              </p>
              <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Find It Again</p>
                <p className="mt-2 text-lg font-semibold">Saw it somewhere else. Find it through VYBE.</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  VYBE doesn't need to replace the original social post to help you get back to it.
                </p>
              </div>
            </div>
            <img
              src="/images/editorial/vybe-find-it-again-v24-67b.webp"
              alt="A supporter moving from scattered social posts to one organized creator destination"
              className="max-h-[620px] w-full rounded-[1.5rem] object-cover object-center shadow-elevated sm:rounded-[2rem]"
            />
          </div>
        </section>

        <section id="community" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-12 sm:px-6 sm:py-20">
          <div className="grid items-center gap-7 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Stay connected</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Discovery is only the beginning.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Finding a creator is one moment. VYBE is built around what happens after that—
                following their work, seeing their updates, joining their community, supporting what
                they create, and having a place to come back to.
              </p>
              <div className="mt-6 grid gap-3">
                <a href="/explore" className="group rounded-2xl border border-border/70 bg-card/70 p-4 transition hover:border-primary/40">
                  <div className="flex items-start gap-3">
                    <Heart className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div><p className="font-semibold">Follow — Keep creators within reach.</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Build your own collection of people you want to keep up with.</p></div>
                  </div>
                </a>
                <a href="/experience/communities" className="group rounded-2xl border border-border/70 bg-card/70 p-4 transition hover:border-primary/40">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div><p className="font-semibold">Connect — Join the conversation.</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Take part in communities built around creators and shared interests.</p></div>
                  </div>
                </a>
                <a href="/experience/events" className="group rounded-2xl border border-border/70 bg-card/70 p-4 transition hover:border-primary/40">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div><p className="font-semibold">Experience — Show up for VYBE.</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Join VYBE-hosted lives, conversations, showcases, and other platform experiences.</p></div>
                  </div>
                </a>
              </div>
            </div>
            <img
              src="/images/editorial/vybe-stay-connected-v24-67b.webp"
              alt="Supporters connecting around creators, communities, and VYBE experiences"
              className="max-h-[610px] w-full rounded-[1.5rem] object-cover object-center shadow-elevated sm:rounded-[2rem]"
            />
          </div>
        </section>

        <section id="vybe-events" className="border-y border-border/60 bg-surface/45">
          <div className="mx-auto grid max-w-7xl items-center gap-7 px-5 py-12 sm:px-6 sm:py-20 lg:grid-cols-[0.78fr_1.22fr] lg:gap-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">VYBE Events</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Experience VYBE together.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Join VYBE-hosted lives, conversations, performances, showcases, and special
                programming designed to bring creators and supporters together.
              </p>
              <Button asChild size="lg" className="mt-7 rounded-full bg-gradient-brand">
                <a href="/experience/events">
                  <CalendarDays className="mr-2 h-4 w-4" /> Explore VYBE Events
                </a>
              </Button>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                Looking for a creator's own shows, appearances, releases, or other activity? Visit
                their VYBE and check What's Happening.
              </p>
            </div>
            <img
              src="/images/editorial/vybe-events-v24-67b.webp"
              alt="VYBE-hosted live conversations, performances, showcases, and special programming"
              className="max-h-[620px] w-full rounded-[1.5rem] object-cover object-center shadow-elevated sm:rounded-[2rem]"
            />
          </div>
        </section>

        <section id="stories" className="mx-auto grid max-w-7xl scroll-mt-24 items-center gap-7 px-5 py-12 sm:gap-10 sm:px-6 sm:py-20 lg:grid-cols-[0.92fr_1.08fr]">
          <img
            src="/images/editorial/vybe-behind-the-work-v24-67b.webp"
            alt="Creators sharing the stories, process, and people behind their work"
            className="max-h-[620px] w-full rounded-[1.5rem] object-cover object-center shadow-elevated sm:rounded-[2rem]"
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-genre-pop">Behind the work</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Hear the story. Meet the person.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              A song, film, poem, performance, story, or idea can introduce you to someone. VYBE
              gives creators room to share more about the experiences, people, and moments behind
              what they create.
            </p>
            <Button asChild variant="outline" size="lg" className="mt-7 rounded-full">
              <Link to="/explore" search={{ q: "" }}>
                Discover creator stories <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section id="merch" className="border-y border-border/60 bg-card/35">
          <div className="mx-auto grid max-w-7xl scroll-mt-24 items-center gap-7 px-5 py-12 sm:gap-10 sm:px-6 sm:py-20 lg:grid-cols-[1.04fr_0.96fr]">
            <img
              src="/images/merch/artist-marketplace-grid.webp"
              alt="Creator merchandise including music, art, accessories, keepsakes, and collectibles"
              className="max-h-[660px] w-full rounded-[1.5rem] object-cover shadow-elevated sm:rounded-[2rem]"
            />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-genre-country">Support creators</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Find something connected to what you support.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Explore merchandise, collectibles, art, accessories, keepsakes, limited drops, and
                other items created around the people and work you follow on VYBE.
              </p>
              <Button asChild size="lg" className="mt-7 rounded-full bg-gradient-brand">
                <Link to="/shop"><ShoppingBag className="mr-2 h-4 w-4" /> Shop Creator Merch</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20">
          <div className="overflow-hidden rounded-[1.5rem] border border-primary/20 bg-gradient-brand p-6 sm:rounded-[2rem] sm:p-9 md:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/75">
                  Your people • Your interests • Your VYBE
                </p>
                <h2 className="mt-3 max-w-3xl text-3xl font-bold text-primary-foreground md:text-5xl">
                  Find someone worth coming back for.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-primary-foreground/80 sm:text-lg">
                  Discover creators. Follow who matters to you. Keep up with what they're doing.
                  Find what you missed. Support what you love.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
                <Button asChild size="lg" variant="secondary" className="w-full rounded-full sm:w-auto">
                  <Link to="/explore" search={{ q: "" }}>Start Discovering <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full rounded-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto">
                  <Link to="/auth/sign-up">Join VYBE</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
