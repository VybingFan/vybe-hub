import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Download,
  ExternalLink,
  Headphones,
  Heart,
  KeyRound,
  Loader2,
  Share2,
  Sparkles,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { ListenerConnectionForm } from "@/components/connections/ListenerConnectionForm";
import { SharedPlaylistPlayer } from "@/components/playlists/SharedPlaylistPlayer";
import { PlaylistSaveButton } from "@/components/engagement/PlaylistSaveButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appLinks, getPreferredAppLink } from "@/config/appLinks";
import { useSharedPlaylist } from "@/hooks/usePlaylists";
import { activityService } from "@/services/activity/activityService";

export const Route = createFileRoute("/playlist/$slug")({
  component: SharedPlaylistPage,
});

function SharedPlaylistPage() {
  const { slug } = Route.useParams();

  return <SharedPlaylistExperience slug={slug} />;
}

export function SharedPlaylistExperience({ slug }: { slug: string }) {
  const [password, setPassword] = useState("");
  const [submittedPassword, setSubmittedPassword] = useState("");
  const {
    data: authorization,
    isLoading,
    error,
  } = useSharedPlaylist(slug, submittedPassword || undefined);

  const [appBarVisible, setAppBarVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const data = authorization?.playlist ?? null;

  useEffect(() => {
    if (authorization?.authorized && data) {
      void activityService.record(slug, "link_opened");
    }
  }, [authorization?.authorized, data, slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <PlaylistAccessState
        title="We could not check this playlist."
        message={error instanceof Error ? error.message : "Please refresh the page and try again."}
      />
    );
  }

  if (authorization && !authorization.authorized) {
    if (authorization.reason === "PASSWORD_REQUIRED") {
      const submitPassword = (event: FormEvent) => {
        event.preventDefault();
        if (password) setSubmittedPassword(password);
      };

      return (
        <PlaylistAccessState
          title="This playlist requires a password."
          message={
            submittedPassword
              ? "That password was not accepted. Check it and try again."
              : "Enter the password provided by the creator."
          }
        >
          <form onSubmit={submitPassword} className="mx-auto mt-6 max-w-sm text-left">
            <Label htmlFor="shared-playlist-password">Playlist password</Label>
            <Input
              id="shared-playlist-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 border-white/20 bg-white/5 text-white"
              autoFocus
            />
            <Button
              type="submit"
              disabled={!password}
              className="mt-3 w-full rounded-full bg-white text-black hover:bg-white/90"
            >
              <KeyRound className="mr-2 h-4 w-4" /> Unlock playlist
            </Button>
          </form>
        </PlaylistAccessState>
      );
    }

    const accessState = getPlaylistAccessState(authorization.reason);

    return (
      <PlaylistAccessState
        title={accessState.title}
        message={accessState.message}
        showSignIn={accessState.showSignIn}
      />
    );
  }

  if (!data) {
    return (
      <PlaylistAccessState
        title="This playlist is not available."
        message="It may have been removed, unpublished, expired, or shared with a different audience."
      />
    );
  }

  const playlistArtwork = data.cover_url || "/branding/vybe-mark.webp";

  const totalSeconds = data.tracks.reduce((total: number, track) => total + track.duration_sec, 0);

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

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  };

  const accessLabel = getAccessLabel(authorization?.accessMode, data.require_sign_in);

  return (
    <div className="min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[48rem] bg-[radial-gradient(circle_at_20%_10%,rgba(217,70,239,.28),transparent_34%),radial-gradient(circle_at_85%_16%,rgba(34,211,238,.2),transparent_32%),linear-gradient(to_bottom,transparent,#070811_90%)]" />

      {appBarVisible ? (
        <div className="relative z-30 border-b border-white/10 bg-[#0a0b14]/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-2 px-3 py-2 sm:min-h-20 sm:gap-3 sm:px-6 sm:py-3">
            <Link to="/" className="shrink-0" aria-label="VYBE home">
              <Logo className="[&_img]:h-8 [&_img]:w-9 [&_span]:text-base sm:[&_img]:h-9 sm:[&_img]:w-11 sm:[&_span]:text-lg" />
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

            {preferredAppLink ? (
              <Button asChild size="sm" className="bg-white text-black hover:bg-white/90">
                <a href={preferredAppLink} target="_blank" rel="noreferrer">
                  Get the app
                  <Download className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-white text-black hover:bg-white/90">
                <Link to="/auth/sign-up">
                  Get VYBE
                  <ArrowRight className="ml-2 h-4 w-4" />
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
      ) : null}

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-6 md:pt-16">
        <section className="relative mb-9 sm:mb-12">
          <div className="h-32 overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-r from-fuchsia-950 via-violet-950 to-cyan-950 sm:h-60 sm:rounded-[2rem]">
            <img
              src={data.artistBannerUrl || "/banners/default-creator-banner.png"}
              alt={`${data.artistName} banner`}
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-[#070811] via-black/15 to-transparent" />
          </div>

          <div className="-mt-12 flex items-end gap-3 px-4 sm:-mt-20 sm:gap-4 sm:px-8">
            <img
              src={playlistArtwork}
              alt={
                data.cover_url
                  ? `${data.title} playlist cover`
                  : `${data.title} default VYBE playlist cover`
              }
              className="relative h-24 w-24 shrink-0 rounded-2xl border-4 border-[#070811] bg-violet-950 object-cover shadow-2xl sm:h-36 sm:w-36"
            />

            <div className="relative min-w-0 pb-2">
              <p className="truncate text-sm text-white/60">Playlist by</p>

              <p className="truncate text-lg font-semibold sm:text-xl">{data.artistName}</p>
            </div>
          </div>
        </section>

        <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <div>
            <div className="inline-flex max-w-full items-center gap-2 rounded-2xl border border-fuchsia-300/25 bg-fuchsia-400/10 px-3 py-2 text-[10px] font-semibold uppercase leading-4 tracking-[.12em] text-fuchsia-200 sm:rounded-full sm:py-1.5 sm:text-xs sm:tracking-[.18em]">
              <Sparkles className="h-3.5 w-3.5" />A personal VYBE from {data.artistName}
            </div>

            <h1 className="mt-5 break-words text-3xl font-black tracking-[-.035em] sm:text-5xl md:text-7xl">
              {data.title}
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-white/70 sm:mt-5 sm:text-lg sm:leading-8">
              {data.description || `${data.artistName} chose these songs for this moment.`}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/55">
              {data.occasion ? (
                <span className="font-semibold text-amber-300">{data.occasion}</span>
              ) : null}

              <span>{data.tracks.length} tracks</span>
              <span>{minutes} min</span>

              <span className="inline-flex items-center gap-1.5">
                <Headphones className="h-4 w-4 text-cyan-300" />
                {accessLabel}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {data.artistUsername ? (
                <Button asChild className="rounded-full bg-white text-black hover:bg-white/90">
                  <Link
                    to="/artist/$username"
                    params={{
                      username: data.artistUsername,
                    }}
                    search={{ track: "" }}
                  >
                    <UserRound className="mr-2 h-4 w-4" />
                    Meet {data.artistName}
                  </Link>
                </Button>
              ) : null}

              <Button
                variant="outline"
                onClick={sharePlaylist}
                className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}

                {copied ? "Link copied" : "Share this VYBE"}
              </Button>

              <PlaylistSaveButton playlistId={data.id} />
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
            {appLinks.deepLink ? (
              <Button asChild className="rounded-full bg-white text-black hover:bg-white/90">
                <a href={appLinks.deepLink}>
                  Open in the app
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}

            {preferredAppLink ? (
              <Button asChild className="rounded-full bg-white text-black hover:bg-white/90">
                <a href={preferredAppLink} target="_blank" rel="noreferrer">
                  Download VYBE
                  <Download className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button asChild className="rounded-full bg-white text-black hover:bg-white/90">
                <Link to="/auth/sign-up">
                  Join the founding VYBE
                  <ArrowRight className="ml-2 h-4 w-4" />
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

function getAccessLabel(
  accessMode: string | null | undefined,
  requireSignIn: boolean | undefined,
): string {
  switch (accessMode) {
    case "approved_listeners":
      return "Approved listener access";

    case "membership_only":
      return "Members-only access";

    case "password":
      return "Password-protected access";

    case "unlisted":
      return requireSignIn ? "Private link · sign-in required" : "Private link access";

    case "public":
    default:
      return requireSignIn ? "Sign-in required" : "No sign-in needed";
  }
}

function getPlaylistAccessState(reason: string): {
  title: string;
  message: string;
  showSignIn?: boolean;
} {
  switch (reason) {
    case "NOT_SIGNED_IN":
      return {
        title: "Sign in to continue.",
        message:
          "This creator shared the playlist with approved listeners. Sign in using the VYBE account connected to your invitation.",
        showSignIn: true,
      };

    case "PASSWORD_REQUIRED":
      return {
        title: "This playlist requires a password.",
        message: "Password entry will be enabled in the next protected-sharing package.",
      };

    case "ACCESS_DENIED":
      return {
        title: "This playlist was not shared with this account.",
        message: "Sign in with the invited email address or ask the creator to add your account.",
        showSignIn: true,
      };

    case "PLAYLIST_EXPIRED":
      return {
        title: "This listening experience has ended.",
        message: "The creator’s protected sharing period has expired.",
      };

    case "INVITATION_REVOKED":
      return {
        title: "Access has been revoked.",
        message: "The creator has withdrawn this playlist invitation.",
      };

    case "PLAY_LIMIT_REACHED":
      return {
        title: "The listening limit has been reached.",
        message: "This invitation no longer has any remaining authorized plays.",
      };

    case "MEMBERSHIP_REQUIRED":
      return {
        title: "This playlist is for members.",
        message: "Sign in with your VYBE account to verify your membership.",
        showSignIn: true,
      };

    case "RESOURCE_NOT_FOUND":
      return {
        title: "This playlist is not available.",
        message: "It may have been removed, unpublished, or shared using a different link.",
      };

    case "UNSUPPORTED_ACCESS_MODE":
      return {
        title: "This playlist cannot be opened yet.",
        message: "The playlist uses an access setting that is not currently available.",
      };

    default:
      return {
        title: "This playlist is not available.",
        message: "The link may be invalid, expired, or restricted to another audience.",
      };
  }
}

function PlaylistAccessState({
  title,
  message,
  showSignIn = false,
  children,
}: {
  title: string;
  message: string;
  showSignIn?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070811] px-6 text-white">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[.055] p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="flex justify-center">
          <Logo variant="horizontal" />
        </div>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>

        <p className="mx-auto mt-4 max-w-md leading-7 text-white/65">{message}</p>

        {children}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {showSignIn ? (
            <Button asChild className="rounded-full bg-white text-black hover:bg-white/90">
              <Link to="/auth/sign-in">Sign in to VYBE</Link>
            </Button>
          ) : null}

          <Button
            asChild
            variant="outline"
            className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/explore" search={{ q: "" }}>
              Discover VYBE
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
