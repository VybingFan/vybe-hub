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

export function CreatorContinuationPlayer({
  queue,
  selectedId,
  topTrackIds,
  creatorUserId,
  creatorName,
  onSelect,
}: {
  queue: Track[];
  selectedId?: string;
  topTrackIds: Set<string>;
  creatorUserId: string;
  creatorName: string;
  onSelect: (id: string) => void;
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

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    shouldAutoplay.current = true;
  }, [selectedId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track?.audio_url) return;
    setElapsed(0);
    setDuration(track.duration_sec || 0);
    audio.load();
    if (shouldAutoplay.current) {
      shouldAutoplay.current = false;
      void audio.play().catch(() => setPlaying(false));
    }
  }, [track?.id, track?.audio_url]);

  if (!track) return null;

  const nextIndex = queue.findIndex(
    (item, itemIndex) =>
      itemIndex > index && !completed.current.has(item.id),
  );
  const next = nextIndex >= 0 ? queue[nextIndex] : undefined;
  const source = topTrackIds.has(track.id)
    ? "Artist’s Top 5"
    : "More from this creator";

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
      <div className="mt-4 overflow-hidden rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,.22),transparent_42%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--background)))] shadow-elevated">
        <audio
          ref={audioRef}
          src={track.audio_url}
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
        <div className="grid gap-5 p-4 sm:grid-cols-[7rem_1fr] sm:p-6">
          <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-brand">
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
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">
              {source}
            </p>
            <h3 className="mt-1 truncate text-2xl font-semibold">
              {track.title}
            </h3>
            <p className="truncate text-sm text-muted-foreground">
              {track.primary_artist_name || "VYBE artist"}
              {track.genre ? ` · ${track.genre}` : ""}
            </p>
            <div className="mt-4">
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
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{formatDuration(elapsed)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
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
                  className="h-12 w-12 rounded-full bg-gradient-brand text-white"
                  onClick={() =>
                    audioRef.current?.paused
                      ? void audioRef.current.play()
                      : audioRef.current?.pause()
                  }
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
              </div>
              <TrackSupportActions trackId={track.id} />
              <div className="hidden w-36 items-center gap-2 sm:flex">
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
        <div className="flex flex-wrap justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground sm:px-6">
          <span>
            Queue {index + 1} of {queue.length}
          </span>
          <span>
            {next
              ? `Up next: ${next.title}`
              : "End of this creator’s available music"}
          </span>
        </div>
      </div>

      <AlertDialog open={choice !== null} onOpenChange={(open) => !open && setChoice(null)}>
        <AlertDialogContent className="max-w-lg overflow-hidden border-primary/20 p-0">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,.24),transparent_45%)] p-6">
            <AlertDialogHeader>
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-brand text-white">
                <Radio className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-2xl">
                {choice === "top-five"
                  ? `You finished ${creatorName}’s Top 5`
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
