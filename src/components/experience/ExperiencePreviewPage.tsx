import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ExperienceCard {
  title: string;
  description: string;
  icon: LucideIcon;
  status?: "Available now" | "Preview";
  to?: string;
}

export function ExperiencePreviewPage({
  eyebrow,
  title,
  description,
  accent,
  cards,
  note,
}: {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  cards: ExperienceCard[];
  note: string;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <header className="overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-hero">
        <div className="relative px-7 py-12 md:px-12 md:py-16">
          <div
            className="absolute -right-24 -top-32 h-80 w-80 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: accent }}
          />
          <Badge
            variant="outline"
            className="relative rounded-full border-primary/35 bg-background/50"
          >
            <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
            {eyebrow}
          </Badge>
          <h1 className="relative mt-5 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
            {title}
          </h1>
          <p className="relative mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
            {description}
          </p>
        </div>
      </header>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="group flex min-h-64 flex-col rounded-3xl border border-border/70 bg-card p-7 transition hover:-translate-y-1 hover:border-primary/35"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <card.icon className="h-6 w-6" />
              </div>
              <Badge variant={card.status === "Available now" ? "default" : "secondary"}>
                {card.status ?? "Preview"}
              </Badge>
            </div>
            <h2 className="mt-7 text-2xl font-semibold">{card.title}</h2>
            <p className="mt-3 flex-1 leading-7 text-muted-foreground">{card.description}</p>
            {card.to ? (
              <Button asChild variant="ghost" className="mt-5 w-fit px-0 hover:bg-transparent">
                <Link to={card.to}>
                  Open now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <p className="mt-5 text-sm font-medium text-primary">Coming to VYBE</p>
            )}
          </article>
        ))}
      </section>

      <aside className="rounded-3xl border border-dashed border-primary/35 bg-primary/5 p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          VYBE product preview
        </p>
        <p className="mt-3 max-w-4xl leading-7 text-muted-foreground">{note}</p>
      </aside>
    </div>
  );
}
