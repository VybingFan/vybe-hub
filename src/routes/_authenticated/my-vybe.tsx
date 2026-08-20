import type { ReactNode } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronRight,
  Gamepad2,
  Heart,
  Headphones,
  MessageCircle,
  Play,
  Radio,
  Sparkles,
  Users,
} from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { SavedMusicLists } from "@/components/engagement/SavedMusicLists";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";

export const Route = createFileRoute("/_authenticated/my-vybe")({
  component: MyVybePage,
});

function MyVybePage() {
  return (
    <RoleGuard allow={["supporter", "creator", "business", "admin"]}>
      <div className="mx-auto max-w-7xl space-y-8 pb-12">
        <WorkspacePageHeader
          eyebrow="My VYBE"
          title="Your VYBE starts here."
          description="Catch up with creators you care about, keep what moves you close, and jump back into everything VYBE has waiting for you."
        />

        <section className="grid gap-4 lg:grid-cols-[1.4fr_.8fr]">
          <Card className="overflow-hidden border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,.18),transparent_46%)]">
            <CardContent className="flex min-h-56 flex-col justify-between p-6 sm:p-7">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Headphones className="h-5 w-5" />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[.2em] text-primary">
                  Pick up your VYBE
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  Keep listening. Keep discovering.
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Return to music, creators, and experiences you were already enjoying.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/listen">
                    <Play className="mr-2 h-4 w-4 fill-current" />
                    Continue listening
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/discover">Discover creators</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex h-full flex-col p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">
                    Daily VYBE
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Something to do today</h2>
                </div>
                <Gamepad2 className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Jump into trivia, creator-focus games, and Connect the VYBE.
              </p>
              <Button asChild variant="outline" className="mt-auto justify-between">
                <Link to="/play">
                  Play your VYBE
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">
                Your world
              </p>
              <h2 className="mt-1 text-2xl font-semibold">Everything you follow can meet here</h2>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Music, film, theater, comedy, podcasts, writing, dance, visual art, and more all belong in your personal VYBE.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardLink
              to="/discover"
              icon={<Users className="h-5 w-5" />}
              eyebrow="Your creators"
              title="See who you follow"
              description="Return to creators across every focus."
            />
            <DashboardLink
              to="/communities"
              icon={<MessageCircle className="h-5 w-5" />}
              eyebrow="Community"
              title="Join the conversation"
              description="Keep up with communities and creator conversations."
            />
            <DashboardLink
              to="/events"
              icon={<CalendarDays className="h-5 w-5" />}
              eyebrow="Events"
              title="See what is happening"
              description="Find creator events and experiences around VYBE."
            />
            <DashboardLink
              to="/discover"
              icon={<Sparkles className="h-5 w-5" />}
              eyebrow="Next VYBE"
              title="Find something new"
              description="Move beyond your usual lane and discover another focus."
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">
              Explore your VYBE
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Choose how you want to spend your time</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <ExperienceCard
              to="/listen"
              icon={<Headphones className="h-5 w-5" />}
              title="Listen"
              description="Music from creators you know and creators you have not met yet."
            />
            <ExperienceCard
              to="/watch"
              icon={<Radio className="h-5 w-5" />}
              title="Watch"
              description="Film, video, performance, and visual creator experiences."
            />
            <ExperienceCard
              to="/play"
              icon={<Gamepad2 className="h-5 w-5" />}
              title="Play"
              description="Trivia, challenges, daily activities, and cross-focus games."
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">
                Your collection
              </p>
              <h2 className="mt-1 text-2xl font-semibold">Keep what moves you close</h2>
            </div>
          </div>
          <SavedMusicLists />
        </section>
      </div>
    </RoleGuard>
  );
}

function DashboardLink({
  to,
  icon,
  eyebrow,
  title,
  description,
}: {
  to: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border bg-card p-5 transition hover:border-primary/40 hover:bg-muted/20"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[.16em] text-primary">
        {eyebrow}
      </p>
      <h3 className="mt-1 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}

function ExperienceCard({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <Button asChild variant="ghost" className="mt-4 px-0 text-primary hover:bg-transparent">
          <Link to={to}>
            Open {title}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
