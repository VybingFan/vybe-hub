import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Disc3,
  Pause,
  Play,
  Radio,
  Repeat2,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatDuration, type Track } from "@/features/music/schema";
import { cn } from "@/lib/utils";
import { FollowCreatorButton } from "@/components/engagement/FollowCreatorButton";
import { TrackSupportActions } from "@/components/engagement/TrackSupportActions";
import { ImmersiveNowPlaying } from "@/components/music/ImmersiveNowPlaying";
import { getNowPlayingExperienceLevel } from "@/features/membership/entitlements";
import type { CreatorPlanCode } from "@/features/membership/catalog";

export function CreatorContinuationPlayer({
  queue,
  selectedId,
  topTrackIds,
  creatorUserId,
  creatorName,
  featuredCollectionLabel = "Artist’s Top 5",
  onSelect,
  resolvePlaybackUrl,
  docked = false,
  planCode,
}: {
  queue: Track[];
  selectedId?: string;
  topTrackIds: Set<string>;
  creatorUserId: string;
  creatorName: string;
  featuredCollectionLabel?: string;
  onSelect: (id: string) => void;
  resolvePlaybackUrl?: (track: Track) => Promise<string>;
  docked?: boolean;
  planCode?: CreatorPlanCode | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const mounted = useRef(false);
  const shouldAutoplay = useRef(false);
  const completed = useRef(new Set<string>());
  const index = Math.max(
    0,
    queue.findIndex((track) => track.id === selectedId),
  );
  const track = queue[index];
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [repeat, setRepeat] = useState(false);
  const [choice, setChoice] = useState<"top-five" | "library" | null>(null);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState("");
  const [resolvingAudio, setResolvingAudio] = useState(false);
  const resolvedTrackId = useRef<string | null>(null);
  const nowPlayingLevel = getNowPlayingExperienceLevel(planCode);
  const canExpandNowPlaying = nowPlayingLevel !== "standard";

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    shouldAutoplay.current = true;
  }, [selectedId]);
  useEffect(() => {
    if (!track) return;
    if (resolvedTrackId.current !== track.id) {
      resolvedTrackId.current = null;
      setResolvedAudioUrl(track.audio_url || "");
    }
    if (!shouldAutoplay.current || track.audio_url) return;
    if (!resolvePlaybackUrl || !(track.playback_available ?? Boolean(track.audio_url))) {
      shouldAutoplay.current = false;
      return;
    }
    let cancelled = false;
    setResolvingAudio(true);
    void resolvePlaybackUrl(track)
      .then((url) => {
        if (cancelled) return;
        resolvedTrackId.current = track.id;
        setResolvedAudioUrl(url);
      })
      .finally(() => {
        if (!cancelled) setResolvingAudio(false);
      });
    return () => { cancelled = true; };
  }, [track?.id, track?.audio_url, track?.playback_available, resolvePlaybackUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    const sourceUrl = track?.audio_url || resolvedAudioUrl;
    if (!audio || !sourceUrl) return;
    setElapsed(0);
    setDuration(track.duration_sec || 0);
    audio.load();
    if (shouldAutoplay.current) {
      shouldAutoplay.current = false;
      void audio.play().catch(() => setPlaying(false));
    }
  }, [track?.id, track?.audio_url, resolvedAudioUrl]);

  if (!track) return null;

  const nextIndex = queue.findIndex(
    (item, itemIndex) =>
      itemIndex > index && !completed.current.has(item.id),
  );
  const next = nextIndex >= 0 ? queue[nextIndex] : undefined;
  const source = topTrackIds.has(track.id)
    ? featuredCollectionLabel
    : "More from this creator";
  const startCurrent = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    if (track.audio_url || resolvedAudioUrl) {
      void audio.play().catch(() => setPlaying(false));
      return;
    }
    if (!resolvePlaybackUrl || !(track.playback_available ?? Boolean(track.audio_url))) return;
    setResolvingAudio(true);
    try {
      const url = await resolvePlaybackUrl(track);
      if (!url) return;
      resolvedTrackId.current = track.id;
      shouldAutoplay.current = true;
      setResolvedAudioUrl(url);
    } finally {
      setResolvingAudio(false);
    }
  };

  const choose = (nextTrack: Track | undefined) => {
    if (!nextTrack) return;
    setChoice(null);
    shouldAutoplay.current = true;
    onSelect(nextTrack.id);
  };

  const replayCreator = () => {
    completed.current.clear();
    setChoice(null);
    const first = queue[0];
    if (!first) return;
    if (first.id === track.id && audioRef.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
      return;
    }
    choose(first);
  };

  const ended = () => {
    if (repeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
      return;
    }
    completed.current.add(track.id);
    const finishedTopFive = index === topTrackIds.size - 1 && Boolean(next);
    if (finishedTopFive) {
      setPlaying(false);
      setChoice("top-five");
    } else if (next) choose(next);
    else {
      setPlaying(false);
      setChoice("library");
    }
  };

  const changeVolume = ([value]: number[]) => {
    const safe = Math.min(1, Math.max(0, value));
    setVolume(safe);
    if (audioRef.current) audioRef.current.volume = safe;
  };

  return (
    <>
      <div
        className={cn(
          "overflow-hidden border border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,.22),transparent_42%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--background)))] shadow-elevated",
          docked
            ? "fixed inset-x-0 bottom-0 z-50 rounded-none border-x-0 border-b-0 bg-background/95 shadow-[0_-10px_30px_rgba(0,0,0,.45)] backdrop-blur-xl"
            : "mt-4 rounded-3xl",
        )}
      >
        <audio
          ref={audioRef}
          src={track.audio_url || resolvedAudioUrl || undefined}
          preload="metadata"
          controlsList="nodownload noremoteplayback"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(event) =>
            setElapsed(event.currentTarget.currentTime)
          }
          onLoadedMetadata={(event) => {
            setDuration(
              Number.isFinite(event.currentTarget.duration)
                ? event.currentTarget.duration
                : track.duration_sec,
            );
            event.currentTarget.volume = volume;
          }}
          onEnded={ended}
        />
        <div
          className={cn(
            docked ? "grid min-h-[76px] grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 px-3 py-2 sm:grid-cols-[3.5rem_minmax(180px,1fr)_auto] sm:px-5" : "grid gap-5 p-4 sm:grid-cols-[7rem_1fr] sm:p-6",
          )}
        >
          <div className={cn("aspect-square overflow-hidden bg-gradient-brand", docked ? "h-12 w-12 rounded-lg sm:h-14 sm:w-14" : "rounded-2xl")}>
            {track.cover_url ? (
              <img
                src={track.cover_url}
                alt={`${track.title} cover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Disc3 className="h-9 w-9 text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className={cn("text-xs font-semibold uppercase tracking-[.2em] text-primary", docked && "hidden")}>
              {source}
            </p>
            <h3 className={cn("mt-1 truncate font-semibold", docked ? "text-sm sm:text-base" : "text-2xl")}>
              {track.title}
            </h3>
            <p className={cn("truncate text-sm text-muted-foreground", docked && "text-xs")}>
              {track.primary_artist_name || "VYBE artist"}
              {track.genre ? ` · ${track.genre}` : ""}
            </p>
            <div className={cn("mt-4", docked && "hidden")}>
              <Slider
                min={0}
                max={Math.max(duration, 1)}
                step={0.1}
                value={[Math.min(elapsed, Math.max(duration, 1))]}
                onValueChange={([value]) => {
                  if (audioRef.current)
                    audioRef.current.currentTime = value;
                  setElapsed(value);
                }}
              />
            </div>
            <div className={cn("mt-1 justify-between text-xs text-muted-foreground", docked ? "hidden" : "flex")}>
              <span>{formatDuration(elapsed)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
            <div className={cn("flex items-center justify-between gap-2", docked ? "col-span-2 mt-1 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:mt-0" : "mt-3")}>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={index === 0}
                  onClick={() => choose(queue[index - 1])}
                  aria-label="Previous song"
                >
                  <SkipBack />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  className={cn("rounded-full bg-gradient-brand text-white", docked ? "h-10 w-10 sm:h-11 sm:w-11" : "h-12 w-12")}
                  onClick={() => void startCurrent()}
                    disabled={resolvingAudio}
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? (
                    <Pause className="fill-current" />
                  ) : (
                    <Play className="ml-0.5 fill-current" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!next}
                  onClick={() => choose(next)}
                  aria-label="Next song"
                >
                  <SkipForward />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setRepeat((value) => !value)}
                  className={cn(repeat && "bg-primary/10 text-primary")}
                  aria-label="Repeat current song"
                >
                  <Repeat2 />
                </Button>
                {canExpandNowPlaying ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setNowPlayingOpen(true)}
                    aria-label="Open immersive Now Playing"
                    title="Open Now Playing"
                  >
                    <Maximize2 />
                  </Button>
                ) : null}
              </div>
              <TrackSupportActions trackId={track.id} />
              <div className="hidden w-28 items-center gap-2 lg:flex">
                {volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={[volume]}
                  onValueChange={changeVolume}
                />
              </div>
            </div>
          </div>
        </div>
        <div className={cn("flex-wrap justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground sm:px-6", docked ? "hidden" : "flex")}>
          <span>
            Queue {index + 1} of {queue.length}
          </span>
          <span>
            {next
              ? `Up next: ${next.title}`
              : "End of this creator’s available music"}
          </span>
        </div>
        {docked ? (
          <div className="border-t border-primary/20 px-3 pb-1 sm:px-5">
            <Slider
              min={0}
              max={Math.max(duration, 1)}
              step={0.1}
              value={[Math.min(elapsed, Math.max(duration, 1))]}
              onValueChange={([value]) => {
                if (audioRef.current) audioRef.current.currentTime = value;
                setElapsed(value);
              }}
              aria-label="Docked track progress"
            />
          </div>
        ) : null}
      </div>

      <ImmersiveNowPlaying
        open={nowPlayingOpen && canExpandNowPlaying}
        track={track}
        creatorUserId={creatorUserId}
        creatorName={creatorName}
        level={nowPlayingLevel}
        playing={playing}
        elapsed={elapsed}
        duration={duration}
        volume={volume}
        repeat={repeat}
        canPrevious={index > 0}
        canNext={Boolean(next)}
        onClose={() => setNowPlayingOpen(false)}
        onTogglePlayback={() => void startCurrent()}
        onPrevious={() => choose(queue[index - 1])}
        onNext={() => choose(next)}
        onToggleRepeat={() => setRepeat((value) => !value)}
        onSeek={(value) => {
          if (audioRef.current) audioRef.current.currentTime = value;
          setElapsed(value);
        }}
        onVolumeChange={(value) => changeVolume([value])}
      />

      <AlertDialog open={choice !== null} onOpenChange={(open) => !open && setChoice(null)}>
        <AlertDialogContent className="max-w-lg overflow-hidden border-primary/20 p-0">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,.24),transparent_45%)] p-6">
            <AlertDialogHeader>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-brand text-white">
                <Radio className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-2xl">
                {choice === "top-five"
                  ? `You finished ${creatorName}’s ${featuredCollectionLabel}`
                  : `You finished ${creatorName}’s available music`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {choice === "top-five"
                  ? "Continue into this creator’s music library, discover someone new, or stop here."
                  : "Choose whether to replay this creator, discover someone new, or stop here."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="mt-5 grid gap-2">
              {choice === "top-five" ? (
                <Button type="button" className="h-auto justify-start gap-3 py-3" onClick={() => choose(next)}>
                  <Play className="h-5 w-5" /> Continue with this creator’s music library
                </Button>
              ) : (
                <Button type="button" className="h-auto justify-start gap-3 py-3" onClick={replayCreator}>
                  <Repeat2 className="h-5 w-5" /> Replay this creator
                </Button>
              )}
              <Button asChild variant="outline" className="h-auto py-3">
                <Link to="/discover">Discover another creator</Link>
              </Button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border bg-background/60 p-3">
              <div><p className="text-sm font-medium">Follow {creatorName}</p><p className="text-xs text-muted-foreground">Keep their releases and updates close.</p></div>
              <FollowCreatorButton creatorUserId={creatorUserId} />
            </div>

            <AlertDialogCancel className="mt-4 w-full">
              Stop listening
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
