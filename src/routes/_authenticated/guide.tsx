import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenText, CheckCircle2, Compass, Gamepad2, Heart, LayoutDashboard, ListMusic, Music2, Upload, User, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/_authenticated/guide")({ component: GuidePage });

const creatorSteps = [
  { title: "Build your public profile", body: "Add your creator name, photo, bio, genres, links, and public profile details.", to: "/profile", icon: User },
  { title: "Add your music", body: "Use Upload Music for new tracks, then manage releases and visibility from Music Library.", to: "/music/upload", icon: Upload },
  { title: "Create playlists", body: "Group songs for supporters, events, moods, releases, or sharing links.", to: "/playlists", icon: ListMusic },
  { title: "Add video", body: "Creator Plus and higher can build a Video Library, including native VYBE uploads.", to: "/videos", icon: Video },
  { title: "See what supporters see", body: "Use Discover and your public creator link to review the experience from the audience side.", to: "/discover", icon: Compass },
  { title: "Grow your VYBE", body: "Use Connections, Insights, Events & Updates, EPK, Creator Focuses, and other Studio tools as you grow.", to: "/dashboard", icon: LayoutDashboard },
];

const supporterSteps = [
  { title: "Discover creators", body: "Browse creators and find music, stories, videos, events, and new creative voices.", to: "/discover", icon: Compass },
  { title: "Listen", body: "Play public music and creator playlists without digging through social posts or outside links.", to: "/experience/listen", icon: Music2 },
  { title: "Save your favorites", body: "Use My VYBE to keep the creators and experiences you want to return to.", to: "/my-vybe", icon: Heart },
  { title: "Play", body: "Try VYBE games and creator-focus challenges across music, film, dance, podcasting, and more.", to: "/play", icon: Gamepad2 },
  { title: "Explore more", body: "Use Watch, Read, Communities, and Events to move beyond a single post or feed.", to: "/watch", icon: BookOpenText },
];

function GuidePage() {
  const { primaryRole } = useUser();
  const creator = primaryRole === "creator";
  const steps = creator ? creatorSteps : supporterSteps;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,.24),transparent_42%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--background)))] p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Getting started</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{creator ? "Your Creator guide to VYBE" : "Your Supporter guide to VYBE"}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          {creator
            ? "Use this quick path to understand where the main creator tools live, what they do, and what supporters will see."
            : "Use this quick path to learn where to discover, listen, save, play, watch, read, and keep up with creators."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild className="bg-gradient-brand text-white"><Link to={creator ? "/profile" : "/discover"}>Start here</Link></Button>
          <Button asChild variant="outline"><Link to="/help">Open the full VYBE Help Center</Link></Button>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Link key={step.title} to={step.to} className="group rounded-3xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                <span>
                  <span className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Step {index + 1}</span>
                  <span className="mt-1 block text-lg font-semibold">{step.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">{step.body}</span>
                </span>
              </div>
            </Link>
          );
        })}
      </section>
      <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
          <div>
            <h2 className="font-semibold">You can come back anytime</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">The VYBE Guide stays available from navigation. The Help Center explains features in more detail when you need a reminder.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
