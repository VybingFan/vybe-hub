import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Eye,
  Film,
  Headphones,
  Heart,
  LockKeyhole,
  MessageCircle,
  Music2,
  PlayCircle,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo/creator")({ component: DemoCreatorPage });

const tracks = [
  {
    title: "After the Signal",
    detail: "Lead single · Alternative R&B",
    access: "Public",
    audio: "/audio/demo/after-the-signal.mp3",
  },
  {
    title: "City in Violet",
    detail: "Night Drive Sessions · Electronic Soul",
    access: "Public",
    audio: "/audio/demo/city-in-violet.mp3",
  },
  {
    title: "Between Frequencies",
    detail: "Studio sketch · Ambient Soul",
    access: "Public demo",
    audio: "/audio/demo/between-frequencies.mp3",
  },
];

const accessExamples = [
  {
    title: "Midnight Window",
    label: "VYBE members",
    description: "A free VYBE account would unlock this complete song.",
  },
  {
    title: "Closer Than Sound",
    label: "Followers",
    description: "Nova could reserve this release for people who follow her.",
  },
  {
    title: "Unreleased No. 7",
    label: "Future subscribers",
    description: "A short preview could introduce a future subscriber-exclusive release.",
  },
];

function DemoCreatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="border-b border-primary/20 bg-primary/5">
          <div className="mx-auto max-w-7xl px-5 py-7 sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-primary/30 bg-primary/15 text-primary">
                    <Sparkles className="mr-1 h-3 w-3" /> Guided VYBE example
                  </Badge>
                  <Badge variant="outline">Fictional creator—not a real artist</Badge>
                </div>
                <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
                  See how one creator page can become a complete supporter destination.
                </h1>
                <p className="mt-3 leading-7 text-muted-foreground">
                  Nova Vale is a fictional example built to show how identity, playable music,
                  playlists, stories, video, merch, events, and audience access can work together
                  on VYBE. Nothing on this page represents a real artist or a live offer.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link to="/explore" search={{ q: "" }}>
                    Explore real creators
                  </Link>
                </Button>
                <Button asChild className="bg-gradient-brand text-white">
                  <a href="#tour">Start guided example</a>
                </Button>
              </div>
            </div>
            <div className="mt-6 grid gap-3 border-t border-border/70 pt-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["1", "Creator identity", "See how the banner, profile, bio, and lead work introduce the creator."],
                ["2", "Work in one place", "Listen, watch, read, and browse without losing the creator's world."],
                ["3", "Supporter access", "Understand public, member, follower, and future subscriber experiences."],
                ["4", "Reasons to return", "See how playlists, stories, events, community, and merch deepen connection."],
              ].map(([number, title, description]) => (
                <div key={number} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Learn {number}</p>
                  <p className="mt-2 font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="h-64 overflow-hidden sm:h-80 md:h-[28rem]">
            <img
              src="/images/demo/nova-vale/banner.webp"
              alt="Nova Vale creating music in a violet-lit studio"
              className="h-full w-full object-cover object-[72%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent" />
          </div>
          <div className="relative mx-auto -mt-20 max-w-7xl px-5 pb-10 sm:px-6 md:-mt-24">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <img
                  src="/images/demo/nova-vale/avatar.webp"
                  alt="Nova Vale"
                  className="h-28 w-28 rounded-3xl border-4 border-background object-cover shadow-elevated sm:h-36 sm:w-36"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-primary/30 bg-primary/15 text-primary">
                      <Sparkles className="mr-1 h-3 w-3" />
                      VYBE Demo Creator
                    </Badge>
                    <span className="text-sm text-muted-foreground">@novavale</span>
                  </div>
                  <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                    Nova Vale
                  </h1>
                  <p className="mt-3 text-muted-foreground">
                    Alternative R&amp;B · Electronic Soul · Philadelphia, PA
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild className="bg-gradient-brand text-white">
                  <Link to="/auth/sign-up">
                    <Heart className="mr-2 h-4 w-4" />
                    Follow on VYBE
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/for-artists">
                    Build a page like this
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="tour" className="scroll-mt-24 border-y border-primary/20 bg-primary/5">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">Start here: see the public visitor experience.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Follow the page from Nova's identity into music, playlists, stories, video, merch,
                and community. Labels explain what is public now and what demonstrates future access.
              </p>
            </div>
            <Badge variant="outline" className="w-fit shrink-0">
              <Eye className="mr-2 h-4 w-4" />
              Public visitor view
            </Badge>
          </div>
        </section>

        <section
          id="music"
          className="mx-auto grid max-w-7xl scroll-mt-24 gap-8 px-6 py-16 lg:grid-cols-[1.35fr_.65fr]"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Music</p>
            <h2 className="mt-2 text-3xl font-semibold">Listen without leaving the page</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              These short original instrumental demonstrations were created for this guide. A real
              creator account would use music owned or authorized by that creator.
            </p>
            <div className="mt-7 space-y-4">
              {tracks.map((track, index) => (
                <article
                  key={track.title}
                  className="rounded-3xl border border-border bg-card p-5 md:flex md:items-center md:gap-5"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-white">
                    <Music2 className="h-6 w-6" />
                  </div>
                  <div className="mt-4 min-w-0 flex-1 md:mt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{track.title}</h3>
                      <Badge variant="outline">{track.access}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{track.detail}</p>
                    <audio
                      className="mt-3 h-10 w-full max-w-xl"
                      controls
                      preload={index === 0 ? "metadata" : "none"}
                    >
                      <source src={track.audio} type="audio/mpeg" />
                    </audio>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold">About Nova</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Nova Vale turns late-night voice notes, analog textures, and city movement into
                intimate electronic soul. Her VYBE is a home for music, creative process, community,
                and the objects that carry each release beyond the speakers.
              </p>
            </div>
            <div className="rounded-3xl border border-cyan-400/25 bg-cyan-400/5 p-6">
              <Headphones className="h-6 w-6 text-cyan-300" />
              <h2 className="mt-4 text-xl font-semibold">Profile lead track</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                “After the Signal” demonstrates the one song Nova chose to introduce her public
                profile.
              </p>
              <Button asChild variant="outline" className="mt-5 rounded-full">
                <Link to="/experience/play">
                  Explore Play on VYBE
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </aside>
        </section>

        <section className="border-y border-border/60 bg-surface/40">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-lime-300">
              Audience &amp; access preview
            </p>
            <h2 className="mt-2 text-3xl font-semibold">One profile, different ways to share</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {accessExamples.map((item) => (
                <article key={item.title} className="rounded-3xl border border-border bg-card p-6">
                  <LockKeyhole className="h-6 w-6 text-lime-300" />
                  <Badge variant="outline" className="mt-5">
                    {item.label}
                  </Badge>
                  <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 leading-6 text-muted-foreground">{item.description}</p>
                  <p className="mt-5 text-xs font-medium uppercase tracking-[.16em] text-lime-300">
                    Demonstration only
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="playlists" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.2em] text-cyan-300">
                Playlists
              </p>
              <h2 className="mt-2 text-3xl font-semibold">Creator-curated listening paths</h2>
            </div>
            <Button asChild variant="outline" className="w-fit rounded-full">
              <Link to="/experience/listen">Explore Listen on VYBE</Link>
            </Button>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Start Here: Nova Vale", "Public", "Three songs that introduce Nova’s sound."],
              ["Night Drive Sessions", "Public", "A focused sequence for the city after dark."],
              ["Followers First", "Follower preview", "Early demos and works in progress."],
              [
                "Unreleased & Unfiltered",
                "Future subscriber",
                "Private sessions and deeper access.",
              ],
            ].map(([title, label, body], index) => (
              <article
                key={title}
                className="overflow-hidden rounded-3xl border border-border bg-card"
              >
                <div
                  className={`aspect-square bg-gradient-to-br ${
                    index === 0
                      ? "from-violet-500 via-fuchsia-900 to-black"
                      : index === 1
                        ? "from-cyan-500 via-indigo-950 to-black"
                        : index === 2
                          ? "from-lime-400 via-violet-950 to-black"
                          : "from-amber-400 via-fuchsia-950 to-black"
                  } p-6`}
                >
                  <PlayCircle className="h-10 w-10 text-white/80" />
                </div>
                <div className="p-5">
                  <Badge variant="outline">{label}</Badge>
                  <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="stories" className="border-y border-border/60 bg-surface/40">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.2em] text-amber-300">
                Artist stories
              </p>
              <h2 className="mt-2 text-3xl font-semibold">The work has a life behind it</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                A public story area could hold credits, creative notes, inspirations, and the
                moments surrounding a release.
              </p>
              <Button asChild variant="outline" className="mt-6 rounded-full">
                <Link to="/experience/read">See the Read experience</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["The story behind “After the Signal”", "Behind the song", "after-the-signal"],
                ["Five sounds that shaped Nova Vale", "Influences", "five-sounds"],
                ["From voice memo to finished record", "Creative process", "voice-memo"],
                ["Meet the musicians behind the session", "Credits", "session-musicians"],
              ].map(([title, label, slug]) => (
                <a
                  key={title}
                  href={`/demo/story/${slug}`}
                  className="group rounded-3xl border border-border bg-card p-6 transition hover:border-amber-500/60 hover:shadow-elevated"
                >
                  <p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-300">
                    {label}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Open this complete sample story to see how a creator can add meaning and context
                    to the work.
                  </p>
                  <p className="mt-4 flex items-center text-sm font-medium text-foreground">
                    Read story
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="watch" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-rose-300">Watch</p>
          <h2 className="mt-2 text-3xl font-semibold">Video can extend the story</h2>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {[
              ["Studio Diary: Episode One", "Hosted video example", Film],
              ["After the Signal — Visualizer", "Published video example", PlayCircle],
              ["Live Room Session", "Native upload preview", LockKeyhole],
            ].map(([title, label, Icon]) => {
              const CardIcon = Icon as typeof Film;
              return (
                <article
                  key={title as string}
                  className="overflow-hidden rounded-3xl border border-border bg-card"
                >
                  <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-rose-500/20 via-violet-500/15 to-black">
                    <CardIcon className="h-12 w-12 text-rose-200" />
                  </div>
                  <div className="p-5">
                    <Badge variant="outline">{label as string}</Badge>
                    <h3 className="mt-3 text-lg font-semibold">{title as string}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Demo card—no third-party video or copyrighted footage is embedded.
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="merch" className="border-y border-border/60 bg-surface/40">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-orange-300">
              Artist collection
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Merch, art, and objects with a story</h2>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["After the Signal Vinyl", "$28.00", "Vinyl"],
                ["City in Violet Art Print", "$18.00", "Art"],
                ["Midnight Studio Candle", "$22.00", "Lifestyle"],
                ["Nova Vale Lyric Notebook", "Coming soon", "Collectible"],
              ].map(([title, price, category], index) => (
                <article
                  key={title}
                  className="overflow-hidden rounded-3xl border border-border bg-card"
                >
                  <div
                    className={`flex aspect-square items-center justify-center bg-gradient-to-br ${
                      index % 2
                        ? "from-orange-300 via-fuchsia-700 to-black"
                        : "from-violet-400 via-indigo-900 to-black"
                    }`}
                  >
                    <ShoppingBag className="h-14 w-14 text-white/80" />
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-orange-300">{category}</p>
                    <h3 className="mt-1 text-lg font-semibold">{title}</h3>
                    <p className="mt-3 font-medium">{price}</p>
                    <Badge variant="outline" className="mt-3">
                      Demonstration item
                    </Badge>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Nothing on this demo page is for sale. Future purchases and fulfillment would be
              handled under clearly disclosed creator and VYBE policies.
            </p>
          </div>
        </section>

        <section id="community" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-lime-300">
            Community &amp; events
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Give people a reason to return</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              [
                "Listening Room: After the Signal",
                "Event demonstration",
                CalendarDays,
                "/experience/events",
              ],
              [
                "Nova’s Studio Notes",
                "Community demonstration",
                MessageCircle,
                "/experience/communities",
              ],
              ["Founding Listeners", "Follower space preview", Users, "/auth/sign-up"],
            ].map(([title, label, Icon, href]) => {
              const CardIcon = Icon as typeof Users;
              return (
                <a
                  key={title as string}
                  href={href as string}
                  className="rounded-3xl border border-border bg-card p-6"
                >
                  <CardIcon className="h-7 w-7 text-lime-300" />
                  <Badge variant="outline" className="mt-5">
                    {label as string}
                  </Badge>
                  <h3 className="mt-3 text-xl font-semibold">{title as string}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Open a clearly labeled example of how creator-led participation could work.
                  </p>
                  <p className="mt-4 flex items-center text-sm font-medium">
                    Open experience
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </p>
                </a>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="rounded-[2rem] border border-primary/25 bg-gradient-brand p-8 text-primary-foreground md:p-12">
            <p className="font-medium text-primary-foreground/75">
              Ready to build your creator home?
            </p>
            <div className="mt-2 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <h2 className="max-w-3xl text-3xl font-bold md:text-4xl">
                Use the example as a guide. Make the real page unmistakably yours.
              </h2>
              <Button asChild variant="secondary" size="lg" className="shrink-0 rounded-full">
                <Link to="/for-artists">
                  Explore creator tools
                  <ArrowRight className="ml-2 h-4 w-4" />
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
