import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Download,
  ExternalLink,
  Headphones,
  Heart,
  LayoutDashboard,
  Loader2,
  Share2,
  Sparkles,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { SharedPlaylistPlayer } from "@/components/playlists/SharedPlaylistPlayer";
import { Button } from "@/components/ui/button";
import { appLinks, getPreferredAppLink } from "@/config/appLinks";
import { useSharedPlaylist } from "@/hooks/usePlaylists";
import { useUser } from "@/hooks/useUser";
import { activityService } from "@/services/activity/activityService";
import { ListenerConnectionForm } from "@/components/connections/ListenerConnectionForm";

export const Route = createFileRoute("/playlist/$slug")({ component: SharedPlaylistPage });

function SharedPlaylistPage() {
  const { slug } = Route.useParams();
  return <SharedPlaylistExperience slug={slug} />;
}

export function SharedPlaylistExperience({ slug }: { slug: string }) {
  const { data, isLoading, error } = useSharedPlaylist(slug);
  const { user, primaryRole, defaultRoute, isLoading: userLoading } = useUser();
  const [appBarVisible, setAppBarVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const appLabel =
    primaryRole === "admin"
      ? "Open Admin"
      : primaryRole === "creator"
        ? "Open Creator Studio"
        : "Open VYBE";

  useEffect(() => {
    if (data) void activityService.record(slug, "link_opened");
  }, [data, slug]);

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
          <Link to="/explore" search={{ q: "" }}>
            Discover VYBE
          </Link>
        </Button>
      </div>
    );

  const artwork = data.tracks.find((track) => track.cover_url)?.cover_url;
  const totalSeconds = data.tracks.reduce((total, track) => total + track.duration_sec, 0);
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  const preferredAppLink = getPreferredAppLink();
  const sharePlaylist = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${data.title} by ${data.artistName}`,
        text: `Press play and experience this VYBE from ${data.artistName}.`,
        url: window.location.href,
      });
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#070811] text-white">
      {artwork && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[46rem] bg-cover bg-center opacity-25 blur-3xl"
          style={{ backgroundImage: `url(${artwork})` }}
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[48rem] bg-[radial-gradient(circle_at_20%_10%,rgba(217,70,239,.28),transparent_34%),radial-gradient(circle_at_85%_16%,rgba(34,211,238,.2),transparent_32%),linear-gradient(to_bottom,transparent,#070811_90%)]" />

      {appBarVisible && (
        <div className="relative z-30 border-b border-white/10 bg-[#0a0b14]/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-20 max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
            <Link to="/" className="shrink-0" aria-label="VYBE home">
              <Logo />
            </Link>
            <div className="min-w-0 flex-1 border-l border-white/10 pl-3 sm:pl-5">
              <p className="truncate text-sm font-semibold">Take this VYBE with you</p>
              <p className="hidden truncate text-xs text-white/55 sm:block">
                Follow the artist, save the playlist, and keep discovering.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="hidden text-white sm:inline-flex">
              <Link to="/explore" search={{ q: "" }}>
                Explore VYBE
              </Link>
            </Button>
            {!userLoading && user ? (
              <Button asChild size="sm" className="bg-white text-black hover:bg-white/90">
                <a href={defaultRoute}>
                  <span className="sm:hidden">
                    {primaryRole === "creator" ? "Studio" : "Open VYBE"}
                  </span>
                  <span className="hidden sm:inline">{appLabel}</span>
                  <LayoutDashboard className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : preferredAppLink ? (
              <Button asChild size="sm" className="bg-white text-black hover:bg-white/90">
                <a href={preferredAppLink} target="_blank" rel="noreferrer">
                  Get the app <Download className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-white text-black hover:bg-white/90">
                <Link to="/auth/redirect">
                  Open VYBE <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            <button
              type="button"
              onClick={() => setAppBarVisible(false)}
              className="rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss VYBE invitation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-6 md:pt-16">
        <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/25 bg-fuchsia-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-fuchsia-200">
              <Sparkles className="h-3.5 w-3.5" /> A personal VYBE from {data.artistName}
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-.04em] sm:text-5xl md:text-7xl">
              {data.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/70">
              {data.description || `${data.artistName} chose these songs for this moment.`}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/55">
              {data.occasion && (
                <span className="font-semibold text-amber-300">{data.occasion}</span>
              )}
              <span>{data.tracks.length} tracks</span>
              <span>{minutes} min</span>
              <span className="inline-flex items-center gap-1.5">
                <Headphones className="h-4 w-4 text-cyan-300" /> No sign-in needed
              </span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {data.artistUsername && (
                <Button asChild className="rounded-full bg-white text-black hover:bg-white/90">
                  <Link to="/artist/$username" params={{ username: data.artistUsername }}>
                    <UserRound className="mr-2 h-4 w-4" /> Meet {data.artistName}
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={sharePlaylist}
                className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
                {copied ? "Link copied" : "Share this VYBE"}
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-fuchsia-500/20 via-violet-500/5 to-cyan-400/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[.055] p-3 shadow-2xl backdrop-blur-xl">
              <SharedPlaylistPlayer tracks={data.tracks} playlistSlug={slug} />
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-pink-300/15 bg-gradient-to-br from-pink-400/10 to-transparent p-6">
            <UserPlus className="h-6 w-6 text-pink-300" />
            <h2 className="mt-4 text-xl font-semibold">Stay close to the artist</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Follow new music, stories, events, merch, and the moments behind every release.
            </p>
          </div>
          <div className="rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/10 to-transparent p-6">
            <Heart className="h-6 w-6 text-cyan-300" />
            <h2 className="mt-4 text-xl font-semibold">Save what moves you</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Keep this playlist, build your own, and return without searching for the link.
            </p>
          </div>
          <div className="rounded-3xl border border-amber-300/15 bg-gradient-to-br from-amber-400/10 to-transparent p-6">
            <Sparkles className="h-6 w-6 text-amber-300" />
            <h2 className="mt-4 text-xl font-semibold">Find your next VYBE</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Discover independent creators through people, stories, moods, and shared moments.
            </p>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(120deg,rgba(168,85,247,.22),rgba(236,72,153,.15)_45%,rgba(34,211,238,.16))] p-7 md:flex md:items-center md:justify-between md:gap-10 md:p-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-cyan-200">
              Don’t let the last song be the end
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Keep the connection going.</h2>
            <p className="mt-3 leading-7 text-white/65">
              Join VYBE to follow {data.artistName}, save this playlist, and hear what comes next.
              Listening here will always stay simple.
            </p>
          </div>
          <div className="mt-6 flex shrink-0 flex-wrap gap-3 md:mt-0 md:flex-col">
            {appLinks.deepLink && (
              <Button asChild className="rounded-full bg-white text-black hover:bg-white/90">
                <a href={appLinks.deepLink}>
                  Open in the app <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
            {preferredAppLink ? (
              <Button asChild className="rounded-full bg-white text-black hover:bg-white/90">
                <a href={preferredAppLink} target="_blank" rel="noreferrer">
                  Download VYBE <Download className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button asChild className="rounded-full bg-white text-black hover:bg-white/90">
                <Link to="/auth/sign-up">
                  Join the founding VYBE <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant="ghost"
              className="rounded-full text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/explore" search={{ q: "" }}>
                Explore the VYBE site
              </Link>
            </Button>
          </div>
        </section>

        <ListenerConnectionForm slug={slug} artistName={data.artistName} />

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[.035] p-7 text-center">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-fuchsia-200">
            Founding creator preview
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Help shape what playlists become.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/55">
            VYBE is testing this experience with creators and listeners before paid creator plans
            launch. What you play, save, share, and ask for will guide the tools we build next.
          </p>
        </section>
      </main>
    </div>
  );
}
