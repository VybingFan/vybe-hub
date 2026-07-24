import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Check,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Headphones,
  HeartHandshake,
  Link2,
  ListMusic,
  MessageCircle,
  Music2,
  Play,
  Radio,
  Share2,
  ShoppingBag,
  Sparkles,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/for-artists")({ component: ForArtists });

const availableFeatures = [
  {
    icon: UserRound,
    title: "Your public creator page",
    body: "Bring your music, story, image, links, and merchandise into one creator-controlled destination.",
  },
  {
    icon: Music2,
    title: "Your music library",
    body: "Upload and organize your tracks once, then use them across your public page and playlists.",
  },
  {
    icon: ListMusic,
    title: "Purpose-built playlists",
    body: "Choose songs, arrange the play order, add context, and publish a complete listening experience.",
  },
  {
    icon: Link2,
    title: "Direct shareable links",
    body: "Send fans straight to your creator page or a specific playlist—no account required to listen.",
  },
  {
    icon: BellRing,
    title: "Audience activity",
    body: "See recorded playlist opens and track plays so you know which shared experiences are reaching people.",
  },
  {
    icon: ShoppingBag,
    title: "Merchandise showcase",
    body: "Feature selected merchandise alongside your music while you remain in control of availability.",
  },
];

const steps = [
  {
    icon: UserRound,
    title: "Create your home",
    body: "Choose your public username and add the story, visuals, genres, and links that introduce you.",
  },
  {
    icon: Upload,
    title: "Upload your music",
    body: "Add your tracks and cover art to a reusable creator library.",
  },
  {
    icon: ListMusic,
    title: "Build the VYBE",
    body: "Create a playlist for a mood, release, story, event, inspiration, or moment.",
  },
  {
    icon: Share2,
    title: "Share one link",
    body: "Fans land on a focused listening page and can move from the playlist to your complete creator home.",
  },
];

const upcomingFeatures = [
  "Creator and fan communities",
  "Videos and behind-the-scenes stories",
  "Events and listening parties",
  "Deeper creator analytics",
  "Membership and exclusive content tools",
  "More ways for fans to follow, save, and support",
];

function ForArtists() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-20 bg-gradient-hero" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-background to-transparent" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[0.92fr_1.08fr] lg:py-28">
            <div>
              <Badge className="rounded-full border border-primary/25 bg-primary/10 text-primary">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Built for independent music creators
              </Badge>
              <h1 className="mt-6 text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl">
                Your music deserves more than{" "}
                <span className="text-gradient-brand">another link.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                VYBE gives your music, story, playlists, merchandise, and audience one place to
                connect—without making fans search across multiple platforms.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-brand text-primary-foreground shadow-glow"
                >
                  <Link to="/auth/sign-up">
                    Start free <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link to="/explore" search={{ q: "" }}>
                    <Play className="mr-2 h-4 w-4" /> See creators on VYBE
                  </Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> Creator Free
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> Fans can listen without signing in
                </span>
              </div>
            </div>

            <div className="relative">
              <img
                src="/images/editorial/artist-stories.webp"
                alt="Independent music creator sharing the story behind their work"
                className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-elevated"
              />
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/15 bg-black/60 p-5 text-white backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
                      One creator home
                    </p>
                    <p className="mt-2 text-xl font-semibold">Music. Story. Community.</p>
                    <p className="mt-1 text-sm text-white/65">
                      Shared through one direct VYBE link.
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black">
                    <Play className="ml-0.5 h-5 w-5 fill-current" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-surface/45">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Why VYBE exists
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                Your audience should not be scattered everywhere.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ProblemCard
                icon={ExternalLink}
                title="Too many disconnected links"
                body="Music on one service, videos somewhere else, merchandise on another site, and your story buried in social posts."
              />
              <ProblemCard
                icon={Clock3}
                title="Every share starts over"
                body="A fan clicks one link, experiences one item, and often has no clear path toward the rest of your world."
              />
              <ProblemCard
                icon={Radio}
                title="Platforms control the experience"
                body="Your work is usually presented inside somebody else’s feed, format, priorities, and distractions."
              />
              <ProblemCard
                icon={HeartHandshake}
                title="Real relationships get lost"
                body="Streams matter, but creators also need ways to turn attention into recognition, participation, and lasting support."
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-3xl">
            <Badge
              variant="outline"
              className="rounded-full border-emerald-500/30 text-emerald-500"
            >
              <BadgeCheck className="mr-2 h-3.5 w-3.5" /> Available today
            </Badge>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl">
              Start with the tools creators can use now.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              The current creator pilot is intentionally focused: establish your home, upload your
              music, create something worth sharing, and learn what brings listeners closer.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {availableFeatures.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-border/70 bg-card p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/45">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-genre-electronic">
                  Simple by design
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                  From your music to their headphones in four steps.
                </h2>
              </div>
              <p className="max-w-md text-muted-foreground">
                Upload once, reuse your library, and send fans a focused VYBE instead of a list of
                places to search.
              </p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="relative overflow-hidden rounded-3xl border border-border/70 bg-background p-7"
                >
                  <span className="absolute right-5 top-3 text-6xl font-bold text-primary/8">
                    {index + 1}
                  </span>
                  <step.icon className="relative h-7 w-7 text-primary" />
                  <h3 className="relative mt-10 text-xl font-semibold">{step.title}</h3>
                  <p className="relative mt-3 leading-7 text-muted-foreground">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-primary/25 bg-gradient-hero p-6 shadow-elevated md:p-8">
            <div className="rounded-3xl border border-border/70 bg-background/90 p-6 backdrop-blur">
              <div className="flex items-center gap-3 border-b border-border/60 pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand text-white">
                  <Music2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Your artist name</p>
                  <p className="text-sm text-muted-foreground">A personal VYBE from the creator</p>
                </div>
              </div>
              <div className="py-7">
                <Badge variant="secondary">Now playing</Badge>
                <h3 className="mt-3 text-3xl font-semibold">The song you chose to share</h3>
                <p className="mt-2 text-muted-foreground">
                  Your note gives listeners a reason to care before they press play.
                </p>
                <div className="mt-7 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Play className="ml-1 h-5 w-5 fill-current" />
                  </div>
                  <div className="h-1.5 flex-1 rounded-full bg-primary/20">
                    <div className="h-full w-1/3 rounded-full bg-primary" />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 border-t border-border/60 pt-5">
                <Button size="sm" variant="outline">
                  <UserRound className="mr-2 h-4 w-4" /> Meet the creator
                </Button>
                <Button size="sm" variant="outline">
                  <Share2 className="mr-2 h-4 w-4" /> Share this VYBE
                </Button>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-genre-pop">
              What your fans receive
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              Not a dashboard. An experience.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Fans can open your public playlist, press play, understand why you shared it, and move
              directly to your creator page. They do not need an account just to listen.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "One clean listening destination",
                "Your artist identity and playlist story",
                "The songs arranged in your chosen order",
                "A direct path to your complete creator page",
                "Clear options to explore, join, and return",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-y border-border/60 bg-surface/45">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-24 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <Badge className="rounded-full bg-primary/10 text-primary">
                <CircleDollarSign className="mr-2 h-3.5 w-3.5" /> Creator Free
              </Badge>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl">
                Build your first VYBE without a credit card.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                Creator Free is designed to let independent artists establish a real public presence
                and test the sharing experience before paid creator memberships launch.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "Public creator profile",
                  "Music uploads and cover art",
                  "Published songs and playlists",
                  "Shareable creator and playlist links",
                  "Merchandise showcase",
                  "Basic playlist activity",
                ].map((item) => (
                  <p key={item} className="flex items-center gap-3">
                    <Check className="h-4 w-4 shrink-0 text-primary" /> {item}
                  </p>
                ))}
              </div>
              <Button asChild size="lg" className="mt-9 bg-gradient-brand text-primary-foreground">
                <Link to="/auth/sign-up">
                  Create your free account <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <aside className="rounded-[2rem] border border-primary/25 bg-card p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Clear from the beginning
              </p>
              <div className="mt-6 space-y-5">
                <Promise
                  title="Free to begin"
                  body="No credit card is required for Creator Free."
                />
                <Promise
                  title="Limits stay visible"
                  body="Your Settings page shows current usage and plan limits before you reach them."
                />
                <Promise
                  title="Your uploaded music stays yours"
                  body="Removing a song from a playlist does not delete it from your music library."
                />
                <Promise
                  title="Paid memberships are coming later"
                  body="Billing is not active. Future paid tools will be presented clearly before purchase."
                />
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Growing with creators
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                Music is the beginning—not the boundary.
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                The working pilot begins with creator pages, music, playlists, sharing, activity,
                connections, and merchandise. Creator feedback will shape what becomes deeper next.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {upcomingFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-5"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                  <Badge variant="secondary" className="ml-auto">
                    Planned
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-hero px-7 py-14 text-center md:px-12 md:py-20">
            <Users className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
              Give your next share somewhere to lead.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Create your VYBE home, upload your music, publish a playlist, and send fans one link
              that opens the complete experience.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-gradient-brand text-primary-foreground shadow-glow"
              >
                <Link to="/auth/sign-up">
                  Start with Creator Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth/sign-in">Creator sign in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function ProblemCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Headphones;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-3xl border border-border/70 bg-card p-6">
      <Icon className="h-6 w-6 text-primary" />
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 leading-7 text-muted-foreground">{body}</p>
    </article>
  );
}

function Promise({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="h-4 w-4" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
