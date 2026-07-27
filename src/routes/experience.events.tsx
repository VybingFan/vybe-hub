import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock3, MapPin, Radio, Sparkles, Users } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/experience/events")({ component: EventsDemo });

const events = [
  {
    type: "Virtual listening room",
    title: "After the Signal — Listening Room",
    date: "Demonstration date · 8:00 PM ET",
    place: "Online on VYBE",
    body: "Hear the lead track with Nova’s creative notes, then join a guided fan conversation.",
    access: "Free account",
    featured: true,
  },
  {
    type: "Creator conversation",
    title: "Inside the Violet Sessions",
    date: "Demonstration date · 7:30 PM ET",
    place: "Virtual Q&A",
    body: "A sample question-and-answer session about collaboration, recording, and release choices.",
    access: "Followers",
  },
  {
    type: "Local showcase",
    title: "VYBE After Dark: Philadelphia",
    date: "Demonstration date · 6:30 PM ET",
    place: "Philadelphia, PA · Demo venue",
    body: "An example local showcase connecting several independent creators and their communities.",
    access: "Public details",
  },
];

function EventsDemo() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="border-b border-border/60 bg-gradient-hero">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <Badge className="border-cyan-700/30 bg-cyan-100 text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-cyan-200">
              <CalendarDays className="mr-2 h-3.5 w-3.5" />
              Functional event demonstration
            </Badge>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
              Show up together.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Browse realistic example events without an account. Signing in would be required to
              reserve a spot, save an event, or join its participant conversation.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-6 lg:grid-cols-3">
            {events.map((event) => (
              <article
                key={event.title}
                className={`flex flex-col rounded-[2rem] border bg-card p-6 ${
                  event.featured ? "border-primary/50 shadow-glow" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">{event.type}</Badge>
                  {event.featured ? <Sparkles className="h-5 w-5 text-primary" /> : null}
                </div>
                <h2 className="mt-5 text-2xl font-semibold">{event.title}</h2>
                <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" />
                    {event.date}
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" />
                    {event.place}
                  </p>
                  <p className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" />
                    Access: {event.access}
                  </p>
                </div>
                <p className="mt-5 flex-1 leading-7 text-muted-foreground">{event.body}</p>
                <Button asChild className="mt-6 rounded-full bg-gradient-brand">
                  <Link to="/auth/sign-in">
                    {event.featured ? "Reserve a demo spot" : "Sign in to save"}
                  </Link>
                </Button>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-[2rem] border border-border bg-card p-7 md:flex md:items-center md:justify-between md:gap-8">
            <div className="flex gap-4">
              <Radio className="mt-1 h-7 w-7 shrink-0 text-primary" />
              <div>
                <h2 className="text-2xl font-semibold">What creators could control</h2>
                <p className="mt-2 max-w-3xl leading-7 text-muted-foreground">
                  Visibility, capacity, free or paid access, follower eligibility, subscriber
                  eligibility, reminders, participant chat, and replay availability.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="mt-6 shrink-0 rounded-full md:mt-0">
              <Link to="/demo/creator#community">Return to Nova Vale</Link>
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            These are fictional demonstrations. No reservation, ticket, venue, or scheduled event is
            currently active.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
