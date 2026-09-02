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
import { secureMediaService } from "@/services/media/secureMediaService";

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

      <main className="relative z-10 mx-auto max-w-5xl px-3 pb-32 pt-5 sm:px-6 sm:pt-8">
        <section className="relative mb-5 overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/[.035] shadow-2xl">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={sharePlaylist}
            className="absolute right-3 top-3 z-20 h-10 w-10 rounded-full border-white/20 bg-black/55 text-white backdrop-blur-md hover:bg-black/75 hover:text-white"
            aria-label={copied ? "Playlist link copied" : "Share this VYBE"}
            title={copied ? "Link copied" : "Share this VYBE"}
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          </Button>

          <div className="relative h-32 overflow-hidden bg-gradient-to-r from-fuchsia-950 via-violet-950 to-cyan-950 sm:h-44">
            <img
              src={data.artistBannerUrl || "/banners/default-creator-banner.png"}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-xl"
            />
            <img
              src={data.artistBannerUrl || "/banners/default-creator-banner.png"}
              alt={`${data.artistName} banner`}
              className="relative z-10 h-full w-full object-contain"
            />

            <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#070811] via-black/10 to-transparent" />
          </div>

          <div className="relative flex items-center gap-3 border-t border-white/10 bg-[#090b15]/92 px-4 py-3 backdrop-blur-xl sm:gap-4 sm:px-6 sm:py-4">
            <img
              src={playlistArtwork}
              alt={data.cover_url ? `${data.title} playlist cover` : `${data.title} default VYBE playlist cover`}
              className="h-16 w-16 shrink-0 rounded-xl border border-white/15 bg-violet-950 object-cover shadow-xl sm:h-20 sm:w-20"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold sm:text-lg">{data.artistName}</p>
              <p className="text-xs text-white/50">Independent creator</p>
              <h1 className="mt-1 line-clamp-2 text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-cyan-300 sm:text-lg">{data.title}</h1>
            </div>
            {data.artistUsername ? (
              <Button asChild size="sm" variant="outline" className="shrink-0 rounded-full border-fuchsia-300/35 bg-fuchsia-400/10 px-3 text-white hover:bg-fuchsia-400/20 hover:text-white">
                <Link to="/artist/$username" params={{ username: data.artistUsername }} search={{ track: "" }}><UserPlus className="mr-1.5 h-4 w-4" />Follow</Link>
              </Button>
            ) : null}
          </div>
        </section>

        <section>
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-fuchsia-500/20 via-violet-500/5 to-cyan-400/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/[.055] p-1 shadow-2xl backdrop-blur-xl sm:p-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/10 px-3 py-2 text-[10px] text-white/50 sm:px-4 sm:text-xs">
                <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-[.13em] text-fuchsia-200"><Sparkles className="h-3 w-3" />A personal VYBE</span>
                <span>{data.tracks.length} tracks · {minutes} min</span>
                <span className="inline-flex items-center gap-1"><Headphones className="h-3 w-3 text-cyan-300" />{accessLabel}</span>
              </div>
              <SharedPlaylistPlayer
                tracks={data.tracks}
                playlistSlug={slug}
                autoPlayOnOpen
                resolvePlaybackUrl={(track) =>
                  secureMediaService.playbackUrl(
                    slug,
                    track,
                    submittedPassword || undefined,
                  )
                }
              />
            </div>
          </div>

          <div className="mt-2 px-2">
            <p className="line-clamp-2 max-w-2xl text-xs leading-5 text-white/45 sm:text-sm">
              {data.description || `${data.artistName} chose these songs for this moment.`}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/[.025] p-4 sm:p-6">
          <h2 className="text-center text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-cyan-300 sm:text-2xl">One link. Your whole VYBE.</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-400/[.07] p-4">
              <Heart className="h-5 w-5 text-fuchsia-300" />
              <h3 className="mt-2 font-semibold text-fuchsia-200">For Supporters</h3>
              <p className="mt-1 text-sm leading-5 text-white/55">Listen freely, then join when you are ready to:</p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-white/60"><li>• Follow creators and receive updates</li><li>• Save playlists and return anytime</li><li>• Connect directly when creators allow it</li><li>• Discover music, films, stories, and more</li></ul>
              <Button asChild size="sm" variant="outline" className="mt-3 w-full border-fuchsia-300/35 bg-transparent text-fuchsia-200 hover:bg-fuchsia-400/10 hover:text-white"><Link to="/auth/sign-up">Get your VYBE</Link></Button>
              <div className="mt-2 flex justify-center"><PlaylistSaveButton playlistId={data.id} /></div>
            </div>
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/[.07] p-4">
              <UserPlus className="h-5 w-5 text-cyan-300" />
              <h3 className="mt-2 font-semibold text-cyan-200">For Creators</h3>
              <p className="mt-1 text-sm leading-5 text-white/55">Bring your work and audience together:</p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-white/60"><li>• Share playable work through one link</li><li>• Build a recognizable creator presence</li><li>• Connect directly with supporters</li><li>• See listening and engagement insights</li></ul>
              <Button asChild size="sm" variant="outline" className="mt-3 w-full border-cyan-300/35 bg-transparent text-cyan-200 hover:bg-cyan-400/10 hover:text-white"><Link to="/for-artists">Create on VYBE</Link></Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
            <a href="#connect" className="text-fuchsia-300 hover:text-fuchsia-200"><UserRound className="mr-1.5 inline h-4 w-4" />Connect with {data.artistName}</a>
            <Link to="/explore" search={{ q: "" }} className="text-cyan-300 hover:text-cyan-200">Discover creators <ArrowRight className="ml-1 inline h-4 w-4" /></Link>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(120deg,rgba(168,85,247,.14),rgba(34,211,238,.09))] p-4 md:flex md:items-center md:justify-between md:gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-200">
              Don’t let the last song be the end
            </p>

            <h2 className="mt-1 text-lg font-bold tracking-tight">Keep the connection going.</h2>

            <p className="mt-1 text-sm leading-5 text-white/55">
              Join VYBE to follow {data.artistName}, save this playlist, and hear what comes next.
              Listening here will always stay simple.
            </p>
          </div>

          <div className="mt-3 flex shrink-0 flex-wrap gap-2 md:mt-0">
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

        <div id="connect" className="mt-5 scroll-mt-24">
          <ListenerConnectionForm slug={slug} artistName={data.artistName} />
        </div>

        <section className="mt-5 rounded-[1.75rem] border border-white/10 bg-white/[.035] p-5 text-center">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-fuchsia-200">
            Founding creator preview
          </p>

          <h2 className="mt-2 text-xl font-semibold">Help shape what playlists become.</h2>

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
