import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock3, MapPin, Sparkles, Users } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/experience/events")({ component: EventsDemo });

const events = [
  {
    type: "Virtual listening room",
    title: "After the Signal â€” Listening Room",
    date: "Demonstration date Â· 8:00 PM ET",
    place: "Online on VYBE",
    body: "Hear the lead track with Novaâ€™s creative notes, then join a guided fan conversation.",
    access: "Free account",
    featured: true,
  },
  {
    type: "Creator conversation",
    title: "Inside the Violet Sessions",
    date: "Demonstration date Â· 7:30 PM ET",
    place: "Virtual Q&A",
    body: "A sample question-and-answer session about collaboration, recording, and release choices.",
    access: "Followers",
  },
  {
    type: "Local showcase",
    title: "VYBE After Dark: Philadelphia",
    date: "Demonstration date Â· 6:30 PM ET",
    place: "Philadelphia, PA Â· Demo venue",
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
          <div className="mx-auto max-w-6xl px-5 py-9 sm:px-6 sm:py-16 md:py-20">
            <Badge className="border-cyan-700/30 bg-cyan-100 text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-cyan-200">
              <CalendarDays className="mr-2 h-3.5 w-3.5" />
              Events on VYBE
            </Badge>
            <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight sm:mt-5 sm:text-4xl md:text-6xl">
              Show up together.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:mt-5 sm:text-lg sm:leading-8">
              Discover creator events, conversations, listening experiences, and local showcases.
              Sign in when an event requires saving, reserving, or participation.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-14">
          <div className="grid gap-3 sm:gap-6 lg:grid-cols-3">
            {events.map((event) => (
              <article
                key={event.title}
                className={`flex flex-col rounded-2xl border bg-card p-4 sm:rounded-[2rem] sm:p-6 ${
                  event.featured ? "border-primary/50 shadow-glow" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <Badge variant="outline" className="max-w-[13rem] truncate text-[10px] sm:max-w-none sm:text-xs">
                    {event.type}
                  </Badge>
                  {event.featured ? <Sparkles className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" /> : null}
                </div>
                <h2 className="mt-3 text-xl font-semibold sm:mt-5 sm:text-2xl">{event.title}</h2>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground sm:mt-5 sm:space-y-3 sm:text-sm">
                  <p className="flex items-start gap-2">
                    <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-300 sm:h-4 sm:w-4" />
                    {event.date}
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-300 sm:h-4 sm:w-4" />
                    {event.place}
                  </p>
                  <p className="flex items-start gap-2">
                    <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-300 sm:h-4 sm:w-4" />
                    Access: {event.access}
                  </p>
                </div>
                <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground sm:mt-5 sm:text-base sm:leading-7">
                  {event.body}
                </p>
                <Button asChild size="sm" className="mt-4 w-full rounded-full bg-gradient-brand sm:mt-6 sm:h-10">
                  <Link to="/auth/sign-in">
                    {event.featured ? "Reserve a spot" : "Sign in to save"}
                  </Link>
                </Button>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-border bg-card/50 p-4 text-center sm:mt-8 sm:rounded-2xl sm:p-5">
            <p className="text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
              Example events are shown to demonstrate the supporter experience. No reservation,
              ticket, venue, or scheduled event shown here is currently active.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
