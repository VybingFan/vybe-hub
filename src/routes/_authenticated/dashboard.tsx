import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Circle,
  ExternalLink,
  ListMusic,
  Music2,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { useCreatorTracks } from "@/hooks/useMusic";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

function DashboardPage() {
  return (
    <RoleGuard allow={["creator", "admin"]}>
      <DashboardContent />
    </RoleGuard>
  );
}

function DashboardContent() {
  const { user, profile: account } = useUser();
  const { data: creator } = useCreatorProfile(user?.id);
  const { data: tracks = [] } = useCreatorTracks(user?.id);
  const published = tracks.filter((track) => track.status === "published").length;
  const tasks = [
    {
      done: !!creator?.username && !!creator.artist_name,
      title: "Claim your artist name and public URL",
      body: "Add the identity supporters will recognize.",
      to: "/profile",
      icon: UserRound,
    },
    {
      done: published > 0,
      title: "Publish your music",
      body: published
        ? `${published} songs are public.`
        : "Upload at least one song supporters can play.",
      to: "/music/upload",
      icon: Music2,
    },
    {
      done: !!creator?.bio && !!creator?.avatar_url,
      title: "Tell your story",
      body: "Add your bio, artist image, banner, and links.",
      to: "/profile",
      icon: UserRound,
    },
    {
      done: !!creator?.merch_url,
      title: "Connect your merch",
      body: "Link the store or collection you already use.",
      to: "/profile",
      icon: ShoppingBag,
    },
    {
      done: false,
      title: "Create a shareable experience",
      body: "Build a release, playlist, inspiration set, or exclusive preview.",
      to: "/playlists",
      icon: ListMusic,
    },
  ] as const;
  const completed = tasks.filter((task) => task.done).length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            {creator?.artist_name || account?.display_name || "Creator"} Studio
          </h1>
          <p className="mt-3 text-muted-foreground">
            Complete the essentials, publish your page, then invite real supporters to test it.
          </p>
        </div>
        {creator?.username && (
          <Button asChild variant="outline">
            <Link to="/artist/$username" params={{ username: creator.username }}>
              View public page <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </header>
      <section className="rounded-3xl border border-primary/20 bg-card p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Ready-to-share checklist</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {completed} of {tasks.length} essentials ready
            </h2>
          </div>
          <div className="text-3xl font-bold text-gradient-brand">
            {Math.round((completed / tasks.length) * 100)}%
          </div>
        </div>
        <div className="mt-7 grid gap-3 md:grid-cols-2">
          {tasks.map((task) => (
            <Link
              key={task.title}
              to={task.to}
              className="flex gap-4 rounded-2xl border border-border bg-background/45 p-5 transition hover:border-primary/40"
            >
              <div className="mt-0.5">
                {task.done ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{task.body}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
