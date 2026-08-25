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
import { publicPlayContentService } from "@/services/play/publicPlayContentService";
import { publicPlayGamePackService } from "@/services/play/publicPlayGamePackService";
import { PublishedGamePacks } from "@/features/play/games/PublishedGamePacks";

const demoTrivia = [
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
    detail: "Choose from every active VYBE game.",
    href: "#game-library",
    status: "Available now",
    icon: Gamepad2,
    image: "/images/play/games/beat-blitz-cover-v1.webp",
  },
  {
    title: "Explore Music",
    detail: "Browse public creators, songs, cities, and genres.",
    href: "/explore",
    status: "Available now",
    icon: Map,
    image: "/images/supporter-cards/discover.webp",
  },
  {
    title: "Discover",
    detail: "Follow new sounds into creator pages and stories.",
    href: "/explore",
    status: "Available now",
    icon: Compass,
    image: "/images/supporter-cards/discover.webp",
  },
  {
    title: "Learn",
    detail: "Short, interactive lessons connected to creators.",
    href: "#play-roadmap",
    status: "Coming soon",
    icon: BookOpen,
    image: "/images/experience-cards/learn.webp",
  },
  {
    title: "Spotlight",
    detail: "Meet Nova Vale, VYBE's fictional demo creator.",
    href: "#spotlight",
    status: "Available now",
    icon: Star,
    image: "/images/demo/nova-vale/banner.webp",
  },
  {
    title: "Challenges",
    detail: "Try the current creator discovery demonstration.",
    href: "#spotlight",
    status: "Demo",
    icon: Trophy,
    image: "/images/experience-cards/challenges.webp",
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
  const [triviaItems, setTriviaItems] = useState(demoTrivia);
  const question = triviaItems[Math.min(questionIndex, triviaItems.length - 1)];
  const pollTotal = 126 + (poll ? 1 : 0);
  const pollResults = useMemo(
    () => ({
      "Studio version": Math.round(((68 + (poll === "Studio version" ? 1 : 0)) / pollTotal) * 100),
      "Live version": Math.round(((58 + (poll === "Live version" ? 1 : 0)) / pollTotal) * 100),
    }),
    [poll, pollTotal],
  );

  useEffect(() => {
    let active = true;
    void publicPlayGamePackService
      .listReleased()
      .then((packs) => packs.find((pack) => pack.game_type === "beat_blitz")?.items ?? [])
      .then(async (packItems) =>
        packItems.length ? packItems : publicPlayContentService.listReleased("beat_blitz"),
      )
      .then((items) => {
        const released = items.flatMap((item) => {
          const choices = item.payload.choices ?? [];
          const answer = choices.indexOf(item.payload.answer ?? "");
          if (choices.length < 2 || answer < 0) return [];
          return [{ question: item.prompt, choices, answer, explanation: item.explanation }];
        });
        if (active && released.length) {
          setTriviaItems(released);
          setQuestionIndex(0);
          setSelected(null);
          setScore(0);
          setFinished(false);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

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
    if (questionIndex === triviaItems.length - 1) {
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
        <div className="mx-auto max-w-6xl px-5 py-9 text-center sm:px-6 sm:py-16 md:py-24">
          <Badge className="border-lime-700/40 bg-lime-100 text-lime-900 dark:border-lime-300/30 dark:bg-lime-300/10 dark:text-lime-200">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Play on VYBE · Available now
          </Badge>
          <h1 className="mx-auto mt-4 max-w-4xl text-3xl font-bold tracking-tight sm:mt-5 sm:text-4xl md:text-6xl">
            Discovery becomes something you do.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:mt-5 sm:text-lg sm:leading-8">
            {isMember
              ? "Play progress is saved on this device and synchronized after reconnection. Offline results remain casual and unverified."
              : "Try VYBE activities without an account. Casual progress stays on this device, including while you are offline."}
          </p>
          <div className="mt-4 flex justify-center sm:mt-6">
            <div className="flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs sm:gap-2 sm:px-4 sm:py-2 sm:text-sm">
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

      <section className="mx-auto max-w-6xl px-5 pb-2 pt-5 sm:hidden">
        <div className="mb-3">
          <p className="text-sm font-medium text-primary">Play now</p>
          <h2 className="mt-1 text-2xl font-semibold">Choose a game to play</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Start with an available game. More game types will appear here as they are ready.
          </p>
        </div>
        <PublishedGamePacks />
      </section>

      <section className="mx-auto max-w-6xl px-5 py-7 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Game options</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-3xl">Pick how you want to play</h2>
          </div>
          <p className="max-w-lg text-xs leading-5 text-muted-foreground sm:text-sm">
            Filter available games or use a quick Play option. Preview areas stay clearly labeled.
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-border/70 bg-card p-4 sm:mt-8 sm:rounded-[2rem] sm:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary sm:text-sm sm:normal-case sm:tracking-normal">Game filter</p>
              <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Play by genre—or mix it up</h2>
            </div>
            <p className="max-w-lg text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
              Mixed VYBE is available now. Other filters unlock as their game content is ready.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-6 sm:gap-2" role="group" aria-label="Play genre">
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
                  className={`rounded-full border px-3 py-1.5 text-xs transition sm:px-4 sm:py-2 sm:text-sm ${
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
          <div className="mt-3 text-xs text-muted-foreground sm:mt-4 sm:text-sm" aria-live="polite">
            <p>
              Today’s game selection:{" "}
              <span className="font-semibold text-foreground">{playGenre}</span>
            </p>
            {genreNotice && <p className="mt-1 font-medium text-primary">{genreNotice}</p>}
          </div>
        </div>

        <div className="mt-5 hidden gap-3 sm:grid sm:grid-cols-2 sm:mt-7 sm:gap-4 lg:grid-cols-3">
          {playDestinations.map((destination) => (
            <a
              key={destination.title}
              href={destination.href}
              className="group min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card transition hover:-translate-y-0.5 hover:border-primary/40 sm:rounded-3xl"
            >
              <div className="relative aspect-[16/8] overflow-hidden border-b border-border/60 sm:aspect-video">
                <img src={destination.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-black/25" />
              </div>
              <div className="p-3 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11 sm:rounded-2xl"><destination.icon className="h-4 w-4 sm:h-5 sm:w-5" /></span>
                  <Badge variant="outline" className="max-w-[5.75rem] truncate rounded-full px-1.5 text-[9px] sm:max-w-none sm:px-2.5 sm:text-[11px]">{destination.status}</Badge>
                </div>
                <h3 className="mt-3 text-sm font-semibold sm:mt-5 sm:text-lg">{destination.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground sm:mt-2 sm:text-sm sm:leading-6">{destination.detail}</p>
                <span className="mt-2.5 flex items-center gap-1 text-xs font-medium text-primary sm:mt-4 sm:gap-2 sm:text-sm">{destination.status === "Coming soon" ? "See the roadmap" : "Open"}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-brand p-3.5 text-white sm:mt-6 sm:rounded-[2rem] sm:p-8">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_.9fr] lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-white/80">
                <Sparkles className="h-4 w-4" /> Quick pick
              </p>
              <h2 className="mt-1 text-xl font-semibold sm:mt-2 sm:text-3xl">Surprise Me</h2>
              <p className="mt-1.5 max-w-xl text-xs leading-5 text-white/80 sm:mt-3 sm:text-base sm:leading-7">
                Not sure what to choose? Let VYBE pick an available activity for you.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-3 w-full rounded-full sm:mt-5 sm:w-auto"
                onClick={revealSurprise}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {surprise ? "Surprise me again" : "Reveal my surprise"}
              </Button>
            </div>
            <div className="rounded-2xl border border-white/20 bg-black/20 p-4 sm:rounded-3xl sm:p-6" aria-live="polite">
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

      <div className="hidden sm:block">
        <PublishedGamePacks />
      </div>

      <section className="border-y border-border/60 bg-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-9 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary sm:text-sm sm:normal-case sm:tracking-normal">More to play</p>
              <h2 className="mt-1 text-xl font-semibold sm:text-3xl">Daily VYBE</h2>
            </div>
            <p className="max-w-lg text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
              Quick activities and rotating reasons to come back and play.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-7 sm:gap-4 lg:grid-cols-4">
            {DAILY_PLAY_ITEMS.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="min-w-0 rounded-2xl border border-border bg-card p-3 transition hover:-translate-y-0.5 hover:border-primary/40 sm:rounded-3xl sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <Badge variant="outline">{item.cadence}</Badge>
                </div>
                <h3 className="mt-3 text-sm font-semibold sm:mt-5 sm:text-base">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground sm:mt-2 sm:text-sm sm:leading-6">{item.detail}</p>
                <p className="mt-2.5 text-[10px] font-medium uppercase tracking-wider text-primary sm:mt-4 sm:text-xs">
                  {item.status}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-9 sm:px-6 sm:py-16">
        <div className="grid gap-5 sm:gap-8 lg:grid-cols-[1.15fr_.85fr]">
          <article
            id="trivia"
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-lime-300/25 bg-card shadow-xl shadow-lime-300/5 sm:rounded-[2rem]"
          >
            <div className="relative aspect-[16/5] overflow-hidden bg-muted sm:aspect-[16/7]">
              <img
                src="/images/play/games/beat-blitz-cover-v1.webp"
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
            </div>
            <div className="p-4 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.18em] text-lime-300">
                    Available now
                  </p>
                  <h2 className="mt-1 text-xl font-semibold sm:mt-2 sm:text-2xl">VYBE Music Trivia</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{playGenre} pilot round</p>
                </div>
                <Badge variant="outline">
                  Question {finished ? triviaItems.length : questionIndex + 1} of{" "}
                  {triviaItems.length}
                </Badge>
              </div>

              {finished ? (
                <div className="py-10 text-center">
                  <Trophy className="mx-auto h-14 w-14 text-lime-300" />
                  <h3 className="mt-5 text-3xl font-semibold">
                    You scored {score} of {triviaItems.length}
                  </h3>
                  <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                    This casual result is saved on this device. Signed-in progress synchronizes
                    after reconnection, but offline scores are never treated as verified competition
                    results.
                  </p>
                  <Button onClick={restartTrivia} className="mt-6 rounded-full">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Play again
                  </Button>
                </div>
              ) : (
                <div className="mt-8">
                  <div className="mb-6 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-lime-400 transition-all duration-500"
                      style={{ width: `${((questionIndex + 1) / triviaItems.length) * 100}%` }}
                    />
                  </div>
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
                        {questionIndex === triviaItems.length - 1 ? "See score" : "Next question"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </article>

          <article
            id="build-your-vybe"
            className="scroll-mt-24 rounded-2xl border border-primary/25 bg-card p-4 sm:rounded-[2rem] sm:p-8"
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
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-9 sm:gap-8 sm:px-6 sm:py-16 md:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">
              Daily VYBE Poll
            </p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Studio version or live version?</h2>
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
                className={`rounded-2xl border p-4 text-left transition sm:rounded-3xl sm:p-6 ${
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

      <section id="spotlight" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-9 sm:px-6 sm:py-16">
        <div className="rounded-2xl border border-primary/25 bg-card p-4 sm:rounded-[2rem] sm:p-8 md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <p className="text-sm font-semibold text-primary">Creator Spotlight Challenge</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Meet Nova Vale, then explore the clues</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              The guided demo profile shows how future challenges can connect music, stories, merch,
              video, access levels, and creator discovery.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="mt-4 w-full shrink-0 rounded-full bg-gradient-brand sm:mt-6 sm:w-auto md:mt-0"
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
          className="mt-5 scroll-mt-24 rounded-2xl border border-dashed border-border p-4 text-center sm:mt-8 sm:rounded-3xl sm:p-6"
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
