import { Minimize2, Pause, Play, Repeat2, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatDuration, type Track } from "@/features/music/schema";
import type { NowPlayingExperienceLevel } from "@/features/membership/entitlements";
import { FollowCreatorButton } from "@/components/engagement/FollowCreatorButton";
import { TrackSupportActions } from "@/components/engagement/TrackSupportActions";
import { cn } from "@/lib/utils";

const levelLabel: Record<NowPlayingExperienceLevel, string> = {
  standard: "Standard",
  immersive: "Immersive",
  motion: "Motion",
  motion_plus: "Motion+",
};

export function ImmersiveNowPlaying({
  open,
  track,
  creatorUserId,
  creatorName,
  level,
  playing,
  elapsed,
  duration,
  volume,
  repeat,
  canPrevious,
  canNext,
  onClose,
  onTogglePlayback,
  onPrevious,
  onNext,
  onToggleRepeat,
  onSeek,
  onVolumeChange,
}: {
  open: boolean;
  track: Track;
  creatorUserId: string;
  creatorName: string;
  level: NowPlayingExperienceLevel;
  playing: boolean;
  elapsed: number;
  duration: number;
  volume: number;
  repeat: boolean;
  canPrevious: boolean;
  canNext: boolean;
  onClose: () => void;
  onTogglePlayback: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleRepeat: () => void;
  onSeek: (value: number) => void;
  onVolumeChange: (value: number) => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-background text-foreground"
      role="dialog"
      aria-modal="true"
      aria-label={`Now playing ${track.title}`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {track.cover_url ? (
          <img
            src={track.cover_url}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20 blur-3xl"
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(168,85,247,.28),transparent_38%),radial-gradient(circle_at_80%_25%,rgba(236,72,153,.18),transparent_35%),linear-gradient(180deg,hsl(var(--background)/.72),hsl(var(--background))_72%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-5 sm:px-8 md:py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-primary">
              VYBE Now Playing
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {levelLabel[level]} experience
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={onClose}
            aria-label="Minimize Now Playing"
          >
            <Minimize2 className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid flex-1 items-center gap-8 py-8 md:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] md:gap-12 lg:gap-16">
          <div className="mx-auto w-full max-w-[30rem]">
            <div className="aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-brand shadow-[0_30px_90px_rgba(0,0,0,.45)]">
              {track.cover_url ? (
                <img
                  src={track.cover_url}
                  alt={`${track.title} cover`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-7xl font-bold text-white/80">
                  V
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">
              {track.genre || "Now playing on VYBE"}
            </p>
            <h1 className="mt-2 break-words text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {track.title}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              {track.primary_artist_name || creatorName}
            </p>

            <div className="mt-7">
              <Slider
                min={0}
                max={Math.max(duration, 1)}
                step={0.1}
                value={[Math.min(elapsed, Math.max(duration, 1))]}
                onValueChange={([value]) => onSeek(value)}
                aria-label="Now Playing progress"
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{formatDuration(elapsed)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!canPrevious}
                  onClick={onPrevious}
                  aria-label="Previous song"
                >
                  <SkipBack />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  className="h-14 w-14 rounded-full bg-gradient-brand text-white shadow-lg"
                  onClick={onTogglePlayback}
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="ml-0.5 h-6 w-6 fill-current" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!canNext}
                  onClick={onNext}
                  aria-label="Next song"
                >
                  <SkipForward />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onToggleRepeat}
                  className={cn(repeat && "bg-primary/10 text-primary")}
                  aria-label="Repeat current song"
                >
                  <Repeat2 />
                </Button>
              </div>
              <TrackSupportActions trackId={track.id} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <FollowCreatorButton creatorUserId={creatorUserId} />
              <div className="flex min-w-[12rem] flex-1 items-center gap-3">
                {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={[volume]}
                  onValueChange={([value]) => onVolumeChange(value)}
                  aria-label="Now Playing volume"
                />
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-background/40 p-4 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">
                About this experience
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This is the VYBE Now Playing foundation. Plus creators unlock the immersive presentation.
                Pro and Studio creators are already mapped to Motion and Motion+ for the next visual phases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
