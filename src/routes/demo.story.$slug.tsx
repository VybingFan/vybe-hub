import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpenText, Heart, MessageCircle, Music2, Sparkles } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo/story/$slug")({ component: DemoStoryPage });

const stories = {
  "after-the-signal": {
    category: "Origin story",
    title: "The notebooks she opened again",
    dek: "How motherhood, responsibility, and an unexpected introduction to AI music tools led one writer back to her songs.",
    readTime: "5 minute demo read",
    sections: [
      {
        heading: "Before Nova had a name",
        body: "She was born in New Orleans, where blues, jazz, gospel, family stories, and the rhythm of ordinary conversation formed her earliest creative language. She moved to New York with her parents as a child, then was sent to Florida in her early teens during a period of growing pains. Across every move, she sang to herself and filled notebooks with poems, verses, and unfinished songs.",
      },
      {
        heading: "The Northeast, motherhood, and the quiet years",
        body: "She returned north and spent several years in New Jersey. Children, work, responsibility, and the needs of other people slowly moved music out of her daily life. She became the person others depended on. The notebooks closed—not because the desire disappeared, but because there was always something more urgent to do.",
      },
      {
        heading: "Texas and the door opening again",
        body: "A later move to Texas gave her enough distance to reconsider the parts of herself she had postponed. When her children introduced her to AI music tools, experimenting without expectation brought back the pleasure of shaping words, choosing sounds, and finishing ideas. Nova Vale became an alter ego—a transparent AI-assisted persona through which the real writer could finally hear her own stories returned as songs.",
      },
    ],
  },
  "five-sounds": {
    category: "Influences",
    title: "What blues, jazz, and country taught Nova",
    dek: "A listening map connecting emotional truth, vocal freedom, concrete detail, family memory, and the courage to begin again.",
    readTime: "4 minute demo read",
    sections: [
      {
        heading: "Influence is more than genre",
        body: "Nova describes influence as lessons rather than celebrity names: blues tells the truth, jazz leaves room to breathe, country makes the truth visible, gospel remembers where strength came from, and silence gives the listener space to recognize their own life.",
      },
      {
        heading: "A discovery path",
        body: "A real VYBE story could connect each influence to creator-authorized tracks, playlists, credits, and other creators. That turns an article into a path for deeper discovery.",
      },
    ],
  },
  "voice-memo": {
    category: "Creative process",
    title: "From poem to AI-assisted country song",
    dek: "A transparent look at the human writing, tool-assisted experimentation, revision, rejection, and final decisions behind a Nova Vale release.",
    readTime: "6 minute demo read",
    sections: [
      {
        heading: "Begin with the human memory",
        body: "Nova's process starts with something lived: a sentence from an old notebook, a family memory, an image, a regret, or a question she could not answer years ago. The emotional point is written down before any AI tool is opened.",
      },
      {
        heading: "Direct, listen, reject, and revise",
        body: "AI-assisted tools can offer arrangements and vocal interpretations, but Nova's creator decides what sounds honest. Versions that feel generic, imitate the wrong influence, flatten the lyric, or misrepresent the story are rejected. Useful results are revised and organized around the intended emotional arc.",
      },
      {
        heading: "Finish with context",
        body: "Credits, process notes, visual references, and a public story allow the finished song to retain the human journey behind it.",
      },
    ],
  },
  "session-musicians": {
    category: "Credits",
    title: "Who made Nova: human direction and AI assistance",
    dek: "A model disclosure showing how writing, direction, tools, editing, selection, artwork, and publishing responsibility should be credited.",
    readTime: "3 minute demo read",
    sections: [
      {
        heading: "Credit the real contributions",
        body: "A Nova release should identify the human writer or creative director, any co-writers, musicians, producers, engineers, artwork contributors, and the material AI tools used in the process. A fictional persona should never be used to erase the people responsible for the work.",
      },
      {
        heading: "Why credits matter",
        body: "Credits help listeners understand that music is often communal work. They also help collaborators receive recognition and become discoverable through the work they helped create.",
      },
    ],
  },
} as const;

function DemoStoryPage() {
  const { slug } = Route.useParams();
  const story = stories[slug as keyof typeof stories] ?? stories["after-the-signal"];

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <article>
          <header className="border-b border-border/60 bg-gradient-hero">
            <div className="mx-auto max-w-4xl px-6 py-14 md:py-20">
              <Button asChild variant="ghost" className="-ml-4 mb-7 rounded-full">
                <Link to="/demo/creator" hash="stories">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Nova Vale stories
                </Link>
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-amber-700/30 bg-amber-100 text-amber-900 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-200">
                  <BookOpenText className="mr-2 h-3.5 w-3.5" />
                  {story.category}
                </Badge>
                <Badge variant="outline">Demo story</Badge>
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">{story.title}</h1>
              <p className="mt-5 max-w-3xl text-xl leading-8 text-muted-foreground">{story.dek}</p>
              <div className="mt-7 flex items-center gap-3">
                <img
                  src="/images/demo/nova-vale/profile-v2.webp"
                  alt="Nova Vale"
                  className="h-11 w-11 rounded-xl object-cover"
                />
                <div>
                  <p className="font-medium">Nova Vale</p>
                  <p className="text-sm text-muted-foreground">{story.readTime}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-3xl px-6 py-14">
            <div className="space-y-10">
              {story.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-2xl font-semibold">{section.heading}</h2>
                  <p className="mt-4 text-lg leading-8 text-muted-foreground">{section.body}</p>
                </section>
              ))}
            </div>

            <div className="mt-12 rounded-[2rem] border border-primary/25 bg-primary/5 p-7">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-2xl font-semibold">Continue through the work</h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                Return to Nova’s page to hear the demo music or explore the full public creator
                example.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild className="rounded-full bg-gradient-brand">
                  <Link to="/demo/creator" hash="music">
                    <Music2 className="mr-2 h-4 w-4" />
                    Hear Nova’s music
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/auth/sign-up">
                    <Heart className="mr-2 h-4 w-4" />
                    Follow Nova
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-8">
              <p className="font-semibold">Want to respond?</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Reading is public. A free VYBE account would unlock reactions, comments, saving, and
                following.
              </p>
              <Button asChild variant="outline" className="mt-4 rounded-full">
                <Link to="/auth/sign-in">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Sign in to comment
                </Link>
              </Button>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
