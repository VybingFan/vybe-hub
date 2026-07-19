import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { formatDuration, type Track } from "@/features/music/schema";

export function SharedPlaylistPlayer({ tracks }: { tracks: Track[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const track = tracks[current];

  useEffect(() => {
    setElapsed(0);
    if (playing) audioRef.current?.play().catch(() => setPlaying(false));
  }, [current, playing]);

  if (!track)
    return (
      <p className="rounded-2xl border border-border p-6 text-muted-foreground">
        This playlist does not have any songs yet.
      </p>
    );

  const select = (index: number) => {
    setCurrent(index);
    setPlaying(true);
  };
  const toggle = async () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else await audioRef.current.play();
    setPlaying(!playing);
  };
  const next = () => setCurrent((value) => (value + 1 < tracks.length ? value + 1 : 0));
  const previous = () => setCurrent((value) => (value > 0 ? value - 1 : tracks.length - 1));
  const seek = ([value]: number[]) => {
    if (audioRef.current) audioRef.current.currentTime = value;
    setElapsed(value);
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-card shadow-elevated">
      <audio
        ref={audioRef}
        src={track.audio_url}
        onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
        onEnded={next}
      />
      <div className="grid gap-7 p-6 md:grid-cols-[220px_1fr] md:p-8">
        <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-brand">
          {track.cover_url ? (
            <img src={track.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl font-bold text-white/90">
              V
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">
            Now playing
          </p>
          <h2 className="mt-2 truncate text-3xl font-semibold">{track.title}</h2>
          <p className="mt-2 text-muted-foreground">{track.genre || "Independent music"}</p>
          <div className="mt-7">
            <Slider
              min={0}
              max={track.duration_sec || 1}
              step={1}
              value={[Math.min(elapsed, track.duration_sec || 1)]}
              onValueChange={seek}
              aria-label="Track progress"
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{formatDuration(elapsed)}</span>
              <span>{formatDuration(track.duration_sec)}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button variant="ghost" size="icon" onClick={previous} aria-label="Previous song">
              <SkipBack />
            </Button>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-gradient-brand text-white"
              onClick={toggle}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="fill-current" />
              ) : (
                <Play className="ml-1 fill-current" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={next} aria-label="Next song">
              <SkipForward />
            </Button>
          </div>
        </div>
      </div>
      <div className="border-t border-border/70 p-3 md:p-5">
        {tracks.map((item, index) => (
          <button
            key={item.id}
            onClick={() => select(index)}
            className={cn(
              "flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition hover:bg-white/5",
              index === current && "bg-primary/10",
            )}
          >
            <span className="w-6 text-center text-xs text-muted-foreground">
              {index === current && playing ? "▶" : index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{item.title}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {item.genre || "VYBE artist"}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDuration(item.duration_sec)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
