import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Gamepad2,
  Gem,
  Layers3,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  publicPlayGamePackService,
  type ReleasedPlayGamePack,
} from "@/services/play/publicPlayGamePackService";

export function PublishedGamePacks() {
  const [packs, setPacks] = useState<ReleasedPlayGamePack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void publicPlayGamePackService
      .listReleased()
      .then((next) => {
        if (active) {
          const playable = next.filter((pack) => pack.items.length);
          setPacks(playable);
          setSelectedPackId(playable.find((pack) => pack.game_type !== "beat_blitz")?.id ?? null);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (!packs.length) return null;
  const selectedPack = packs.find((pack) => pack.id === selectedPackId) ?? null;

  function choosePack(pack: ReleasedPlayGamePack) {
    if (pack.game_type === "beat_blitz") {
      document.getElementById("trivia")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setSelectedPackId(pack.id);
    window.requestAnimationFrame(() => {
      document.getElementById("selected-game")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <section id="game-library" className="scroll-mt-24 border-t border-border/60 bg-surface/40">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-medium text-primary">Games</p>
        <h2 className="mt-1 text-3xl font-semibold">Choose a game to play</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Pick any active game below. New reviewed game packs appear here automatically.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => {
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
            const selected = selectedPackId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => choosePack(pack)}
                aria-pressed={selected}
                className={`rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 ${
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <Badge variant="outline">{itemCount} to play</Badge>
                </div>
                <h3 className="mt-5 font-semibold">{pack.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{pack.description}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-primary">
                  Play now
                </p>
              </button>
            );
          })}
        </div>
        {selectedPack ? (
          <div id="selected-game" className="scroll-mt-24 mt-8 max-w-3xl">
            <PackPlayer key={selectedPack.id} pack={selectedPack} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function PackPlayer({ pack }: { pack: ReleasedPlayGamePack }) {
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
    <article className="rounded-[2rem] border border-primary/25 bg-card p-6 sm:p-8">
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
          <Button className="mt-5" onClick={restart}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Play again
          </Button>
        </div>
      ) : (
        <div className="mt-7">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            {pack.game_type === "hidden_gems" ? "Clue" : "Daily prompt"} {index + 1} of{" "}
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
  if (!matches.length) return null;
  const match = matches[index];
  function choose(value: string) {
    if (selected) return;
    setSelected(value);
    if (value === match.right) setScore((current) => current + 1);
  }
  function next() {
    setIndex((current) => (current + 1) % matches.length);
    setSelected(null);
  }
  return (
    <article className="rounded-[2rem] border border-violet-400/25 bg-card p-6 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Layers3 className="h-5 w-5 text-violet-400" />
          <h3 className="mt-3 text-2xl font-semibold">{pack.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{pack.description}</p>
        </div>
        <Badge variant="outline">Score {score}</Badge>
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
    </article>
  );
}
