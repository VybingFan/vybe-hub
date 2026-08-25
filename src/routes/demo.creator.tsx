import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Bookmark,
  CheckCircle2,
  Eye,
  Feather,
  Film,
  Headphones,
  Heart,
  LockKeyhole,
  MessageCircle,
  PlayCircle,
  ShoppingCart,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo/creator")({ component: DemoCreatorPage });

const tracks = [
  {
    title: "Rise Together",
    detail: "Lead single · Country Soul · 3:27",
    access: "Public full song",
    audio: "/audio/demo/nova-vale/rise-together.mp3",
    artwork: "/images/demo/nova-vale/profile-v2.webp",
    playable: true,
    requiredMode: "visitor",
    why: "A public lead song removes friction. New visitors can immediately hear the work that best communicates Nova's identity.",
  },
  {
    title: "Safe With Me",
    detail: "Public excerpt · 1:00 · supplied title",
    access: "Public preview",
    audio: "/audio/demo/nova-vale/catalog/safe-with-me.mp3",
    artwork: "/images/demo/nova-vale/catalog/safe-with-me.jpg",
    playable: true,
    requiredMode: "visitor",
    why: "A complete 60-second excerpt gives discovery visitors a meaningful listen while demonstrating how a creator can reserve a future full version.",
  },
  {
    title: "TRE2",
    detail: "Working title · 2:27 · supplied title",
    access: "VYBE member",
    audio: "/audio/demo/nova-vale/catalog/tre2.mp3",
    artwork: "/images/demo/nova-vale/catalog/tre2.jpg",
    playable: false,
    requiredMode: "member",
    why: "Member access demonstrates a low-friction reason to create a free VYBE account. The working title remains visible until the creator confirms final release information.",
  },
  {
    title: "Lemme Fix It",
    detail: "Follower-access demonstration · 1:30 · supplied title",
    access: "Followers",
    audio: "/audio/demo/nova-vale/catalog/lemme-fix-it.mp3",
    artwork: "/images/demo/nova-vale/catalog/lemme-fix-it.jpg",
    playable: false,
    requiredMode: "follower",
    why: "Follower access rewards an intentional supporter relationship without requiring a paid subscription.",
  },
  {
    title: "Charlie Sheen",
    detail: "Direct-link demonstration · 3:02 · title review recommended",
    access: "Unlisted",
    audio: "/audio/demo/nova-vale/catalog/charlie-sheen.mp3",
    artwork: "/images/demo/nova-vale/catalog/charlie-sheen.jpg",
    playable: false,
    requiredMode: "unlisted",
    why: "Unlisted access is useful for private review and direct sharing. The supplied title should receive a naming and rights review before any public campaign.",
  },
];

const novaDiscoveryTags = [
  "Country Soul",
  "Americana",
  "Blues-rooted",
  "Storytelling",
  "Second chances",
  "Motherhood",
  "Late-blooming creator",
  "AI-assisted music",
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

const supporterModes = [
  {
    id: "visitor",
    label: "Public visitor",
    description: "No account needed",
    actions: [
      ["Play public songs and previews", true],
      ["Read public stories, poetry, and EPK", true],
      ["Browse public merchandise", true],
      ["Follow, save, react, or comment", false],
      ["Purchase through VYBE checkout", false],
    ],
    next: "Create a free account only when you want to keep, follow, or join something.",
  },
  {
    id: "member",
    label: "Free VYBE member",
    description: "Signed in",
    actions: [
      ["Play public and account-required releases", true],
      ["Follow Nova and save music or playlists", true],
      ["React and comment where Nova allows it", true],
      ["Join free communities and reserve free experiences", true],
      ["Open follower-only releases automatically", false],
    ],
    next: "Follow Nova to receive the creator-approved follower experience.",
  },
  {
    id: "follower",
    label: "Nova follower",
    description: "Free relationship",
    actions: [
      ["Use every free-member interaction", true],
      ["Open releases Nova shares with followers", true],
      ["Return to saved playlists and creator updates", true],
      ["Join creator-led conversations when enabled", true],
      ["Open paid or purchase-required work automatically", false],
    ],
    next: "Paid, purchased, or invited work remains separate and must be granted intentionally.",
  },
] as const;

type SupporterModeId = (typeof supporterModes)[number]["id"];

const novaPlaylists = [
  {
    title: "Start Here: Nova Vale",
    label: "Public",
    body: "Rise Together, Safe With Me, and TRE2 introduce Nova's country-soul point of view.",
    image: "/images/demo/nova-vale/epk/performance-portrait.webp",
    songs: "3-song guided sequence",
  },
  {
    title: "Roads, Mothers & Second Chances",
    label: "Public",
    body: "Songs and poems about migration, motherhood, memory, and finding the creative road again.",
    image: "/images/demo/nova-vale/epk/theater-portrait.webp",
    songs: "Music + poetry collection",
  },
  {
    title: "Nova After Dark",
    label: "Followers",
    body: "Follower access demonstrates how early versions, studio notes, and works in progress can be shared.",
    image: "/images/demo/nova-vale/epk/songwriting-session.webp",
    songs: "Follower listening room",
  },
] as const;

const novaMerch = [
  {
    title: "The Dream Didn't Die Journal",
    price: "$24.00 demo price",
    category: "Books & zines",
    availability: "Coming soon",
    image: "/images/demo/nova-vale/merch/dream-journal.webp",
    story: "A clothbound writing journal tied to Nova's poem about returning to a creative life.",
    sale: "Nova would confirm the printer, unit cost, inventory, shipping weight, return terms, and authorized artwork before adding a real purchase link.",
  },
  {
    title: "Porch Light Candle",
    price: "$26.00 demo price",
    category: "Collectibles",
    availability: "Concept preview",
    image: "/images/demo/nova-vale/merch/porch-light-candle.webp",
    story: "An amber candle inspired by the image of a light left on for the person finding her way home.",
    sale: "A real listing needs a named maker, ingredients and safety labeling, available quantity, fulfillment timing, and a verified external store or future VYBE checkout.",
  },
  {
    title: "Rise Together Fine-Art Print",
    price: "$28.00 demo price",
    category: "Art & prints",
    availability: "Concept preview",
    image: "/images/demo/nova-vale/merch/rise-together-print.webp",
    story: "An 18 × 24 print translating the song's central idea into lines that rise and meet.",
    sale: "Nova would document the artwork rights, edition size, paper, dimensions, packaging, and replacement policy before publishing it for sale.",
  },
  {
    title: "Begin Again Hoodie",
    price: "$54.00 demo price",
    category: "Apparel",
    availability: "Concept preview",
    image: "/images/demo/nova-vale/merch/begin-again-hoodie.webp",
    story: "A heavyweight washed-black hoodie carrying Nova's message of reinvention without erasing the years that came before.",
    sale: "A real listing needs size and color variants, garment specifications, inventory, a size guide, shipping expectations, and clear exchange or return terms.",
  },
] as const;

function SupporterInteractionGuide({
  modeId,
  onModeChange,
}: {
  modeId: SupporterModeId;
  onModeChange: (mode: SupporterModeId) => void;
}) {
  const mode = supporterModes.find((item) => item.id === modeId) ?? supporterModes[0];

  return (
    <section id="supporter-guide" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[.2em] text-fuchsia-300">
        Supporter interaction guide
      </p>
      <h2 className="mt-2 text-3xl font-semibold">See what you can do before you click</h2>
      <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
        Switch between the three common supporter views. This teaching preview does not change
        your account; it explains which interactions are public and when a free VYBE identity is
        needed. The selection now changes the playable releases and demo interactions below.
      </p>
      <div className="mt-7 grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
        <div className="space-y-3">
          {supporterModes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onModeChange(item.id)}
              className={`w-full rounded-2xl border p-5 text-left transition ${
                modeId === item.id
                  ? "border-fuchsia-400/60 bg-fuchsia-400/10"
                  : "border-border bg-card hover:border-fuchsia-400/35"
              }`}
            >
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </button>
          ))}
        </div>
        <div className="rounded-3xl border border-fuchsia-400/25 bg-card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-fuchsia-300">Current preview</p>
              <h3 className="mt-2 text-2xl font-semibold">{mode.label}</h3>
            </div>
            <Badge variant="outline">{mode.description}</Badge>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {mode.actions.map(([label, available]) => (
              <div key={label} className="flex gap-3 rounded-2xl border border-border/70 bg-background/50 p-4">
                {available ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <p className="text-sm leading-6">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-sm font-semibold">What happens next</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{mode.next}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="rounded-full bg-gradient-brand text-white">
              <Link to="/auth/sign-up"><UserPlus className="mr-2 h-4 w-4" />Create free VYBE account</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <a href="#music"><Headphones className="mr-2 h-4 w-4" />Hear Nova first</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoCreatorPage() {
  const [supporterMode, setSupporterMode] = useState<SupporterModeId>("visitor");
  const [heartedTracks, setHeartedTracks] = useState<string[]>([]);
  const [savedPlaylists, setSavedPlaylists] = useState<string[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  const [actionNote, setActionNote] = useState<string | null>(null);
  const canInteract = supporterMode !== "visitor";
  const isFollower = supporterMode === "follower";

  const canPlayTrack = (requiredMode: string) =>
    requiredMode === "visitor" ||
    (requiredMode === "member" && canInteract) ||
    (requiredMode === "follower" && isFollower);

  const requireAccount = (message: string) => {
    setActionNote(message);
    document.getElementById("supporter-guide")?.scrollIntoView({ behavior: "smooth" });
  };

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
                  <Badge variant="outline">Human story · AI-assisted artist persona</Badge>
                </div>
                <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
                  See how one creator page can become a complete supporter destination.
                </h1>
                <p className="mt-3 leading-7 text-muted-foreground">
                  Nova Vale is a transparent AI-assisted artist persona built from a real woman's
                  creative story. This guided example shows how identity, playable music,
                  playlists, stories, video, merch, events, and audience access can work together
                  on VYBE. Nova is a demonstration—not a separate human performer or a live offer.
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
                <Button asChild variant="outline">
                  <Link to="/creator-academy/nova">Study the Creator Studio build</Link>
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
              src="/images/demo/nova-vale/cover-v2.webp"
              alt="Nova Vale, a transparent AI-assisted country-soul artist persona"
              className="h-full w-full object-cover object-[center_38%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent" />
          </div>
          <div className="relative mx-auto -mt-20 max-w-7xl px-5 pb-10 sm:px-6 md:-mt-24">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <img
                  src="/images/demo/nova-vale/profile-v2.webp"
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
                    Country Soul · Americana · Blues-rooted storytelling
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {canInteract ? (
                  <Button type="button" className="bg-gradient-brand text-white" onClick={() => {
                    setSupporterMode("follower");
                    setActionNote("You are now viewing Nova as a follower in this demo. Follower releases and playlist access are unlocked below.");
                  }}>
                    <Heart className={`mr-2 h-4 w-4 ${isFollower ? "fill-current" : ""}`} />
                    {isFollower ? "Following in demo" : "Follow Nova in demo"}
                  </Button>
                ) : (
                  <Button asChild className="bg-gradient-brand text-white">
                    <Link to="/auth/sign-up">
                      <Heart className="mr-2 h-4 w-4" />
                      Create account to follow
                    </Link>
                  </Button>
                )}
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
              <p className="font-semibold">Start here: experience Nova as a supporter would.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Follow the page from Nova's identity into music, playlists, stories, video, merch,
                and community. Labels explain what is public now and what demonstrates future access.
              </p>
            </div>
            <Badge variant="outline" className="w-fit shrink-0">
              <Eye className="mr-2 h-4 w-4" />
              {supporterModes.find((item) => item.id === supporterMode)?.label} view
            </Badge>
          </div>
        </section>

        <SupporterInteractionGuide modeId={supporterMode} onModeChange={(mode) => {
          setSupporterMode(mode);
          setActionNote(`Demo changed to ${supporterModes.find((item) => item.id === mode)?.label}.`);
        }} />

        {actionNote ? (
          <div className="mx-auto max-w-7xl px-6">
            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 text-sm">
              {actionNote} <span className="text-muted-foreground">Demo actions are local and are not saved to a real account.</span>
            </div>
          </div>
        ) : null}

        <section
          id="music"
          className="mx-auto grid max-w-7xl scroll-mt-24 gap-8 px-6 py-16 lg:grid-cols-[1.35fr_.65fr]"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Music</p>
            <h2 className="mt-2 text-3xl font-semibold">Listen without leaving the page</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              This guided catalog uses authorized source files credited to Jerzo and C. Blount.
              Each access choice demonstrates a different creator goal. Locked examples remain
              visible here for education, but would not expose restricted playback on a real public profile.
            </p>
            <div className="mt-7 space-y-4">
              {tracks.map((track, index) => {
                const playable = canPlayTrack(track.requiredMode);
                const hearted = heartedTracks.includes(track.title);
                return (
                <article
                  key={track.title}
                  className="rounded-3xl border border-border bg-card p-5 md:flex md:items-center md:gap-5"
                >
                  <img
                    src={track.artwork}
                    alt={`${track.title} cover artwork`}
                    className="h-20 w-20 shrink-0 rounded-2xl border border-border object-cover"
                  />
                  <div className="mt-4 min-w-0 flex-1 md:mt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{track.title}</h3>
                      <Badge variant="outline">{track.access}</Badge>
                      <button
                        type="button"
                        aria-label={`${hearted ? "Remove heart from" : "Heart"} ${track.title}`}
                        onClick={() => {
                          if (!canInteract) {
                            requireAccount("A free VYBE account is required to heart songs.");
                            return;
                          }
                          setHeartedTracks((current) => hearted ? current.filter((title) => title !== track.title) : [...current, track.title]);
                          setActionNote(hearted ? `${track.title} was removed from demo hearts.` : `${track.title} was hearted in this demo.`);
                        }}
                        className={`ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${hearted ? "border-fuchsia-400 bg-fuchsia-400/15 text-fuchsia-300" : "border-border text-muted-foreground hover:border-fuchsia-400/50 hover:text-fuchsia-300"}`}
                      >
                        <Heart className={`h-5 w-5 ${hearted ? "fill-current" : ""}`} />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">{track.detail}</p>
                    {playable ? (
                      <audio
                        className="mt-3 h-10 w-full max-w-xl"
                        controls
                        preload={index === 0 ? "metadata" : "none"}
                        onPlay={(event) => {
                          document.querySelectorAll("audio").forEach((audio) => {
                            if (audio !== event.currentTarget) audio.pause();
                          });
                        }}
                      >
                        <source src={track.audio} type="audio/mpeg" />
                      </audio>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background/50 px-4 py-3 text-sm text-muted-foreground">
                        <LockKeyhole className="h-4 w-4 shrink-0" />
                        {track.requiredMode === "member"
                          ? "Choose Free VYBE member above to hear this account-required example."
                          : track.requiredMode === "follower"
                            ? "Choose Nova follower above to hear this follower release."
                            : "This unlisted release requires its direct creator link."}
                      </div>
                    )}
                    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Why this access choice</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{track.why}</p>
                    </div>
                  </div>
                </article>
              );})}
            </div>

            <div className="mt-8 rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-cyan-300" />
                <div><h3 className="text-xl font-semibold">Supporter conversation preview</h3><p className="text-sm text-muted-foreground">See how an allowed comment appears without publishing anything.</p></div>
              </div>
              {canInteract ? (
                <form className="mt-5" onSubmit={(event) => {
                  event.preventDefault();
                  const comment = commentDraft.trim();
                  if (!comment) return;
                  setComments((current) => [...current, comment]);
                  setCommentDraft("");
                  setActionNote("Your demo comment was added locally. Nothing was published.");
                }}>
                  <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} maxLength={280} placeholder="Write a demo comment to Nova..." className="min-h-24 w-full rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:border-cyan-400/60" />
                  <Button type="submit" className="mt-3 rounded-full">Post demo comment</Button>
                </form>
              ) : (
                <button type="button" onClick={() => requireAccount("A free VYBE account is required to comment.")} className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-dashed border-border p-5 text-left text-sm text-muted-foreground hover:border-primary/50">
                  <LockKeyhole className="h-5 w-5" /> Create a free account to join creator-enabled conversations.
                </button>
              )}
              {comments.map((comment, index) => <div key={`${comment}-${index}`} className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4"><p className="text-xs font-semibold uppercase tracking-[.14em] text-cyan-300">Demo supporter comment</p><p className="mt-2 text-sm">{comment}</p></div>)}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-border bg-card p-6">
              <img
                src="/images/demo/nova-vale/nova-vale-logo.webp"
                alt="Nova Vale — Country Soul Reimagined"
                className="mb-6 aspect-square w-28 rounded-2xl object-cover"
              />
              <h2 className="text-xl font-semibold">About Nova</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Before Nova Vale had a name, there was a New Orleans-born woman whose earliest
                creative language came from blues, jazz, gospel, family stories, and the musical
                cadence of ordinary conversation. Childhood in New York, teenage years in Florida,
                adulthood in New Jersey, and a later life in Texas gave her more than a list of
                hometowns: they gave her different ways to understand belonging, survival, and home.
              </p>
              <p className="mt-4 leading-7 text-muted-foreground">
                Years later, her children introduced her to AI music tools. What began as curiosity
                became a way back to the voice she had set aside. She created Nova Vale—an
                AI-assisted country-soul alter ego through which real memories, poetry, humor,
                regret, resilience, and second chances could become songs. The technology supports
                experimentation; the point of view, direction, selections, and story remain
                human-led.
              </p>
            </div>
            <div className="rounded-3xl border border-cyan-400/25 bg-cyan-400/5 p-6">
              <Headphones className="h-6 w-6 text-cyan-300" />
              <h2 className="mt-4 text-xl font-semibold">Profile lead track</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Nova's lead song should introduce her emotional center: honest country storytelling,
                blues-rooted phrasing, and the belief that a creative life can begin again.
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
          <div className="mx-auto grid max-w-7xl gap-7 px-6 py-16 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.2em] text-amber-300">
                Full artist biography
              </p>
              <h2 className="mt-2 text-3xl font-semibold">The woman behind Nova Vale</h2>
              <div className="mt-5 space-y-4 leading-7 text-muted-foreground">
                <p>
                  Born in New Orleans, Nova's human creator first learned to hear stories inside
                  music. Blues taught her that pain could be spoken plainly. Jazz taught her that a
                  voice could bend around a feeling. Gospel carried memory and resilience. Country
                  later showed her how a porch light, an empty chair, or a long road home could hold
                  an entire life. She sang when no one was listening and wrote poems and songs she
                  rarely shared.
                </p>
                <p>
                  She moved to New York with her parents as a child and was sent to Florida in her
                  early teens during a season of growing pains. She eventually returned north,
                  spending several years in New Jersey, where adulthood, children, work, and the
                  needs of other people took the foreground. Music became something she remembered
                  rather than something she practiced. After relocating to Texas, the physical
                  distance from earlier versions of her life created room to hear herself again.
                </p>
                <p>
                  When her children introduced her to AI music tools, curiosity reopened the
                  notebooks. Nova Vale emerged as an alter ego and creative mirror: confident
                  enough to sing the words her human creator had been too busy living to finish,
                  but grounded in the real life that produced them. Her catalog centers motherhood,
                  reinvention, grown-woman love, migration, family memory, faith, humor, grief, and
                  the courage to return to a dream without pretending the intervening years were
                  wasted.
                </p>
              </div>
            </div>
            <aside className="rounded-3xl border border-amber-300/25 bg-amber-300/5 p-6">
              <Feather className="h-7 w-7 text-amber-300" />
              <h3 className="mt-4 text-xl font-semibold">How Nova should be described</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Clear language builds trust: “Nova Vale is an AI-assisted artist persona created
                and directed by a real writer rediscovering her musical voice.” Do not call the
                software the songwriter, hide the use of AI, or imply that the pictured persona is
                a touring human performer.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {novaDiscoveryTags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-muted-foreground">
                These tags combine sound, story, audience intent, and transparent creation method.
                They improve discovery without chasing unrelated trends.
              </p>
            </aside>
          </div>

          <div className="mt-8 rounded-3xl border border-amber-300/25 bg-amber-300/5 p-6 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-300">Catalog credit and transparency lesson</p>
            <p className="mt-3 leading-7 text-muted-foreground">
              Human creative direction and source-catalog credits: Jerzo and C. Blount. “TRE2”
              contains embedded metadata identifying Suno assistance. VYBE should preserve supplied
              metadata, add contributor roles only after confirmation, and never invent songwriting,
              production, performance, ownership, or publishing splits. The titles and artwork above
              are displayed as supplied; descriptive teaching copy is clearly identified as demonstration copy.
            </p>
          </div>
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
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {novaPlaylists.map((playlist) => {
              const saved = savedPlaylists.includes(playlist.title);
              const locked = playlist.label === "Followers" && !isFollower;
              return (
              <article
                key={playlist.title}
                className="overflow-hidden rounded-3xl border border-border bg-card"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={playlist.image} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                  <PlayCircle className="absolute bottom-4 left-4 h-10 w-10 text-white" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3"><Badge variant="outline">{playlist.label}</Badge><span className="text-xs text-muted-foreground">{playlist.songs}</span></div>
                  <h3 className="mt-3 text-lg font-semibold">{playlist.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{playlist.body}</p>
                  <button type="button" onClick={() => {
                    if (!canInteract) { requireAccount("A free VYBE account is required to save playlists."); return; }
                    if (locked) { setActionNote("Follow Nova in the demo to save this follower playlist."); return; }
                    setSavedPlaylists((current) => saved ? current.filter((title) => title !== playlist.title) : [...current, playlist.title]);
                    setActionNote(saved ? `${playlist.title} was removed from demo saves.` : `${playlist.title} was saved in this demo.`);
                  }} className="mt-5 inline-flex items-center text-sm font-medium text-primary">
                    {locked ? <LockKeyhole className="mr-2 h-4 w-4" /> : <Bookmark className={`mr-2 h-4 w-4 ${saved ? "fill-current" : ""}`} />}
                    {locked ? "Follower access" : saved ? "Saved in demo" : "Save playlist"}
                  </button>
                </div>
              </article>
            );})}
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
                ["The notebooks she opened again", "Origin story", "after-the-signal"],
                ["What blues, jazz, and country taught Nova", "Influences", "five-sounds"],
                ["From poem to AI-assisted country song", "Creative process", "voice-memo"],
                ["Who made Nova: human direction and AI assistance", "Credits", "session-musicians"],
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

        <section id="poetry" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[.2em] text-fuchsia-300">
                Poetry &amp; spoken word
              </p>
              <h2 className="mt-2 text-3xl font-semibold">The notebooks are part of the catalog</h2>
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
                Nova demonstrates that written work can be published as complete creative work,
                connected to music, stories, readings, discovery tags, and supporter conversation.
              </p>
            </div>
            <Badge variant="outline" className="w-fit">Original human-written poetry</Badge>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {[
              ["The Dream Didn't Die", "Reinvention · Second chances", "the-dream-didnt-die", "/images/demo/nova-vale/epk-v2/nova-4.png"],
              ["The Woman in the Mirror Has Lived", "Womanhood · Memory · Voice", "the-woman-in-the-mirror-has-lived", "/images/demo/nova-vale/epk-v2/nova-7.png"],
              ["What My Children Didn't Know", "Motherhood · Identity · Return", "what-my-children-didnt-know", "/images/demo/nova-vale/epk-v2/nova-5.png"],
            ].map(([title, theme, slug, image]) => (
              <a
                key={title}
                href={`/demo/poem/${slug}`}
                className="group overflow-hidden rounded-3xl border border-border bg-card transition hover:border-fuchsia-400/50 hover:shadow-elevated"
              >
                <img src={image} alt="" className="aspect-[16/10] w-full object-cover object-top" />
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[.16em] text-fuchsia-300">{theme}</p>
                  <h3 className="mt-3 text-xl font-semibold">{title}</h3>
                  <p className="mt-4 flex items-center text-sm font-medium">
                    Read the complete poem
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section id="watch" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-rose-300">Watch</p>
          <h2 className="mt-2 text-3xl font-semibold">Behind “Rise Together”</h2>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            These short AI-generated studio clips demonstrate how Nova's visual persona can support
            a release story. They are labeled clearly because transparency is part of the brand.
          </p>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {[
              ["Studio take one", "/video/demo/nova-vale/rise-together-bts-01.mp4"],
              ["Studio take two", "/video/demo/nova-vale/rise-together-bts-02.mp4"],
            ].map(([title, source]) => {
              return (
                <article
                  key={title}
                  className="overflow-hidden rounded-3xl border border-border bg-card"
                >
                  <video className="aspect-video w-full bg-black object-cover" controls preload="metadata" poster={title === "Studio take one" ? "/images/demo/nova-vale/epk/performance-portrait.webp" : "/images/demo/nova-vale/epk/songwriting-session.webp"}>
                    <source src={source} type="video/mp4" />
                  </video>
                  <div className="p-5">
                    <Badge variant="outline">AI-generated behind the scenes</Badge>
                    <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Short visual demonstration connected to “Rise Together.”
                    </p>
                  </div>
                </article>
              );
            })}
            <article className="flex flex-col justify-between rounded-3xl border border-rose-300/25 bg-rose-300/5 p-6">
              <div>
                <Film className="h-8 w-8 text-rose-300" />
                <Badge variant="outline" className="mt-5">Creator lesson</Badge>
                <h3 className="mt-3 text-xl font-semibold">Use video with purpose</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Nova can share the natural studio clips as process content, then publish a separate
                  edited version using an authorized excerpt of the song. The post should disclose
                  that the visual persona and clips are AI-generated.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section id="epk" className="border-y border-border/60 bg-surface/40">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[.2em] text-cyan-300">
                  EPK press images
                </p>
                <h2 className="mt-2 text-3xl font-semibold">One identity, several useful formats</h2>
                <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
                  A professional EPK needs more than one attractive picture. Nova's set includes a
                  vertical editorial portrait, a horizontal creative-process image, and a performance
                  image that editors, venues, playlists, and partners can crop for different uses.
                </p>
              </div>
              <Badge variant="outline" className="w-fit">AI-generated demonstration imagery</Badge>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild className="rounded-full bg-gradient-brand">
                <Link to="/demo/epk">Open complete Nova EPK</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <a href="/downloads/nova-vale-epk-one-sheet.pdf" download>Download one-sheet</a>
              </Button>
            </div>
            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {[
                ["Performance portrait", "/images/demo/nova-vale/epk-v2/nova-1.png", "Lead press, music coverage, and performance identity"],
                ["Country editorial", "/images/demo/nova-vale/epk-v2/nova-2.png", "Country-soul features and playlist promotion"],
                ["City-edge campaign", "/images/demo/nova-vale/epk-v2/nova-3.png", "Genre-crossing campaigns and digital culture"],
                ["Journey portrait", "/images/demo/nova-vale/epk-v2/nova-4.png", "Reinvention stories and geographic narrative"],
                ["Spoken-word studio", "/images/demo/nova-vale/epk-v2/nova-5.png", "Poetry, readings, and writing features"],
                ["Editorial portrait", "/images/demo/nova-vale/epk-v2/nova-6.png", "Biography, interviews, and lifestyle coverage"],
                ["After-hours portrait", "/images/demo/nova-vale/epk-v2/nova-7.png", "Personal essays and intimate supporter stories"],
              ].map(([title, source, use]) => (
                <figure key={title} className="overflow-hidden rounded-3xl border border-border bg-card">
                  <img src={source} alt={`Nova Vale ${title.toLowerCase()}`} className="aspect-[4/5] w-full object-cover" />
                  <figcaption className="p-5">
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{use}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="merch" className="border-y border-border/60 bg-surface/40">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-orange-300">
              Artist collection
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Merch, art, and objects with a story</h2>
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              Anyone can browse a public collection. These Nova concepts show how a product image,
              story, price, and availability work together—without pretending that an unfinished
              product can already be ordered.
            </p>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {novaMerch.map((item) => (
                <article
                  key={item.title}
                  className="overflow-hidden rounded-3xl border border-border bg-card"
                >
                  <img src={item.image} alt={item.title} className="aspect-square w-full object-cover" />
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[.14em] text-orange-300">{item.category}</p>
                    <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.story}</p>
                    <p className="mt-4 font-medium">{item.price}</p>
                    <Badge variant="outline" className="mt-3">{item.availability}</Badge>
                    <details className="mt-4 rounded-2xl border border-border/70 bg-background/50 p-4">
                      <summary className="cursor-pointer text-sm font-semibold">How this would be sold</summary>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.sale}</p>
                    </details>
                  </div>
                </article>
              ))}
            </div>
            <div id="merch-how-sales-work" className="mt-8 rounded-3xl border border-orange-300/25 bg-orange-300/5 p-6 md:p-8">
              <div className="flex items-start gap-4">
                <ShoppingCart className="mt-1 h-7 w-7 shrink-0 text-orange-300" />
                <div>
                  <h3 className="text-xl font-semibold">What supporters should expect</h3>
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div><p className="font-semibold">1. Browse publicly</p><p className="mt-2 text-sm leading-6 text-muted-foreground">A visitor can see active showcase items, their story, displayed price, and availability without creating an account.</p></div>
                    <div><p className="font-semibold">2. Buy only when ready</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Today a creator may use a clearly labeled external purchase link. VYBE checkout remains off until payment, payout, legal, refund, and support operations are activated.</p></div>
                    <div><p className="font-semibold">3. Know who fulfills it</p><p className="mt-2 text-sm leading-6 text-muted-foreground">A real offer must identify the seller, availability, shipping or delivery method, return terms, and who handles questions before payment.</p></div>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Badge variant="outline">No products on this demo page are for sale</Badge>
                    <span className="text-sm text-muted-foreground">Creator Free: 2 showcase items · Plus: 10 · Pro: 50 · Studio: 150</span>
                  </div>
                </div>
              </div>
            </div>
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
