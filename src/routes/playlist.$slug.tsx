import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download, Headphones, Loader2, Share2, UserRound } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { SharedPlaylistPlayer } from "@/components/playlists/SharedPlaylistPlayer";
import { Button } from "@/components/ui/button";
import { useSharedPlaylist } from "@/hooks/usePlaylists";

export const Route = createFileRoute("/playlist/$slug")({ component: SharedPlaylistPage });

function SharedPlaylistPage() {
  const { slug } = Route.useParams();
  return <SharedPlaylistExperience slug={slug} />;
}

export function SharedPlaylistExperience({ slug }: { slug: string }) {
  const { data, isLoading, error } = useSharedPlaylist(slug);
  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (error || !data)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center">
        <Logo variant="horizontal" />
        <h1 className="text-3xl font-semibold">This playlist is not available.</h1>
        <Button asChild>
          <Link to="/">Discover VYBE</Link>
        </Button>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/">
            <Logo />
          </Link>
          <Button asChild size="sm" className="bg-gradient-brand text-white">
            <Link to="/auth/sign-up">Join VYBE</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]">
          <section>
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">
              A playlist from {data.artistName}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">{data.title}</h1>
            {data.occasion && (
              <p className="mt-4 inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-sm text-primary">
                {data.occasion}
              </p>
            )}
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {data.description || "A collection chosen for you."}
            </p>
            <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
              <Headphones className="h-4 w-4 text-primary" /> {data.tracks.length} songs · Listen in
              order or choose any track
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {data.artistUsername && (
                <Button asChild variant="outline">
                  <Link to="/artist/$username" params={{ username: data.artistUsername }}>
                    <UserRound className="mr-2 h-4 w-4" /> Visit {data.artistName}
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  navigator.share
                    ? navigator.share({ title: data.title, url: window.location.href })
                    : navigator.clipboard.writeText(window.location.href)
                }
              >
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            </div>
            <div className="mt-10 rounded-3xl border border-border bg-surface/70 p-6">
              <Download className="h-6 w-6 text-genre-electronic" />
              <h2 className="mt-4 text-xl font-semibold">Keep the connection going</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Create a free VYBE account to follow artists, save playlists, join conversations,
                and hear what comes next.
              </p>
              <Button asChild className="mt-5 bg-gradient-brand text-white">
                <Link to="/auth/sign-up">
                  Get the VYBE app experience <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
          <SharedPlaylistPlayer tracks={data.tracks} />
        </div>
        <section className="mt-14 rounded-[2rem] border border-primary/20 bg-card p-7 text-center">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">
            Help shape VYBE
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            Did this feel easy, personal, and worth returning to?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Partner artists and invited listeners are helping decide what VYBE builds next. Share
            your experience directly with the artist who sent this playlist.
          </p>
        </section>
      </main>
    </div>
  );
}
