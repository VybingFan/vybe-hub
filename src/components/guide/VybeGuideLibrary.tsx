import { useMemo, useState } from "react";
import { BookOpenText, Compass, RotateCcw, Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { VYBE_GUIDE_ITEMS } from "@/features/guide/vybeGuideData";

export function VybeGuideLibrary() {
  const navigate = useNavigate();
  const { primaryRole } = useUser();
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const role = (primaryRole || "supporter") as "creator" | "supporter" | "business" | "admin";
    const term = query.trim().toLowerCase();
    return VYBE_GUIDE_ITEMS.filter((item) => item.roles.includes(role)).filter((item) => {
      if (!term) return true;
      return [item.title, item.summary, item.what, item.where, ...item.keywords]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [primaryRole, query]);

  function restartCreatorOnboarding() {
    window.localStorage.setItem(
      "vybe:creator-onboarding-v2",
      JSON.stringify({ status: "active", step: 0, mode: "review" }),
    );
    window.localStorage.setItem("vybe:creator-onboarding-launch-v2", "1");
    window.location.reload();
  }

  return (
    <div className="space-y-5 p-4 sm:p-5">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <BookOpenText className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Your complete VYBE reference</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Search by feature, task, or question. Each entry explains what it is, what it does,
              and where to find it. For fast navigation, use the small VG circle beside the VYBE logo.
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="What are you trying to do?"
          className="pl-9"
        />
      </div>

      {primaryRole === "creator" ? (
        <Button type="button" variant="outline" onClick={restartCreatorOnboarding}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Review Creator Setup
        </Button>
      ) : null}

      <div className="grid gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <p className="font-semibold text-foreground">What it does</p>
                      <p className="mt-1 leading-6 text-muted-foreground">{item.what}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Where to find it</p>
                      <p className="mt-1 leading-6 text-muted-foreground">{item.where}</p>
                    </div>
                  </div>
                  {item.route ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => void navigate({ to: item.route as any })}
                    >
                      <Compass className="mr-2 h-4 w-4" />
                      Take me there
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!items.length ? (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No guide entries matched that search yet. Try a feature name such as playlist, visibility,
          video, rights, notifications, or insights.
        </div>
      ) : null}
    </div>
  );
}
