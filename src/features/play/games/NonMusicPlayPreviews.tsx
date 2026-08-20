import { useMemo, useState } from "react";
import { CheckCircle2, Clapperboard, Footprints, Mic2, Sparkles, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type PreviewKey = "film" | "dance" | "podcasting";

interface PreviewQuestion {
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
}

interface PreviewDefinition {
  key: PreviewKey;
  focus: string;
  title: string;
  description: string;
  artwork: string;
  accent: string;
  Icon: typeof Clapperboard;
  questions: PreviewQuestion[];
}

const PREVIEWS: PreviewDefinition[] = [
  {
    key: "film",
    focus: "Film / Video",
    title: "Wait...WHAT?! Movie Edition",
    description: "Some movie stories sound fake. Which ones actually happened?",
    artwork: "/images/play/focus-packs/wait-what-movie-edition.webp",
    accent: "from-fuchsia-500/30 via-violet-500/15 to-cyan-400/20",
    Icon: Clapperboard,
    questions: [
      {
        prompt: "A movie's shooting script can change during production. True or made up?",
        choices: ["True", "Made up"],
        answer: "True",
        explanation:
          "Scripts can be revised during production for creative, practical, or performance reasons.",
      },
      {
        prompt: "A storyboard is mainly used to plan visual shots before filming. True or made up?",
        choices: ["True", "Made up"],
        answer: "True",
        explanation:
          "Storyboards help filmmakers visualize framing, sequence, and movement before cameras roll.",
      },
      {
        prompt: "Every scene in a movie must be filmed in the same order the audience sees it. True or made up?",
        choices: ["True", "Made up"],
        answer: "Made up",
        explanation:
          "Productions commonly film scenes out of story order based on locations, schedules, and logistics.",
      },
    ],
  },
  {
    key: "dance",
    focus: "Dance",
    title: "Where Did It Start?",
    description: "You know the move. Do you know the culture behind it?",
    artwork: "/images/play/focus-packs/where-did-it-start.webp",
    accent: "from-cyan-400/25 via-violet-500/15 to-lime-400/20",
    Icon: Footprints,
    questions: [
      {
        prompt: "Breaking is most closely associated with which place of origin?",
        choices: ["The Bronx, New York", "Miami, Florida", "Nashville, Tennessee"],
        answer: "The Bronx, New York",
        explanation:
          "Breaking developed within hip-hop culture in the Bronx during the 1970s.",
      },
      {
        prompt: "Tap dance is known for using what as part of the performance?",
        choices: ["Rhythmic footwork", "Only hand gestures", "Spoken monologues"],
        answer: "Rhythmic footwork",
        explanation:
          "Tap dancers use shoes fitted with metal taps to create rhythmic sounds through footwork.",
      },
      {
        prompt: "Ballet vocabulary traditionally uses many terms from which language?",
        choices: ["French", "Swahili", "Portuguese"],
        answer: "French",
        explanation:
          "Many standard ballet terms are French because of the form's historical development in France.",
      },
    ],
  },
  {
    key: "podcasting",
    focus: "Podcasting",
    title: "Behind the Mic",
    description: "From RSS to podfade - how much do you know about podcasting?",
    artwork: "/images/play/focus-packs/behind-the-mic.webp",
    accent: "from-violet-500/30 via-fuchsia-500/15 to-amber-400/20",
    Icon: Mic2,
    questions: [
      {
        prompt: "What is one main job of a podcast RSS feed?",
        choices: [
          "Distribute episode information to listening apps",
          "Record the host's microphone",
          "Design the podcast cover",
        ],
        answer: "Distribute episode information to listening apps",
        explanation:
          "An RSS feed carries podcast metadata and episode updates to directories and listening apps.",
      },
      {
        prompt: "What does a podcast trailer usually do?",
        choices: [
          "Introduce the show to potential listeners",
          "Replace every full episode",
          "Automatically edit the host's audio",
        ],
        answer: "Introduce the show to potential listeners",
        explanation:
          "A trailer is a short introduction that gives listeners a quick sense of a show's topic, tone, and host.",
      },
      {
        prompt: "Which format usually features a host speaking with a guest?",
        choices: ["Interview", "Silent feed", "Cover-art loop"],
        answer: "Interview",
        explanation:
          "Interview podcasts are built around conversations between a host and one or more guests.",
      },
    ],
  },
];

export function NonMusicPlayPreviews() {
  const [active, setActive] = useState<PreviewKey | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const selected = useMemo(
    () => PREVIEWS.find((item) => item.key === active) ?? null,
    [active],
  );

  const question = selected?.questions[questionIndex] ?? null;

  function openPreview(key: PreviewKey) {
    setActive(key);
    setQuestionIndex(0);
    setAnswer(null);
    setScore(0);
    setFinished(false);
    window.requestAnimationFrame(() => {
      document.getElementById("creator-focus-preview-player")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  function chooseAnswer(choice: string) {
    if (!question || answer) return;
    setAnswer(choice);
    if (choice === question.answer) setScore((current) => current + 1);
  }

  function nextQuestion() {
    if (!selected) return;
    if (questionIndex >= selected.questions.length - 1) {
      setFinished(true);
      setAnswer(null);
      return;
    }
    setQuestionIndex((current) => current + 1);
    setAnswer(null);
  }

  function restartPreview() {
    setQuestionIndex(0);
    setAnswer(null);
    setScore(0);
    setFinished(false);
  }

  function closePreview() {
    setActive(null);
    setQuestionIndex(0);
    setAnswer(null);
    setScore(0);
    setFinished(false);
  }

  return (
    <section className="mb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-fuchsia-400">Creator Focus Preview</p>
          <h3 className="mt-1 text-2xl font-semibold sm:text-3xl">
            More ways to play are entering the VYBE
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Music is only one part of Play. Try a quick three-question preview from Film / Video,
            Dance, or Podcasting.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold text-violet-300">
          <Sparkles className="h-3.5 w-3.5" />
          Friends and family preview
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {PREVIEWS.map((item) => {
          const Icon = item.Icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => openPreview(item.key)}
              className={`group overflow-hidden rounded-[1.75rem] border text-left transition hover:-translate-y-1 hover:shadow-xl ${
                isActive
                  ? "border-fuchsia-400/60 bg-fuchsia-400/10 shadow-fuchsia-500/10"
                  : "border-border bg-card hover:border-violet-400/50"
              }`}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <img
                  src={item.artwork}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${item.accent}`} />
                <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/55 p-2 text-white backdrop-blur">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-cyan-400">
                  {item.focus}
                </p>
                <h4 className="mt-2 text-lg font-semibold">{item.title}</h4>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-[.16em] text-fuchsia-400">
                  Try preview
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {selected ? (
        <div
          id="creator-focus-preview-player"
          className={`mt-6 overflow-hidden rounded-[2rem] border border-violet-400/30 bg-gradient-to-br ${selected.accent} p-[1px]`}
        >
          <div className="rounded-[calc(2rem-1px)] bg-background/95 p-5 backdrop-blur sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-400">
                  {selected.focus} quick preview
                </p>
                <h4 className="mt-2 text-2xl font-semibold">{selected.title}</h4>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={closePreview}>
                Close preview
              </Button>
            </div>

            {finished ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-lime-400" />
                <p className="mt-4 text-3xl font-semibold">
                  {score} of {selected.questions.length}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Preview complete. Try it again or explore another creator focus.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button onClick={restartPreview}>Play again</Button>
                  <Button variant="outline" onClick={closePreview}>Choose another preview</Button>
                </div>
              </div>
            ) : question ? (
              <>
                <div className="mt-6 flex items-center justify-between gap-4 text-xs text-muted-foreground">
                  <span>
                    Question {questionIndex + 1} of {selected.questions.length}
                  </span>
                  <span>Score {score}</span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 transition-all duration-500"
                    style={{ width: `${((questionIndex + 1) / selected.questions.length) * 100}%` }}
                  />
                </div>

                <p className="mt-6 text-lg font-semibold leading-7">{question.prompt}</p>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {question.choices.map((choice) => {
                    const correct = answer && choice === question.answer;
                    const chosenWrong = answer === choice && choice !== question.answer;
                    return (
                      <button
                        key={choice}
                        type="button"
                        disabled={Boolean(answer)}
                        onClick={() => chooseAnswer(choice)}
                        className={`rounded-2xl border p-4 text-left text-sm font-medium transition ${
                          correct
                            ? "border-lime-400 bg-lime-400/10"
                            : chosenWrong
                              ? "border-destructive bg-destructive/10"
                              : "border-border bg-card/70 hover:border-fuchsia-400/50"
                        }`}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>

                {answer ? (
                  <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                    <p className="flex items-center gap-2 font-semibold">
                      {answer === question.answer ? (
                        <CheckCircle2 className="h-4 w-4 text-lime-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      {answer === question.answer ? "Correct" : `Answer: ${question.answer}`}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {question.explanation}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" onClick={nextQuestion}>
                        {questionIndex === selected.questions.length - 1
                          ? "See score"
                          : "Next question"}
                      </Button>
                      {answer !== question.answer ? (
                        <Button size="sm" variant="outline" onClick={() => setAnswer(null)}>
                          Try this question again
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
