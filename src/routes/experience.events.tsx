import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock3, MapPin, Sparkles, Users } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/experience/events")({ component: VybeEvents });

const events = [
  {
    type: "VYBE Live",
    title: "Creator Conversation",
    date: "Demonstration schedule · 8:00 PM ET",
    place: "Live on VYBE",
    body: "A VYBE-hosted conversation bringing a creator and supporters together around the work.",
    access: "Free account",
    featured: true,
  },
  {
    type: "VYBE Showcase",
    title: "Spotlight Sessions",
    date: "Demonstration schedule · 7:30 PM ET",
    place: "VYBE virtual showcase",
    body: "A platform-hosted showcase introducing supporters to creators and new work.",
    access: "VYBE members",
  },
  {
    type: "VYBE Special",
    title: "After Dark",
    date: "Demonstration schedule · 6:30 PM ET",
    place: "VYBE-hosted experience",
    body: "An example VYBE-produced experience combining entertainment, conversation, and community.",
    access: "Public details",
  },
];

function VybeEvents() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="border-b border-border/60 bg-gradient-hero">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20">
            <Badge className="border-cyan-700/30 bg-cyan-100 text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-300/10 dark:text-cyan-200">
              <CalendarDays className="mr-2 h-3.5 w-3.5" /> VYBE Events
            </Badge>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
              Experience VYBE together.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Discover VYBE-hosted lives, conversations, performances, showcases, and special
              programming designed to bring creators and supporters together.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              Looking for a particular creator's shows, appearances, releases, or personal activity?
              Visit that creator's VYBE and check What's Happening.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-16">
          <div className="grid gap-4 lg:grid-cols-3">
            {events.map((event) => (
              <article key={event.title} className={`flex flex-col rounded-3xl border bg-card p-5 sm:p-6 ${event.featured ? "border-primary/50 shadow-glow" : "border-border"}`}>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline">{event.type}</Badge>
                  {event.featured ? <Sparkles className="h-5 w-5 text-primary" /> : null}
                </div>
                <h2 className="mt-5 text-2xl font-semibold">{event.title}</h2>
                <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                  <p className="flex gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{event.date}</p>
                  <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{event.place}</p>
                  <p className="flex gap-2"><Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Access: {event.access}</p>
                </div>
                <p className="mt-5 flex-1 leading-7 text-muted-foreground">{event.body}</p>
                <Button asChild variant="outline" className="mt-6 w-full rounded-full"><Link to="/auth/sign-in">Sign in to keep up</Link></Button>
              </article>
            ))}
          </div>
          <p className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 p-4 text-center text-sm leading-6 text-muted-foreground">
            These are experience examples only. No demonstration date, reservation, ticket, or event shown here is currently active.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
