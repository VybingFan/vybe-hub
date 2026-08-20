import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BookOpenText, CheckCircle2, ChevronRight, CircleHelp, Compass, Pause, Play, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/useUser";
import { CREATOR_ONBOARDING_STEPS, VYBE_GUIDE_ITEMS } from "@/features/guide/vybeGuideData";

type CreatorOnboardingState = {
  status: "offered" | "active" | "paused" | "completed";
  step: number;
};

const STORAGE_KEY = "vybe:creator-onboarding-v2";

function readState(): CreatorOnboardingState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CreatorOnboardingState;
      if (
        (parsed.status === "offered" || parsed.status === "active" || parsed.status === "paused" || parsed.status === "completed") &&
        Number.isInteger(parsed.step)
      ) {
        return parsed;
      }
    }
  } catch {}
  return { status: "completed", step: 0 };
}

function saveState(next: CreatorOnboardingState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function VybeGuideLauncher() {
  const navigate = useNavigate();
  const { primaryRole } = useUser();
  const [open, setOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [query, setQuery] = useState("");
  const [onboarding, setOnboarding] = useState<CreatorOnboardingState>({ status: "completed", step: 0 });

  const creator = primaryRole === "creator";

  useEffect(() => {
    if (!creator) return;
    const current = readState();
    const firstRun = window.localStorage.getItem("vybe:creator-onboarding-launch-v2");
    setOnboarding(current);
    if (firstRun) {
      window.localStorage.removeItem("vybe:creator-onboarding-launch-v2");
      const next = current.status === "completed" ? { status: "offered" as const, step: 0 } : current;
      saveState(next);
      setOnboarding(next);
      setOpen(true);
    }
  }, [creator]);

  const currentStep = CREATOR_ONBOARDING_STEPS[Math.min(onboarding.step, CREATOR_ONBOARDING_STEPS.length - 1)];
  const progress = Math.min(onboarding.step, CREATOR_ONBOARDING_STEPS.length - 1);
  const visibleHelp = useMemo(() => {
    const role = (primaryRole || "supporter") as "creator" | "supporter" | "business" | "admin";
    const term = query.trim().toLowerCase();
    return VYBE_GUIDE_ITEMS.filter((item) => item.roles.includes(role))
      .filter((item) => !term || [item.title, item.summary, item.what, item.where, ...item.keywords].join(" ").toLowerCase().includes(term))
      .slice(0, 6);
  }, [primaryRole, query]);

  function updateOnboarding(next: CreatorOnboardingState) {
    saveState(next);
    setOnboarding(next);
  }

  function continueSetup() {
    if (!currentStep) return;
    setOpen(false);
    void navigate({ to: currentStep.route as any });
  }

  function markStepComplete() {
    if (onboarding.step >= CREATOR_ONBOARDING_STEPS.length - 1) {
      updateOnboarding({ status: "completed", step: CREATOR_ONBOARDING_STEPS.length - 1 });
      return;
    }
    const nextStep = onboarding.step + 1;
    updateOnboarding({ status: "active", step: nextStep });
    setOpen(false);
    void navigate({ to: CREATOR_ONBOARDING_STEPS[nextStep].route as any });
  }

  function pauseSetup() {
    updateOnboarding({ ...onboarding, status: "paused" });
    setOpen(false);
  }

  function resumeSetup() {
    updateOnboarding({ ...onboarding, status: "active" });
    setShowHelp(false);
  }

  function startSetup() { updateOnboarding({ status: "active", step: 0 }); setShowHelp(false); }

  function maybeLater() { updateOnboarding({ status: "paused", step: 0 }); setOpen(false); }

  function skipSetup() { updateOnboarding({ status: "completed", step: CREATOR_ONBOARDING_STEPS.length - 1 }); setOpen(false); }

  function restartSetup() {
    updateOnboarding({ status: "active", step: 0 });
    setShowHelp(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-[11px] font-black tracking-tight text-primary transition hover:scale-105 hover:bg-primary/15"
        aria-label="Open Quick VYBE Guide"
        title={creator && onboarding.status !== "completed" ? "Quick VYBE Guide - Creator setup in progress" : "Quick VYBE Guide"}
      >
        VG
        {creator && onboarding.status !== "completed" ? (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-2 ring-background" />
        ) : null}
      </button>

      {creator && onboarding.status === "active" && !open ? (<div className="fixed left-4 top-20 z-[90] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-primary/25 bg-background/95 p-4 shadow-2xl backdrop-blur md:left-[17rem]"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-primary">5-minute creator setup Ã‚Â· Step {progress + 1} of {CREATOR_ONBOARDING_STEPS.length}</p><h3 className="mt-1 font-semibold">{currentStep.title}</h3></div><button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-primary hover:underline">Full step</button></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{currentStep.instruction}</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" className="bg-gradient-brand text-white" onClick={markStepComplete}>{onboarding.step >= CREATOR_ONBOARDING_STEPS.length - 1 ? "Finish setup" : "I did this - continue"}</Button><Button size="sm" variant="outline" onClick={() => setOpen(true)}>Open instructions</Button><Button size="sm" variant="ghost" onClick={pauseSetup}>Pause</Button></div></div>) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg overflow-hidden rounded-[2rem] p-0">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,.2),transparent_45%)] p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-xs font-black text-primary">VG</span>
                Quick VYBE Guide
              </DialogTitle>
            </DialogHeader>

            {!showHelp && creator && onboarding.status === "offered" ? (<div className="mt-5 space-y-3"><div className="rounded-2xl border bg-card/80 p-4"><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Optional 5-minute creator setup</p><h3 className="mt-2 text-lg font-semibold">Want VYBE to walk you through the basics?</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">VYBE can guide you to your creator rules, profile, first music upload, visibility settings, playlists, sharing, and Insights. You can pause anytime and continue where you left off.</p></div><Button onClick={startSetup} className="w-full bg-gradient-brand text-white">Start 5-minute setup <ChevronRight className="ml-2 h-4 w-4" /></Button><Button variant="outline" className="w-full" onClick={maybeLater}>Maybe later</Button><Button variant="ghost" className="w-full" onClick={skipSetup}>I already know VYBE - skip setup</Button><Button variant="ghost" className="w-full" onClick={() => setShowHelp(true)}><CircleHelp className="mr-2 h-4 w-4" />Quick help</Button></div>) : !showHelp && creator && onboarding.status !== "completed" ? (
              <div className="mt-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">5-minute creator setup</p>
                    <p className="mt-1 text-sm text-muted-foreground">Step {progress + 1} of {CREATOR_ONBOARDING_STEPS.length}</p>
                  </div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-500">
                    {onboarding.status === "paused" ? "Paused" : "In progress"}
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 transition-all"
                    style={{ width: `${((progress + 1) / CREATOR_ONBOARDING_STEPS.length) * 100}%` }}
                  />
                </div>

                <div className="mt-5 rounded-2xl border bg-card/80 p-4">
                  <h3 className="font-semibold">{currentStep.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{currentStep.short}</p>
                  <p className="mt-3 text-sm leading-6">{currentStep.instruction}</p>
                </div>

                <div className="mt-4 rounded-xl bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Next:</strong> Use the action below to go to the right place in VYBE. When you finish, open VG again and choose <strong className="text-foreground">I did this - continue</strong>.</div><div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {onboarding.status === "paused" ? (
                    <Button onClick={resumeSetup} className="bg-gradient-brand text-white">
                      <Play className="mr-2 h-4 w-4" /> Resume setup
                    </Button>
                  ) : (
                    <Button onClick={continueSetup} className="bg-gradient-brand text-white">
                      {currentStep.actionLabel} <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="outline" onClick={markStepComplete}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {onboarding.step >= CREATOR_ONBOARDING_STEPS.length - 1 ? "Finish onboarding" : "I did this - continue"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowHelp(true)}>
                    <CircleHelp className="mr-2 h-4 w-4" /> Quick help
                  </Button>
                  <Button variant="ghost" onClick={pauseSetup}>
                    <Pause className="mr-2 h-4 w-4" /> Pause setup
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void navigate({ to: "/settings" });
                  }}
                  className="mt-4 text-sm font-medium text-primary hover:underline"
                >
                  Open the full VYBE Guide in Settings
                </button>
              </div>
            ) : !showHelp && creator && onboarding.status === "completed" ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                  <p className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Creator onboarding complete
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    The onboarding option has been removed from your quick guide. VG remains available for navigation and help.
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setShowHelp(true)}>
                  <Search className="mr-2 h-4 w-4" /> Find something in VYBE
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    void navigate({ to: "/settings" });
                  }}
                >
                  <BookOpenText className="mr-2 h-4 w-4" /> Open full VYBE Guide
                </Button>
                <Button variant="ghost" className="w-full" onClick={restartSetup}>
                  Restart 5-minute creator setup
                </Button>
              </div>
            ) : !showHelp ? (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Use VG to find where things live in VYBE or open the full reference guide.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setShowHelp(true)}>
                  <Search className="mr-2 h-4 w-4" /> Find something in VYBE
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    void navigate({ to: "/settings" });
                  }}
                >
                  <BookOpenText className="mr-2 h-4 w-4" /> Open full VYBE Guide
                </Button>
              </div>
            ) : (
              <div className="mt-5">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What are you trying to do?" className="pl-9" />
                </div>
                <div className="mt-3 max-h-[45vh] space-y-2 overflow-y-auto">
                  {visibleHelp.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.route) {
                            setOpen(false);
                            void navigate({ to: item.route as any });
                          }
                        }}
                        className="flex w-full items-start gap-3 rounded-2xl border bg-card p-3 text-left transition hover:border-primary/40"
                      >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{item.title}</span>
                          <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.where}</span>
                        </span>
                        {item.route ? <Compass className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> : null}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" onClick={() => setShowHelp(false)}>Back</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      void navigate({ to: "/settings" });
                    }}
                  >
                    Full VYBE Guide
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
