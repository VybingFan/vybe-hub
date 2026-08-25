import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Gamepad2,
  Gem,
  Layers3,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { NonMusicPlayPreviews } from "@/features/play/games/NonMusicPlayPreviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  publicPlayGamePackService,
  type ReleasedPlayGamePack,
} from "@/services/play/publicPlayGamePackService";

const GAME_COVERS = {
  beat_blitz: "/images/play/games/beat-blitz-cover-v1.webp",
  hidden_gems: "/images/play/games/hidden-gems-cover-v1.webp",
  vybe_match: "/images/play/games/vybe-match-cover-v1.webp",
  daily_vybe: "/images/play/games/beat-blitz-cover-v1.webp",
} as const;

const FOCUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "music", label: "Music" },
  { key: "film", label: "Film / Video" },
  { key: "acting", label: "Acting" },
  { key: "theater", label: "Theater" },
  { key: "comedy", label: "Comedy" },
  { key: "podcasting", label: "Podcasting" },
  { key: "writing", label: "Writing / Poetry" },
  { key: "dance", label: "Dance" },
  { key: "visual_art", label: "Visual Art" },
  { key: "cross_focus", label: "Connect the VYBE" },
] as const;

type FocusFilter = (typeof FOCUS_FILTERS)[number]["key"];

function focusLabel(pack: ReleasedPlayGamePack) {
  if (pack.focus_scope === "cross_focus") return "Connect the VYBE";
  if (pack.focus_scope === "legacy") return "Music";
  return FOCUS_FILTERS.find((entry) => entry.key === pack.creator_focus)?.label ?? "VYBE";
}

function coverFor(pack: ReleasedPlayGamePack) {
  return pack.artwork_url || GAME_COVERS[pack.game_type];
}

function stylePromptLabel(pack: ReleasedPlayGamePack) {
  if (pack.game_style === "true_or_made_up") return "True or made up?";
  if (pack.game_style === "fact_or_myth") return "Fact or myth?";
  if (pack.game_style === "real_or_made_up") return "Real or made up?";
  if (pack.game_style === "speed_round") return "Speed round";
  if (pack.game_style === "origin_challenge") return "Origin challenge";
  if (pack.game_type === "hidden_gems") return "Clue";
  if (pack.game_type === "daily_vybe") return "Daily prompt";
  return "Question";
}

export function PublishedGamePacks() {
  const [packs, setPacks] = useState<ReleasedPlayGamePack[]>([]);
  const [selectedFocus, setSelectedFocus] = useState<FocusFilter>("all");

  useEffect(() => {
    let active = true;
    void publicPlayGamePackService
      .listReleased()
      .then((next) => {
        if (active) {
          const playable = next.filter((pack) => pack.items.length);
          setPacks(playable);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (!packs.length) return null;
  const filteredPacks = packs.filter((pack) => {
    if (selectedFocus === "all") return true;
    if (selectedFocus === "cross_focus") return pack.focus_scope === "cross_focus";
    if (selectedFocus === "music") {
      return pack.focus_scope === "legacy" || pack.creator_focus === "music";
    }
    return pack.creator_focus === selectedFocus;
  });

  return (
    <section id="game-library" className="scroll-mt-24 border-t border-border/60 bg-surface/40">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-medium text-primary">Games</p>
        <h2 className="mt-1 text-3xl font-semibold">Choose a game to play</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Pick any active game below. New reviewed game packs appear here automatically.
        </p>
        <NonMusicPlayPreviews />
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter VYBE games by creator focus">
          {FOCUS_FILTERS.map((focus) => (
            <button
              key={focus.key}
              type="button"
              aria-pressed={selectedFocus === focus.key}
              onClick={() => {
                setSelectedFocus(focus.key);
              }}
              className={`rounded-full border px-3 py-2 text-sm transition ${
                selectedFocus === focus.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              {focus.label}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPacks.map((pack) => {
            const Icon =
              pack.game_type === "beat_blitz"
                ? Gamepad2
                : pack.game_type === "vybe_match"
                  ? Layers3
                  : pack.game_type === "hidden_gems"
                    ? Gem
                    : Sparkles;
            const itemCount =
              pack.game_type === "vybe_match"
                ? pack.items.reduce((total, item) => total + (item.payload.matches?.length ?? 0), 0)
                : pack.items.length;
            return (
              <Link
                key={pack.id}
                to="/play/$packId"
                params={{ packId: pack.id }}
                className="group overflow-hidden rounded-3xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="-mx-5 -mt-5 mb-5 aspect-video overflow-hidden rounded-t-[1.45rem] bg-muted">
                  <img
                    src={coverFor(pack)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <Badge variant="outline">{itemCount} to play</Badge>
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  {focusLabel(pack)}{pack.topic ? ` · ${pack.topic}` : ""}
                </p>
                <h3 className="mt-2 font-semibold">{pack.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{pack.description}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-primary">
                  Play now
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ReleasedGamePackPlayer({ pack }: { pack: ReleasedPlayGamePack }) {
  if (pack.game_type === "vybe_match") return <MatchPlayer pack={pack} />;
  return <ChoicePlayer pack={pack} />;
}

function ChoicePlayer({ pack }: { pack: ReleasedPlayGamePack }) {
  const playable = useMemo(
    () =>
      pack.items.filter((item) => (item.payload.choices?.length ?? 0) >= 2 && item.payload.answer),
    [pack.items],
  );
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  if (!playable.length) return null;
  const item = playable[index];
  const Icon = pack.game_type === "hidden_gems" ? Gem : Sparkles;
  function choose(value: string) {
    if (answer) return;
    setAnswer(value);
    if (value === item.payload.answer) setScore((current) => current + 1);
  }
  function next() {
    if (index === playable.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setAnswer(null);
  }
  function restart() {
    setIndex(0);
    setAnswer(null);
    setScore(0);
    setFinished(false);
  }
  return (
    <article className="overflow-hidden rounded-[2rem] border border-primary/25 bg-card shadow-xl shadow-primary/5">
      <div className="relative aspect-[16/7] overflow-hidden bg-muted">
        <img
          src={coverFor(pack)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
        <Badge className="absolute right-4 top-4 border-white/20 bg-black/55 text-white backdrop-blur">
          Score {score}
        </Badge>
      </div>
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 text-2xl font-semibold">{pack.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{pack.description}</p>
          </div>
          <Badge variant="outline">{pack.genre}</Badge>
        </div>
        {finished ? (
          <div className="py-8 text-center">
            <p className="text-2xl font-semibold">
              {score} of {playable.length}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button onClick={restart}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Play again
              </Button>
              {pack.discovery_url ? (
                <Button asChild variant="outline">
                  <a href={pack.discovery_url}>
                    Discover creators <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-7">
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-lime-400 transition-all duration-500"
                style={{ width: `${((index + 1) / playable.length) * 100}%` }}
              />
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              {stylePromptLabel(pack)} {index + 1} of{" "}
              {playable.length}
            </p>
            <p className="mt-2 text-lg font-semibold leading-7">{item.prompt}</p>
            <div className="mt-4 grid gap-2">
              {item.payload.choices!.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => choose(choice)}
                  className={`rounded-2xl border p-3 text-left ${answer && choice === item.payload.answer ? "border-lime-400 bg-lime-400/10" : answer === choice ? "border-destructive bg-destructive/10" : "border-border hover:border-primary/40"}`}
                >
                  {choice}
                </button>
              ))}
            </div>
            {answer ? (
              <div className="mt-4 rounded-2xl bg-muted p-4">
                <p className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-lime-500" />
                  {answer === item.payload.answer ? "Correct" : `Answer: ${item.payload.answer}`}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{item.explanation}</p>
                <Button size="sm" className="mt-4" onClick={next}>
                  {index === playable.length - 1 ? "See score" : "Next"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}

function MatchPlayer({ pack }: { pack: ReleasedPlayGamePack }) {
  const matches = useMemo(
    () => pack.items.flatMap((item) => item.payload.matches ?? []),
    [pack.items],
  );
  const answers = useMemo(
    () => Array.from(new Set(matches.map((match) => match.right))).sort(),
    [matches],
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  if (!matches.length) return null;
  const match = matches[index];
  function choose(value: string) {
    if (selected) return;
    setSelected(value);
    if (value === match.right) setScore((current) => current + 1);
  }
  function next() {
    if (index === matches.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setSelected(null);
  }
  function restart() {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }
  return (
    <article className="overflow-hidden rounded-[2rem] border border-violet-400/25 bg-card shadow-xl shadow-violet-500/5">
      <div className="relative aspect-[16/7] overflow-hidden bg-muted">
        <img
          src={coverFor(pack)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
      </div>
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Layers3 className="h-5 w-5 text-violet-400" />
            <h3 className="mt-3 text-2xl font-semibold">{pack.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{pack.description}</p>
          </div>
          <Badge variant="outline">Score {score}</Badge>
        </div>
        {finished ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-lime-400" />
            <p className="mt-4 text-2xl font-semibold">
              You matched {score} of {matches.length}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button onClick={restart}>
                <RotateCcw className="mr-2 h-4 w-4" /> Play again
              </Button>
              {pack.discovery_url ? (
                <Button asChild variant="outline">
                  <a href={pack.discovery_url}>
                    Discover creators <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="mt-7 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${((index + 1) / matches.length) * 100}%` }}
              />
            </div>
            <p className="mt-7 text-sm text-muted-foreground">Find the match for:</p>
            <p className="mt-1 text-xl font-semibold">{match.left}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {answers.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => choose(value)}
                  className={`rounded-2xl border p-3 text-left ${selected && value === match.right ? "border-lime-400 bg-lime-400/10" : selected === value ? "border-destructive bg-destructive/10" : "border-border hover:border-violet-400/50"}`}
                >
                  {value}
                </button>
              ))}
            </div>
            {selected ? (
              <Button size="sm" className="mt-4" onClick={next}>
                Next match
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}
