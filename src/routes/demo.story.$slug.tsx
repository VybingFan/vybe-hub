import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpenText, Heart, MessageCircle, Music2, Sparkles } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo/story/$slug")({ component: DemoStoryPage });

const stories = {
  "after-the-signal": {
    category: "Behind the song",
    title: "The story behind “After the Signal”",
    dek: "How a late-night voice note, a missed train, and one imperfect breath became Nova Vale’s lead single.",
    readTime: "5 minute demo read",
    sections: [
      {
        heading: "The first signal",
        body: "The idea began as a quiet rhythm tapped against a train window. Nova recorded it on her phone beside a single line: “I heard you after the noise was gone.” The recording was rough, but its sense of distance became the emotional center of the song.",
      },
      {
        heading: "Leaving room for the human part",
        body: "During the final vocal session, a cleaner take was available. Nova kept an earlier performance because the breath before the last phrase made the lyric feel lived-in. The demo illustrates how a creator can share decisions that listeners would never discover from an audio file alone.",
      },
      {
        heading: "What to listen for",
        body: "The arrangement slowly removes layers instead of adding them. By the final section, the rhythm has nearly disappeared, leaving the vocal and a distant pulse to carry the ending.",
      },
    ],
  },
  "five-sounds": {
    category: "Influences",
    title: "Five sounds that shaped Nova Vale",
    dek: "A fictional listening map connecting analog warmth, city rhythm, choral space, electronic detail, and silence.",
    readTime: "4 minute demo read",
    sections: [
      {
        heading: "Influence is more than genre",
        body: "Nova describes influence as a collection of textures rather than a list of artists: the hum of late trains, stacked community voices, worn drum machines, room tone, and the pause before a chorus.",
      },
      {
        heading: "A discovery path",
        body: "A real VYBE story could connect each influence to creator-authorized tracks, playlists, credits, and other creators. That turns an article into a path for deeper discovery.",
      },
    ],
  },
  "voice-memo": {
    category: "Creative process",
    title: "From voice memo to finished record",
    dek: "A step-by-step look at how Nova’s smallest recorded idea became a complete studio arrangement.",
    readTime: "6 minute demo read",
    sections: [
      {
        heading: "Capture before judgment",
        body: "Nova’s demo workflow starts with speed. Melodies, phrases, and environmental sounds are captured before they are organized. The goal is to preserve feeling before technical choices take over.",
      },
      {
        heading: "Build the emotional structure",
        body: "Instead of beginning with verse and chorus labels, Nova marks where the listener should feel closer, unsettled, released, or surprised. Instruments are then chosen to serve that emotional outline.",
      },
      {
        heading: "Finish with context",
        body: "Credits, process notes, visual references, and a public story allow the finished song to retain the human journey behind it.",
      },
    ],
  },
  "session-musicians": {
    category: "Credits",
    title: "Meet the musicians behind the session",
    dek: "A demonstration of richer credits that recognize the people whose choices shaped the recording.",
    readTime: "3 minute demo read",
    sections: [
      {
        heading: "The people in the room",
        body: "This fictional session brings together Nova on vocals and keys, Eli Mercer on bass, Simone Hart on percussion, and producer-engineer Cam Reyes. Each role could link to a profile, catalog, or collaboration history.",
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
                  src="/images/demo/nova-vale/avatar.webp"
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
