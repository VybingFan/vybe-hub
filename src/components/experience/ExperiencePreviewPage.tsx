import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ExperienceCard {
  title: string;
  description: string;
  icon: LucideIcon;
  image?: string;
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
    <div className="mx-auto max-w-7xl space-y-7 sm:space-y-10">
      <header className="overflow-hidden rounded-2xl border border-border/70 bg-gradient-hero sm:rounded-[2rem]">
        <div className="relative px-5 py-8 sm:px-7 sm:py-12 md:px-12 md:py-16">
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
          <h1 className="relative mt-4 max-w-4xl text-3xl font-semibold tracking-tight sm:mt-5 sm:text-4xl md:text-6xl">
            {title}
          </h1>
          <p className="relative mt-3 max-w-3xl text-base leading-7 text-muted-foreground sm:mt-5 sm:text-lg sm:leading-8">
            {description}
          </p>
        </div>
      </header>

      <section className="grid gap-3 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="group flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card transition hover:-translate-y-1 hover:border-primary/35 sm:min-h-64 sm:rounded-3xl"
          >
            {card.image && (
              <div className="relative aspect-[16/7] overflow-hidden border-b border-border/60 sm:aspect-video">
                <img src={card.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-black/20" />
              </div>
            )}
            <div className="flex flex-1 flex-col p-4 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12 sm:rounded-2xl"><card.icon className="h-5 w-5 sm:h-6 sm:w-6" /></div>
                <Badge variant={card.status === "Available now" ? "default" : "secondary"}>{card.status ?? "Preview"}</Badge>
              </div>
              <h2 className="mt-3 text-xl font-semibold sm:mt-6 sm:text-2xl">{card.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground sm:mt-3 sm:text-base sm:leading-7">{card.description}</p>
              {card.to ? (
                <Button asChild variant="ghost" className="mt-3 w-fit px-0 hover:bg-transparent sm:mt-5"><Link to={card.to}>Open now <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              ) : <p className="mt-3 text-xs font-medium text-primary sm:mt-5 sm:text-sm">Coming to VYBE</p>}
            </div>
          </article>
        ))}
      </section>

      <aside className="rounded-2xl border border-dashed border-primary/35 bg-primary/5 p-4 sm:rounded-3xl sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          VYBE product preview
        </p>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground sm:mt-3 sm:text-base sm:leading-7">{note}</p>
      </aside>
    </div>
  );
}
