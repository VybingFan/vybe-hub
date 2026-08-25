import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, GraduationCap, MoveHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CREATOR_ACADEMY_COACH_KEY = "vybe:creator-academy:active-coach:v1";

export type CreatorAcademyCoachLesson = {
  number: number;
  title: string;
  plan: string;
  location: string;
  objective: string;
  meaning: string;
  tasks: string[];
};

export function openCreatorAcademyCoach(lesson: CreatorAcademyCoachLesson) {
  localStorage.setItem(CREATOR_ACADEMY_COACH_KEY, JSON.stringify(lesson));
  window.dispatchEvent(new CustomEvent("vybe:creator-academy-coach"));
}

function readLesson(): CreatorAcademyCoachLesson | null {
  try {
    const value = JSON.parse(localStorage.getItem(CREATOR_ACADEMY_COACH_KEY) || "null");
    return value?.number && Array.isArray(value?.tasks) ? value : null;
  } catch {
    return null;
  }
}

export function CreatorAcademyCoach() {
  const [lesson, setLesson] = useState<CreatorAcademyCoachLesson | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [side, setSide] = useState<"left" | "right">("right");

  useEffect(() => {
    const refresh = () => { setLesson(readLesson()); setExpanded(true); };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("vybe:creator-academy-coach", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vybe:creator-academy-coach", refresh);
    };
  }, []);

  if (!lesson) return null;
  const close = () => {
    localStorage.removeItem(CREATOR_ACADEMY_COACH_KEY);
    window.dispatchEvent(new CustomEvent("vybe:creator-academy-coach"));
    setLesson(null);
  };

  return (
    <aside className={`fixed bottom-20 z-50 w-[min(430px,calc(100vw-24px))] ${side === "right" ? "right-3 md:right-6" : "left-3 md:left-[280px]"}`} aria-label="Creator Academy lesson coach">
      <div className="overflow-hidden rounded-2xl border border-primary/40 bg-background/95 shadow-2xl backdrop-blur">
        <header className="flex items-center gap-3 border-b border-border bg-primary/10 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20"><GraduationCap className="h-5 w-5 text-primary" /></span>
          <button className="min-w-0 flex-1 text-left" onClick={() => setExpanded((value) => !value)}>
            <span className="block text-xs font-semibold uppercase tracking-[.16em] text-primary">Lesson {lesson.number} · {lesson.plan}</span>
            <span className="block truncate font-semibold">{lesson.title}</span>
          </button>
          <Button type="button" size="icon" variant="ghost" title="Move coach to the other side" onClick={() => setSide((value) => value === "right" ? "left" : "right")}><MoveHorizontal className="h-4 w-4" /></Button>
          <Button type="button" size="icon" variant="ghost" title={expanded ? "Minimize lesson" : "Expand lesson"} onClick={() => setExpanded((value) => !value)}>{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}</Button>
          <Button type="button" size="icon" variant="ghost" title="Close Academy coach" onClick={close}><X className="h-4 w-4" /></Button>
        </header>
        {expanded && <div className="max-h-[58vh] space-y-4 overflow-y-auto p-4">
          <div><p className="text-xs font-semibold uppercase tracking-[.15em] text-muted-foreground">You are now in</p><p className="font-semibold">{lesson.location}</p></div>
          <p className="text-sm leading-6">{lesson.objective}</p>
          <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/5 p-3"><p className="text-xs font-semibold uppercase tracking-[.15em] text-cyan-300">What this means</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{lesson.meaning}</p></div>
          <div><p className="text-sm font-semibold">Use the real controls on this page</p><ol className="mt-2 space-y-2">{lesson.tasks.map((task, index) => <li key={task} className="flex gap-2 text-sm leading-5"><span className="font-semibold text-primary">{index + 1}.</span><span>{task}</span></li>)}</ol></div>
          <p className="text-xs leading-5 text-muted-foreground">Move or minimize this coach whenever it covers a control. Expand it again to continue reading while you work.</p>
        </div>}
      </div>
    </aside>
  );
}
