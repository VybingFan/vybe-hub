import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";

export type InformationSection = {
  id?: string;
  title: string;
  body: string;
};

export function InformationPage({
  eyebrow,
  title,
  description,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: InformationSection[];
}) {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="border-b border-border/60 bg-surface/35">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl md:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{description}</p>
          </div>
        </section>
        <section className="mx-auto grid max-w-5xl gap-5 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-2">
          {sections.map((section) => (
            <article
              id={section.id}
              key={section.title}
              className="scroll-mt-24 rounded-3xl border border-border/70 bg-card p-7"
            >
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{section.body}</p>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
