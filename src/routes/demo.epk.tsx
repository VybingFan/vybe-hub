import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpenText,
  Download,
  Feather,
  FileText,
  Headphones,
  MapPin,
  MessageSquareText,
  Music2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo/epk")({ component: DemoEpkPage });

const timeline = [
  ["New Orleans", "Born into a city where blues, jazz, gospel, family stories, and everyday speech carried their own music."],
  ["New York", "Moved north with her parents as a child and learned how ambition, movement, and identity can coexist."],
  ["Florida", "Spent her early teenage years navigating growing pains, separation, and the first work of defining herself."],
  ["New Jersey", "Returned to the Northeast, entered adulthood, became a mother, and placed the songs behind daily responsibility."],
  ["Texas", "Found the distance and room to reopen the notebooks, experiment with AI music tools, and create Nova Vale."],
] as const;

const interviewTopics = [
  "Why a dream can remain alive during years of apparent silence",
  "Motherhood, sacrifice, and the difference between love and self-erasure",
  "What New Orleans, New York, Florida, New Jersey, and Texas contributed to the work",
  "Turning poetry into country-soul and spoken-word experiences",
  "Human authorship, AI-assisted production, selection, revision, and responsible disclosure",
  "Building an alter ego without hiding the real woman directing it",
] as const;

const sampleQuestions = [
  "When did you realize the songs had been waiting rather than disappearing?",
  "How did your children help reopen a part of your identity they did not know was missing?",
  "Which parts of Nova are protection, permission, experimentation, or truth?",
  "How do you decide whether an AI-assisted result sounds emotionally honest?",
  "What do you want another mother or late-blooming creator to feel after hearing the work?",
] as const;

function DemoEpkPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <header className="border-b border-border/60 bg-gradient-hero">
          <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
            <Button asChild variant="ghost" className="-ml-4 mb-7 rounded-full">
              <Link to="/demo/creator" hash="epk">
                <ArrowLeft className="mr-2 h-4 w-4" /> Nova Vale profile
              </Link>
            </Button>
            <div className="grid gap-9 lg:grid-cols-[1fr_.72fr] lg:items-center">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-amber-300/30 bg-amber-300/10 text-amber-200">
                    <FileText className="mr-2 h-3.5 w-3.5" /> Guided EPK example
                  </Badge>
                  <Badge variant="outline">Human-led · AI-assisted persona</Badge>
                </div>
                <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-7xl">Nova Vale</h1>
                <p className="mt-3 text-xl text-amber-200">Country soul, spoken truth, and a dream remembered.</p>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
                  A transparent model EPK showing how biography, geography, music, poetry, imagery,
                  credits, disclosure, and interview readiness can give press and partners a useful
                  understanding of a creator without making unsupported claims.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button asChild className="rounded-full bg-gradient-brand">
                    <a href="/downloads/nova-vale-epk-one-sheet.pdf" download>
                      <Download className="mr-2 h-4 w-4" /> Download one-sheet
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link to="/demo/creator" hash="music">
                      <Headphones className="mr-2 h-4 w-4" /> Hear the catalog
                    </Link>
                  </Button>
                </div>
              </div>
              <img
                src="/images/demo/nova-vale/epk-v2/nova-1.png"
                alt="Nova Vale performance portrait"
                className="aspect-[4/5] w-full rounded-[2rem] border border-border object-cover shadow-elevated"
              />
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-7 lg:grid-cols-[.7fr_1.3fr]">
            <div className="rounded-3xl border border-amber-300/25 bg-amber-300/5 p-7">
              <Sparkles className="h-7 w-7 text-amber-300" />
              <p className="mt-5 text-sm font-semibold uppercase tracking-[.18em] text-amber-300">Positioning</p>
              <h2 className="mt-3 text-3xl font-semibold">Songs and stories for people who have lived long enough to begin again.</h2>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Country Soul', 'Blues-rooted', 'Spoken Word', 'Motherhood', 'Second chances', 'Human-led', 'AI-assisted'].map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-card p-7">
              <p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Short biography</p>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Nova Vale is a human-directed, AI-assisted country-soul artist persona rooted in a
                real woman's poetry, memories, motherhood, and creative return. Born in New Orleans
                and shaped by New York, Florida, New Jersey, and Texas, Nova turns blues honesty,
                jazz freedom, gospel memory, and country detail into songs and spoken-word work for
                people learning that beginning again does not erase the years that came before.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-surface/40">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-cyan-300">Geographic and creative timeline</p>
            <h2 className="mt-2 text-3xl font-semibold">Every place changed the voice</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {timeline.map(([place, detail], index) => (
                <article key={place} className="rounded-3xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between gap-3">
                    <MapPin className="h-5 w-5 text-cyan-300" />
                    <span className="text-xs text-muted-foreground">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{place}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-7 px-6 py-16 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-card p-7">
            <Music2 className="h-7 w-7 text-violet-300" />
            <h2 className="mt-5 text-2xl font-semibold">Selected music</h2>
            <div className="mt-6 space-y-5">
              {[
                ["Rise Together", "Public lead song", "The immediate musical introduction to Nova's identity."],
                ["Safe With Me", "Public 60-second preview", "A discovery excerpt demonstrating preview strategy."],
                ["TRE2", "Member example · working title", "A reason to create a free VYBE account while release information is finalized."],
                ["Lemme Fix It", "Follower example", "A relationship-based access demonstration."],
                ["Charlie Sheen", "Unlisted example", "Direct-review sharing with public title and rights review recommended."],
              ].map(([title, access, purpose]) => (
                <div key={title} className="border-b border-border pb-5 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{title}</h3><Badge variant="outline">{access}</Badge></div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{purpose}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-3xl border border-border bg-card p-7">
            <Feather className="h-7 w-7 text-fuchsia-300" />
            <h2 className="mt-5 text-2xl font-semibold">Selected poetry</h2>
            <div className="mt-6 space-y-5">
              {[
                ["The Dream Didn't Die", "Creative return and second chances", "the-dream-didnt-die"],
                ["The Woman in the Mirror Has Lived", "Mature beauty, survival, memory, and voice", "the-woman-in-the-mirror-has-lived"],
                ["What My Children Didn't Know", "Motherhood, identity, sacrifice, and return", "what-my-children-didnt-know"],
              ].map(([title, theme, slug]) => (
                <a key={title} href={`/demo/poem/${slug}`} className="group block border-b border-border pb-5 last:border-0 last:pb-0">
                  <h3 className="font-semibold group-hover:text-fuchsia-300">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{theme}</p>
                </a>
              ))}
            </div>
          </article>
        </section>

        <section className="border-y border-border/60 bg-surface/40">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[.2em] text-amber-300">Approved press imagery</p>
                <h2 className="mt-2 text-3xl font-semibold">Different images serve different stories</h2>
              </div>
              <Badge variant="outline">AI-generated · Human-directed demonstration visuals</Badge>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Performance", "/images/demo/nova-vale/epk-v2/nova-1.png", "Music and lead press"],
                ["Country editorial", "/images/demo/nova-vale/epk-v2/nova-2.png", "Country-soul coverage"],
                ["City edge", "/images/demo/nova-vale/epk-v2/nova-3.png", "Digital and genre-crossing coverage"],
                ["Spoken word", "/images/demo/nova-vale/epk-v2/nova-5.png", "Poetry and writing features"],
              ].map(([title, source, use]) => (
                <figure key={title} className="overflow-hidden rounded-3xl border border-border bg-card">
                  <img src={source} alt={`Nova Vale ${title}`} className="aspect-[4/5] w-full object-cover" />
                  <figcaption className="p-5"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{use}</p></figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-7 px-6 py-16 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-card p-7">
            <MessageSquareText className="h-7 w-7 text-cyan-300" />
            <h2 className="mt-5 text-2xl font-semibold">Interview topics</h2>
            <ul className="mt-6 space-y-3 text-muted-foreground">
              {interviewTopics.map((topic) => <li key={topic} className="flex gap-3"><span className="text-cyan-300">→</span><span>{topic}</span></li>)}
            </ul>
          </article>
          <article className="rounded-3xl border border-border bg-card p-7">
            <BookOpenText className="h-7 w-7 text-fuchsia-300" />
            <h2 className="mt-5 text-2xl font-semibold">Sample interview questions</h2>
            <ol className="mt-6 space-y-4 text-muted-foreground">
              {sampleQuestions.map((question, index) => <li key={question} className="flex gap-3"><span className="font-semibold text-fuchsia-300">{index + 1}.</span><span>{question}</span></li>)}
            </ol>
          </article>
        </section>

        <section className="border-y border-border/60 bg-surface/40">
          <div className="mx-auto grid max-w-7xl gap-7 px-6 py-16 lg:grid-cols-2">
            <article className="rounded-3xl border border-emerald-300/25 bg-emerald-300/5 p-7">
              <ShieldCheck className="h-7 w-7 text-emerald-300" />
              <h2 className="mt-5 text-2xl font-semibold">Credits and disclosure</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Human creative direction and source-catalog credits: Jerzo and C. Blount. Nova Vale
                is an AI-generated visual and artist persona directed by a real human creator. The
                poetry is original human-authored writing. AI-assisted music tools may support
                arrangement or vocal experimentation where disclosed; contributor roles, ownership,
                publishing, production, and splits must be confirmed before public representation.
              </p>
            </article>
            <article className="rounded-3xl border border-border bg-card p-7">
              <FileText className="h-7 w-7 text-amber-300" />
              <h2 className="mt-5 text-2xl font-semibold">Contact and booking status</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Demonstration only—no fictional email, agent, phone number, tour history, or live
                booking claim is presented. Appropriate formats may include a written interview,
                virtual creator-technology discussion, listening feature, poetry feature, or an
                appearance by the disclosed human creator when real contact information and consent
                are configured.
              </p>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
