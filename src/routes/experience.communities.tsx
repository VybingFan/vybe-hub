import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Users, Sparkles } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/experience/communities")({ component: CommunitiesExperience });

const examples = [
  {
    focus: "Music",
    title: "The Listening Room",
    body: "Talk about releases, lyrics, performances, and the creative choices supporters notice.",
  },
  {
    focus: "Comedy",
    title: "After the Set",
    body: "Continue the conversation around sketches, performances, live moments, and what made people laugh.",
  },
  {
    focus: "Poetry",
    title: "Between the Lines",
    body: "Share interpretations, talk about readings, and connect around the words that stayed with you.",
  },
];

function CommunitiesExperience() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-hero">
          <img src="/images/supporter-cards/community.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/88 to-background/60" />
          <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20">
            <Badge className="border-pink-700/30 bg-pink-100 text-pink-900 dark:border-pink-300/30 dark:bg-pink-300/10 dark:text-pink-200">
              <MessageCircle className="mr-2 h-3.5 w-3.5" /> Communities
            </Badge>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
              Join the conversation.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Find spaces built around creators, interests, and shared experiences. Read what others
              are saying, participate when you are ready, and connect beyond the public feed.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {examples.map((item) => (
              <article key={item.title} className="rounded-3xl border border-border/70 bg-card p-5 sm:p-7">
                <Badge variant="outline">{item.focus}</Badge>
                <h2 className="mt-5 text-2xl font-semibold">{item.title}</h2>
                <p className="mt-3 leading-7 text-muted-foreground">{item.body}</p>
                <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> Supporters</span>
                  <span className="flex items-center gap-1.5"><Heart className="h-4 w-4 text-primary" /> Creators</span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-2xl font-semibold">Your communities become part of your VYBE.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
              Sign in to follow creators, join conversations, and keep the communities you care about easier to return to.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="rounded-full bg-gradient-brand"><Link to="/auth/sign-up">Join VYBE</Link></Button>
              <Button asChild variant="outline" className="rounded-full"><Link to="/auth/sign-in">Sign in</Link></Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
