import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Compass,
  Gamepad2,
  Headphones,
  Lightbulb,
  Map,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AVAILABLE_PLAY_GENRES,
  DAILY_PLAY_ITEMS,
  PLAY_GENRES,
  type PlayGenre,
} from "@/features/play/content";
import {
  loadOfflinePlayProgress,
  saveOfflinePlayProgress,
  syncOfflinePlayProgress,
} from "@/features/play/offlineProgress";

const trivia = [
  {
    question: "Which role is primarily responsible for shaping the overall sound of a recording?",
    choices: ["Music producer", "Tour manager", "Booking agent", "Photographer"],
    answer: 0,
    explanation: "A music producer guides creative and technical decisions across a recording.",
  },
  {
    question: "What does BPM measure in music?",
    choices: ["Song length", "Tempo", "File size", "Vocal range"],
    answer: 1,
    explanation: "BPM means beats per minute and describes how quickly the pulse moves.",
  },
  {
    question:
      "Which VYBE feature lets a creator choose songs in a deliberate order and share one link?",
    choices: ["Creator playlist", "Merch showcase", "Public bio", "Video draft"],
    answer: 0,
    explanation:
      "Creator playlists organize selected songs in order and publish a unique share link.",
  },
];

const vibeChoices = [
  {
    label: "Midnight Soul",
    detail: "Atmospheric, reflective, and built for late-night discovery.",
  },
  { label: "Live-Wire Energy", detail: "Bold, social, and happiest near a stage or crowd." },
  {
    label: "Story Seeker",
    detail: "Drawn to lyrics, credits, context, and the person behind the work.",
  },
  { label: "Genre Explorer", detail: "Always ready to cross scenes, sounds, cities, and eras." },
];

const playDestinations = [
  {
    title: "Games",
    detail: "Start with VYBE Music Trivia.",
    href: "#trivia",
    status: "Available now",
    icon: Gamepad2,
  },
  {
    title: "Explore Music",
    detail: "Browse public creators, songs, cities, and genres.",
    href: "/explore",
    status: "Available now",
    icon: Map,
  },
  {
    title: "Discover",
    detail: "Follow new sounds into creator pages and stories.",
    href: "/explore",
    status: "Available now",
    icon: Compass,
  },
  {
    title: "Learn",
    detail: "Short, interactive lessons connected to creators.",
    href: "#play-roadmap",
    status: "Coming soon",
    icon: BookOpen,
  },
  {
    title: "Spotlight",
    detail: "Meet Nova Vale, VYBE's fictional demo creator.",
    href: "#spotlight",
    status: "Available now",
    icon: Star,
  },
  {
    title: "Challenges",
    detail: "Try the current creator discovery demonstration.",
    href: "#spotlight",
    status: "Demo",
    icon: Trophy,
  },
] as const;

const surpriseOptions = [
  {
    title: "Test your music knowledge",
    detail: "Play the current three-question VYBE Music Trivia round.",
    href: "#trivia",
  },
  {
    title: "Build your discovery blend",
    detail: "Choose the sounds, stories, and energy that feel most like you.",
    href: "#build-your-vybe",
  },
  {
    title: "Cast today's demo vote",
    detail: "Choose between the studio version and the live version.",
    href: "#daily-poll",
  },
  {
    title: "Meet Nova Vale",
    detail: "Explore music, stories, video, merch, community, and events.",
    href: "/demo/creator",
  },
  {
    title: "Explore public VYBE music",
    detail: "Browse published creators and tracks without an account.",
    href: "/explore",
  },
] as const;

type SurpriseOption = (typeof surpriseOptions)[number];

export function PlayExperience({ isMember = false }: { isMember?: boolean }) {
  const [initialProgress] = useState(loadOfflinePlayProgress);
  const [playGenre, setPlayGenre] = useState<PlayGenre>(initialProgress.playGenre);
  const [genreNotice, setGenreNotice] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(initialProgress.questionIndex);
  const [score, setScore] = useState(initialProgress.score);
  const [selected, setSelected] = useState<number | null>(initialProgress.selected);
  const [finished, setFinished] = useState(initialProgress.finished);
  const [vibes, setVibes] = useState<number[]>(initialProgress.vibes);
  const [poll, setPoll] = useState<string | null>(initialProgress.poll);
  const [surprise, setSurprise] = useState<SurpriseOption | null>(
    surpriseOptions.find((option) => option.title === initialProgress.surpriseTitle) ?? null,
  );
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [syncState, setSyncState] = useState<"saved" | "pending" | "synced" | "local">(
    online ? "saved" : "pending",
  );
  const question = trivia[questionIndex];
  const pollTotal = 126 + (poll ? 1 : 0);
  const pollResults = useMemo(
    () => ({
      "Studio version": Math.round(((68 + (poll === "Studio version" ? 1 : 0)) / pollTotal) * 100),
      "Live version": Math.round(((58 + (poll === "Live version" ? 1 : 0)) / pollTotal) * 100),
    }),
    [poll, pollTotal],
  );

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const saved = saveOfflinePlayProgress({
        playGenre,
        questionIndex,
        score,
        selected,
        finished,
        vibes,
        poll,
        surpriseTitle: surprise?.title ?? null,
      });
      if (!online) {
        setSyncState("pending");
        return;
      }
      setSyncState("saved");
      void syncOfflinePlayProgress(saved)
        .then((result) => setSyncState(result))
        .catch(() => setSyncState("pending"));
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [finished, online, playGenre, poll, questionIndex, score, selected, surprise, vibes]);

  function chooseTrivia(choice: number) {
    if (selected !== null) return;
    setSelected(choice);
    if (choice === question.answer) setScore((value) => value + 1);
  }

  function nextQuestion() {
    if (questionIndex === trivia.length - 1) {
      setFinished(true);
      return;
    }
    setQuestionIndex((value) => value + 1);
    setSelected(null);
  }

  function restartTrivia() {
    setQuestionIndex(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
  }

  function toggleVibe(index: number) {
    setVibes((current) => {
      if (current.includes(index)) return current.filter((choice) => choice !== index);
      if (current.length === 3) return current;
      return [...current, index];
    });
  }

  function revealSurprise() {
    const eligibleOptions = surpriseOptions.filter((option) => option.title !== surprise?.title);
    const next = eligibleOptions[Math.floor(Math.random() * eligibleOptions.length)];
    setSurprise(next);
  }

  function chooseGenre(genre: PlayGenre) {
    if (!AVAILABLE_PLAY_GENRES.includes(genre)) return;
    setPlayGenre(genre);
    restartTrivia();
    setGenreNotice(`${genre} selected. Opening today’s trivia round.`);
    window.requestAnimationFrame(() => {
      document.getElementById("trivia")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  return (
    <main>
      <section className="border-b border-border/60 bg-gradient-hero">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center md:py-24">
          <Badge className="border-lime-700/40 bg-lime-100 text-lime-900 dark:border-lime-300/30 dark:bg-lime-300/10 dark:text-lime-200">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Play on VYBE · Available now
          </Badge>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Discovery becomes something you do.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            {isMember
              ? "Play progress is saved on this device and synchronized after reconnection. Offline results remain casual and unverified."
              : "Try VYBE activities without an account. Casual progress stays on this device, including while you are offline."}
          </p>
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-sm">
              {online ? (
                <Wifi className="h-4 w-4 text-lime-600 dark:text-lime-300" />
              ) : (
                <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              )}
              <span className="font-medium">{online ? "Online" : "Offline Play"}</span>
              <span className="text-muted-foreground">
                ·{" "}
                {syncState === "synced"
                  ? "Progress synced"
                  : syncState === "pending"
                    ? "Saved here · waiting to sync"
                    : "Progress saved on this device"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Play Home</p>
            <h2 className="mt-1 text-3xl font-semibold">What sounds fun today?</h2>
          </div>
          <p className="max-w-lg text-sm text-muted-foreground">
            Live activities open now. Preview destinations are labeled clearly while VYBE grows.
          </p>
        </div>

        <div className="mt-8 rounded-[2rem] border border-border/70 bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Choose your game VYBE</p>
              <h2 className="mt-1 text-2xl font-semibold">Play by genre—or mix it up</h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-muted-foreground">
              Mixed VYBE is open for the pilot. Individual genres activate only after their
              Knowledge Engine content is reviewed and deep enough to avoid repetition.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Play genre">
            {PLAY_GENRES.map((genre) => {
              const available = AVAILABLE_PLAY_GENRES.includes(genre);
              const active = playGenre === genre;
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => chooseGenre(genre)}
                  disabled={!available}
                  aria-pressed={active}
                  title={available ? `Play ${genre}` : `${genre} content is being prepared`}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : available
                        ? "border-border bg-background hover:border-primary/50"
                        : "cursor-not-allowed border-border/60 bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {genre}
                  {!available && <span className="ml-2 text-[10px] uppercase">Soon</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-4 text-sm text-muted-foreground" aria-live="polite">
            <p>
              Today’s game selection:{" "}
              <span className="font-semibold text-foreground">{playGenre}</span>
            </p>
            {genreNotice && <p className="mt-1 font-medium text-primary">{genreNotice}</p>}
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playDestinations.map((destination) => (
            <a
              key={destination.title}
              href={destination.href}
              className="group rounded-3xl border border-border/70 bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <destination.icon className="h-5 w-5" />
                </span>
                <Badge variant="outline" className="rounded-full text-[11px]">
                  {destination.status}
                </Badge>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{destination.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{destination.detail}</p>
              <span className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
                {destination.status === "Coming soon" ? "See the roadmap" : "Open"}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </a>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-primary/30 bg-gradient-brand p-6 text-white sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_.9fr] lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-white/80">
                <Sparkles className="h-4 w-4" /> Signature Play action
              </p>
              <h2 className="mt-2 text-3xl font-semibold">Surprise Me</h2>
              <p className="mt-3 max-w-xl leading-7 text-white/80">
                Reveal one eligible public VYBE activity or destination. Locked and unfinished
                subscriber content is never included.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-5 rounded-full"
                onClick={revealSurprise}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {surprise ? "Surprise me again" : "Reveal my surprise"}
              </Button>
            </div>
            <div className="rounded-3xl border border-white/20 bg-black/20 p-6" aria-live="polite">
              {surprise ? (
                <>
                  <p className="text-sm text-white/70">Your surprise</p>
                  <h3 className="mt-2 text-2xl font-semibold">{surprise.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/80">{surprise.detail}</p>
                  <Button asChild variant="secondary" className="mt-5 rounded-full">
                    <a href={surprise.href}>
                      Open surprise <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </>
              ) : (
                <div className="py-4 text-center">
                  <Lightbulb className="mx-auto h-10 w-10 text-white/75" />
                  <p className="mt-3 font-medium">Your next VYBE is waiting.</p>
                  <p className="mt-1 text-sm text-white/65">
                    Select the button to reveal a real destination.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-surface/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Daily VYBE</p>
              <h2 className="mt-1 text-3xl font-semibold">A fresh reason to return</h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-muted-foreground">
              Quick activities use approved VYBE knowledge and creator-authorized material. Saved
              streaks and history come in a later account phase.
            </p>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DAILY_PLAY_ITEMS.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="rounded-3xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <Badge variant="outline">{item.cadence}</Badge>
                </div>
                <h3 className="mt-5 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-primary">
                  {item.status}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
          <article
            id="trivia"
            className="scroll-mt-24 rounded-[2rem] border border-lime-300/25 bg-card p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-lime-300">
                  Available now
                </p>
                <h2 className="mt-2 text-2xl font-semibold">VYBE Music Trivia</h2>
                <p className="mt-1 text-sm text-muted-foreground">{playGenre} pilot round</p>
              </div>
              <Badge variant="outline">
                Question {finished ? trivia.length : questionIndex + 1} of {trivia.length}
              </Badge>
            </div>

            {finished ? (
              <div className="py-10 text-center">
                <Trophy className="mx-auto h-14 w-14 text-lime-300" />
                <h3 className="mt-5 text-3xl font-semibold">
                  You scored {score} of {trivia.length}
                </h3>
                <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                  This casual result is saved on this device. Signed-in progress synchronizes after
                  reconnection, but offline scores are never treated as verified competition
                  results.
                </p>
                <Button onClick={restartTrivia} className="mt-6 rounded-full">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Play again
                </Button>
              </div>
            ) : (
              <div className="mt-8">
                <h3 className="text-xl font-semibold leading-8">{question.question}</h3>
                <div className="mt-5 grid gap-3">
                  {question.choices.map((choice, index) => {
                    const correct = selected !== null && index === question.answer;
                    const wrong = selected === index && index !== question.answer;
                    return (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => chooseTrivia(index)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          correct
                            ? "border-lime-300 bg-lime-300/10"
                            : wrong
                              ? "border-destructive bg-destructive/10"
                              : "border-border bg-background/50 hover:border-primary/40"
                        }`}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
                {selected !== null && (
                  <div className="mt-5 rounded-2xl border border-border bg-background/60 p-4">
                    <p className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="h-5 w-5 text-lime-300" />
                      {selected === question.answer
                        ? "Correct"
                        : "The correct answer is highlighted"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{question.explanation}</p>
                    <Button onClick={nextQuestion} className="mt-4 rounded-full">
                      {questionIndex === trivia.length - 1 ? "See score" : "Next question"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </article>

          <article
            id="build-your-vybe"
            className="scroll-mt-24 rounded-[2rem] border border-primary/25 bg-card p-6 sm:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">
              Available now
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Build Your VYBE</h2>
            <p className="mt-3 text-muted-foreground">
              Choose up to three discovery styles that feel most like you.
            </p>
            <p className="mt-2 text-sm font-medium text-primary">{vibes.length} of 3 selected</p>
            <div className="mt-6 grid gap-3">
              {vibeChoices.map((choice, index) => (
                <button
                  key={choice.label}
                  type="button"
                  onClick={() => toggleVibe(index)}
                  aria-pressed={vibes.includes(index)}
                  disabled={vibes.length === 3 && !vibes.includes(index)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    vibes.includes(index)
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background/50 hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
                  }`}
                >
                  <span className="font-semibold">{choice.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{choice.detail}</span>
                </button>
              ))}
            </div>
            {vibes.length > 0 && (
              <div className="mt-5 rounded-2xl bg-gradient-brand p-5 text-white">
                <p className="text-sm text-white/75">Your current VYBE blend</p>
                <p className="mt-1 text-xl font-semibold">
                  {vibes.map((index) => vibeChoices[index].label).join(" · ")}
                </p>
                <p className="mt-2 text-sm text-white/85">
                  Your selections can shape future creator, story, event, and playlist discovery.
                </p>
              </div>
            )}
          </article>
        </div>
      </section>

      <section id="daily-poll" className="scroll-mt-24 border-y border-border/60 bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">
              Daily VYBE Poll
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Studio version or live version?</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Vote once in this demonstration. Offline choices are saved on this device and
              synchronized for signed-in members after reconnection.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Studio version", "Live version"].map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setPoll(choice)}
                disabled={poll !== null}
                className={`rounded-3xl border p-6 text-left transition ${
                  poll === choice
                    ? "border-cyan-300 bg-cyan-300/10"
                    : "border-border bg-card hover:border-cyan-300/50"
                }`}
              >
                <Headphones className="h-7 w-7 text-cyan-300" />
                <p className="mt-5 text-xl font-semibold">{choice}</p>
                {poll && (
                  <>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-cyan-300"
                        style={{ width: `${pollResults[choice as keyof typeof pollResults]}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {pollResults[choice as keyof typeof pollResults]}% of demo votes
                    </p>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="spotlight" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
        <div className="rounded-[2rem] border border-primary/25 bg-card p-8 md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <p className="text-sm font-semibold text-primary">Creator Spotlight Challenge</p>
            <h2 className="mt-2 text-3xl font-semibold">Meet Nova Vale, then explore the clues</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              The guided demo profile shows how future challenges can connect music, stories, merch,
              video, access levels, and creator discovery.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="mt-6 shrink-0 rounded-full bg-gradient-brand md:mt-0"
          >
            <Link to="/demo/creator">
              Open creator spotlight
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Points, saved scores, leaderboards, rewards, lyric games, and audio-identification games
          remain future features requiring account, rights, fairness, and moderation design.
        </p>
        <div
          id="play-roadmap"
          className="mt-8 scroll-mt-24 rounded-3xl border border-dashed border-border p-6 text-center"
        >
          <p className="text-sm font-medium text-primary">What comes next</p>
          <h2 className="mt-2 text-2xl font-semibold">Learn, challenges, and member progress</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            These areas will open in phases after rights, access, moderation, and progress rules are
            approved. Nothing here is presented as an active paid or rewards program.
          </p>
          {!isMember && (
            <Button asChild variant="outline" className="mt-5 rounded-full">
              <Link to="/auth/sign-up">
                Create a free account <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
