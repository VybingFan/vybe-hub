import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Headphones, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/experience/play")({ component: PlayExperience });

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

function PlayExperience() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [vibe, setVibe] = useState<number | null>(null);
  const [poll, setPoll] = useState<string | null>(null);
  const question = trivia[questionIndex];
  const pollTotal = 126 + (poll ? 1 : 0);
  const pollResults = useMemo(
    () => ({
      "Studio version": Math.round(((68 + (poll === "Studio version" ? 1 : 0)) / pollTotal) * 100),
      "Live version": Math.round(((58 + (poll === "Live version" ? 1 : 0)) / pollTotal) * 100),
    }),
    [poll, pollTotal],
  );

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

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="border-b border-border/60 bg-gradient-hero">
          <div className="mx-auto max-w-6xl px-6 py-16 text-center md:py-24">
            <Badge className="border-lime-300/30 bg-lime-300/10 text-lime-300">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Play on VYBE · First experience
            </Badge>
            <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
              Discovery becomes something you do.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Try the first public VYBE activities. No account is required. Future member profiles
              can save scores, badges, poll history, and creator challenges.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
            <article className="rounded-[2rem] border border-lime-300/25 bg-card p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.18em] text-lime-300">
                    Available now
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">VYBE Music Trivia</h2>
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
                    This public version does not save results. A future free VYBE account can keep
                    scores, badges, and daily progress.
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

            <article className="rounded-[2rem] border border-primary/25 bg-card p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">
                Available now
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Build Your VYBE</h2>
              <p className="mt-3 text-muted-foreground">
                Choose the discovery style that feels most like you.
              </p>
              <div className="mt-6 grid gap-3">
                {vibeChoices.map((choice, index) => (
                  <button
                    key={choice.label}
                    type="button"
                    onClick={() => setVibe(index)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      vibe === index
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background/50 hover:border-primary/40"
                    }`}
                  >
                    <span className="font-semibold">{choice.label}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {choice.detail}
                    </span>
                  </button>
                ))}
              </div>
              {vibe !== null && (
                <div className="mt-5 rounded-2xl bg-gradient-brand p-5 text-white">
                  <p className="text-sm text-white/75">Your current VYBE</p>
                  <p className="mt-1 text-xl font-semibold">{vibeChoices[vibe].label}</p>
                  <p className="mt-2 text-sm text-white/85">{vibeChoices[vibe].detail}</p>
                </div>
              )}
            </article>
          </div>
        </section>

        <section className="border-y border-border/60 bg-surface/40">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">
                Daily VYBE Poll
              </p>
              <h2 className="mt-2 text-3xl font-semibold">Studio version or live version?</h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                Vote once in this demonstration. Future signed-in members can join recurring polls,
                see history, and compare results across creator communities.
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

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-[2rem] border border-primary/25 bg-card p-8 md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <p className="text-sm font-semibold text-primary">Creator Spotlight Challenge</p>
              <h2 className="mt-2 text-3xl font-semibold">
                Meet Nova Vale, then explore the clues
              </h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                The guided demo profile shows how future challenges can connect music, stories,
                merch, video, access levels, and creator discovery.
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
        </section>
      </main>
      <Footer />
    </div>
  );
}
