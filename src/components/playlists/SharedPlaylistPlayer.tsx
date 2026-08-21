import { useEffect, useRef, useState } from "react";
import {
  Expand,
  LockKeyhole,
  Pause,
  Play,
  Repeat2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { formatDuration, type Track } from "@/features/music/schema";
import { activityService } from "@/services/activity/activityService";

interface SharedPlaylistPlayerProps {
  tracks: Track[];
  playlistSlug?: string;
  initialTrackId?: string;
  queueLabel?: string;
  autoPlayOnOpen?: boolean;
}

interface ActivePlaybackProgress {
  playbackId: string;
  slug: string;
  trackId: string;
  durationSec: number;
  positionSec: number;
}

function getAudioErrorMessage(audioElement: HTMLAudioElement): string {
  const mediaError = audioElement.error;

  if (!mediaError) {
    return "The audio could not be loaded.";
  }

  switch (mediaError.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return "Audio loading was cancelled.";
    case MediaError.MEDIA_ERR_NETWORK:
      return "A network error prevented the audio from loading.";
    case MediaError.MEDIA_ERR_DECODE:
      return "The browser could not decode this audio file.";
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return "The audio source is missing, expired, or unsupported.";
    default:
      return "The audio could not be played.";
  }
}

export function SharedPlaylistPlayer({
  tracks,
  playlistSlug,
  initialTrackId,
  queueLabel = "Playlist queue",
  autoPlayOnOpen = false,
}: SharedPlaylistPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const recordedTracks = useRef(new Set<string>());
  const shouldAutoplayRef = useRef(false);
  const progressRef = useRef<ActivePlaybackProgress | null>(null);
  const listenedSinceFlushRef = useRef(0);
  const lastObservedTimeRef = useRef(0);
  const attemptedInitialAutoplayRef = useRef(false);

  const initialIndex = initialTrackId ? tracks.findIndex((item) => item.id === initialTrackId) : -1;

  const [current, setCurrent] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [previousVolume, setPreviousVolume] = useState(0.85);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [queueExpanded, setQueueExpanded] = useState(false);

  const track = tracks[current];

  useEffect(() => {
    if (!initialTrackId) {
      return;
    }

    const index = tracks.findIndex((item) => item.id === initialTrackId);

    if (index >= 0) {
      shouldAutoplayRef.current = false;
      setCurrent(index);
    }
  }, [initialTrackId, tracks]);

  /*
   * Reset and load the audio element whenever the selected track
   * or its signed URL changes.
   */
  useEffect(() => {
    const audio = audioRef.current;

    void flushProgress();
    progressRef.current = null;
    listenedSinceFlushRef.current = 0;
    lastObservedTimeRef.current = 0;

    setElapsed(0);
    setAudioDuration(0);
    setPlaybackError(null);
    setPlaying(false);

    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = volume;

    if (!track?.audio_url) {
      setLoadingAudio(false);
      shouldAutoplayRef.current = false;
      return;
    }

    setLoadingAudio(true);
    audio.load();

    if (autoPlayOnOpen && !attemptedInitialAutoplayRef.current) {
      attemptedInitialAutoplayRef.current = true;
      shouldAutoplayRef.current = true;
    }

    if (shouldAutoplayRef.current) {
      const playWhenReady = async () => {
        try {
          await audio.play();
        } catch (error) {
          console.error("Playlist audio playback failed:", error);

          setPlaying(false);
          // Mobile browsers may require one explicit tap before audio can start.
          // Keep the primary play control ready instead of presenting an error.
          if (!autoPlayOnOpen) {
            setPlaybackError("The selected audio could not begin playing.");
          }
        } finally {
          shouldAutoplayRef.current = false;
        }
      };

      void playWhenReady();
    }
  }, [autoPlayOnOpen, current, track?.audio_url]);

  function flushProgress(completed = false) {
    const progress = progressRef.current;
    const listenedDeltaSec = listenedSinceFlushRef.current;

    if (!progress || (listenedDeltaSec <= 0 && !completed)) return Promise.resolve();

    listenedSinceFlushRef.current = 0;
    return activityService.recordProgress({
      ...progress,
      listenedDeltaSec,
      completed,
    });
  }

  if (!track) {
    return (
      <p className="rounded-2xl border border-border p-6 text-white/55">
        This playlist does not have any songs yet.
      </p>
    );
  }

  const displayedDuration = audioDuration || track.duration_sec || 0;

  const canPlay = Boolean(track.audio_url);

  async function startPlayback() {
    const audio = audioRef.current;

    if (!track.audio_url) {
      setPlaybackError("Playback is unavailable for this song.");
      return;
    }

    if (!audio) {
      setPlaybackError("The audio player is unavailable.");
      return;
    }

    try {
      setPlaybackError(null);
      await audio.play();
    } catch (error) {
      console.error("Playlist audio playback failed:", error);

      setPlaying(false);
      setPlaybackError(getAudioErrorMessage(audio));
    }
  }

  function pausePlayback() {
    audioRef.current?.pause();
  }

  async function togglePlayback() {
    const audio = audioRef.current;

    if (!canPlay || !audio) {
      setPlaybackError("Playback is unavailable for this song.");
      return;
    }

    if (audio.paused) {
      await startPlayback();
    } else {
      pausePlayback();
    }
  }

  function selectTrack(index: number) {
    if (index === current) {
      void togglePlayback();
      return;
    }

    shouldAutoplayRef.current = Boolean(tracks[index]?.audio_url);

    setCurrent(index);
  }

  function nextTrack() {
    if (!tracks.length) {
      return;
    }

    let nextIndex: number;

    if (shuffle && tracks.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * tracks.length);
      } while (nextIndex === current);
    } else {
      nextIndex = current + 1 < tracks.length ? current + 1 : 0;
    }

    shouldAutoplayRef.current = playing;
    setCurrent(nextIndex);
  }

  function previousTrack() {
    if (!tracks.length) {
      return;
    }

    const previousIndex = current > 0 ? current - 1 : tracks.length - 1;

    shouldAutoplayRef.current = playing;
    setCurrent(previousIndex);
  }

  function handleEnded() {
    const audio = audioRef.current;

    if (progressRef.current && audio) {
      progressRef.current.positionSec = audio.duration || progressRef.current.durationSec;
    }
    void flushProgress(true);
    progressRef.current = null;
    listenedSinceFlushRef.current = 0;
    lastObservedTimeRef.current = 0;

    if (repeat && audio) {
      audio.currentTime = 0;
      void startPlayback();
      return;
    }

    shouldAutoplayRef.current = true;
    nextTrack();
  }

  function seek([value]: number[]) {
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(value)) {
      return;
    }

    audio.currentTime = value;
    setElapsed(value);
  }

  function toggleMute() {
    const audio = audioRef.current;

    if (volume > 0) {
      setPreviousVolume(volume);
      setVolume(0);

      if (audio) {
        audio.volume = 0;
        audio.muted = true;
      }

      return;
    }

    const restoredVolume = previousVolume > 0 ? previousVolume : 0.85;

    setVolume(restoredVolume);

    if (audio) {
      audio.volume = restoredVolume;
      audio.muted = false;
    }
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0c16] text-white shadow-elevated">
      <audio
        key={`${track.id}-${track.audio_url || "restricted"}`}
        ref={audioRef}
        src={track.audio_url || undefined}
        preload="metadata"
        controlsList="nodownload noremoteplayback"

        onLoadStart={() => {
          if (track.audio_url) {
            setLoadingAudio(true);
          }
        }}
        onCanPlay={() => {
          setLoadingAudio(false);
          setPlaybackError(null);
        }}
        onLoadedMetadata={(event) => {
          const audio = event.currentTarget;

          audio.volume = volume;

          if (Number.isFinite(audio.duration)) {
            setAudioDuration(audio.duration);
          }
        }}
        onPlay={() => {
          setPlaying(true);
          setLoadingAudio(false);
          setPlaybackError(null);

          const audio = audioRef.current;
          if (playlistSlug && audio && (!progressRef.current || progressRef.current.trackId !== track.id)) {
            progressRef.current = {
              playbackId: crypto.randomUUID(),
              slug: playlistSlug,
              trackId: track.id,
              durationSec: audio.duration || track.duration_sec || 1,
              positionSec: audio.currentTime,
            };
            listenedSinceFlushRef.current = 0;
          }
          lastObservedTimeRef.current = audio?.currentTime || 0;

          if (playlistSlug && !recordedTracks.current.has(track.id)) {
            recordedTracks.current.add(track.id);

            void activityService.record(playlistSlug, "playback_started", track.id);
          }
        }}
        onPause={() => {
          setPlaying(false);
          void flushProgress();
        }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          const currentTime = audio.currentTime;
          const delta = currentTime - lastObservedTimeRef.current;

          setElapsed(currentTime);
          if (progressRef.current) {
            progressRef.current.positionSec = currentTime;
            progressRef.current.durationSec = audio.duration || progressRef.current.durationSec;
          }

          // Normal playback advances gradually. Large jumps are seeks and must
          // not be added to listening time.
          if (!audio.paused && delta > 0 && delta <= 2.5) {
            listenedSinceFlushRef.current += delta;
          }
          lastObservedTimeRef.current = currentTime;

          if (listenedSinceFlushRef.current >= 5) {
            void flushProgress();
          }
        }}
        onSeeked={(event) => {
          lastObservedTimeRef.current = event.currentTarget.currentTime;
          if (progressRef.current) progressRef.current.positionSec = event.currentTarget.currentTime;
        }}
        onEnded={handleEnded}
        onError={(event) => {
          const audio = event.currentTarget;

          setLoadingAudio(false);
          setPlaying(false);
          setPlaybackError(getAudioErrorMessage(audio));

          console.error("Playlist audio element error:", audio.error, {
            trackId: track.id,
            audioUrlPresent: Boolean(track.audio_url),
          });
        }}
      />

      <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3 p-3 sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:gap-5 sm:p-5">
        <button type="button" onClick={() => setDetailOpen(true)} className={cn("group relative aspect-square w-full overflow-hidden rounded-xl bg-gradient-brand text-left shadow-lg transition hover:scale-[1.015]", playing && "ring-2 ring-fuchsia-400/40")} aria-label={`Open details for ${track.title}`}>
          {track.cover_url ? (
            <img
              src={track.cover_url}
              alt={`${track.title} cover`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl font-bold text-white/90">
              V
            </div>
          )}
          <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/65 p-1.5 text-white opacity-90 backdrop-blur transition group-hover:scale-105">
            <Expand className="h-3.5 w-3.5" />
          </span>
        </button>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-fuchsia-300">Now playing</p>
          <button type="button" onClick={() => setDetailOpen(true)} className="mt-1 block max-w-full truncate text-left text-base font-semibold transition hover:text-fuchsia-200 sm:text-lg" aria-label={`Open details for ${track.title}`}>{track.title}</button>
          <p className="truncate text-xs text-white/55 sm:text-sm">
            {track.primary_artist_name || "Independent artist"}
            {track.featured_artist_names?.length ? ` feat. ${track.featured_artist_names.join(", ")}` : ""}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-white/55">
            {track.playback_mode === "preview" ? (
              <span className="rounded-full border px-2 py-0.5 text-xs">
                Preview · {track.preview_duration_sec}s
              </span>
            ) : null}

            {!canPlay ? (
              <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
                <LockKeyhole className="h-3 w-3" />
                Playback restricted
              </span>
            ) : null}

            {loadingAudio ? (
              <span className="rounded-full border px-2 py-0.5 text-xs">Loading audio…</span>
            ) : null}
          </div>

          {playbackError ? (
            <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
              {playbackError}
            </div>
          ) : null}

          <div className="mt-3">
            <Slider
              min={0}
              max={Math.max(displayedDuration, 1)}
              step={0.1}
              value={[Math.min(elapsed, Math.max(displayedDuration, 1))]}
              onValueChange={seek}
              disabled={!canPlay}
              aria-label="Track progress"
            />

            <div className="mt-2 flex justify-between text-xs text-white/55">
              <span>{formatDuration(elapsed)}</span>

              <span>{formatDuration(displayedDuration)}</span>
            </div>
          </div>

        </div>

        <div className="col-span-2 flex items-center justify-center gap-2 border-t border-white/10 pt-3 sm:col-span-1 sm:border-0 sm:pt-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={previousTrack}
              disabled={tracks.length < 2}
              aria-label="Previous song"
            >
              <SkipBack />
            </Button>

            <Button
              type="button"
              size="icon"
              className="h-12 w-12 rounded-full bg-gradient-brand text-white"
              onClick={() => void togglePlayback()}
              disabled={!canPlay || loadingAudio}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="fill-current" />
              ) : (
                <Play className="ml-1 fill-current" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={nextTrack}
              disabled={tracks.length < 2}
              aria-label="Next song"
            >
              <SkipForward />
            </Button>

        </div>
      </div>

      <div className="border-t border-white/10 p-2 sm:p-3">
        <div className="flex items-center justify-between px-2 pb-1 sm:px-3">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/55">{queueLabel}</p>
          <div className="hidden items-center gap-1 sm:flex">
            <Button type="button" variant="ghost" size="icon" className={cn("h-7 w-7", shuffle && "text-cyan-300")} onClick={() => setShuffle((value) => !value)} aria-pressed={shuffle} aria-label="Shuffle playlist"><Shuffle className="h-3.5 w-3.5" /></Button>
            <Button type="button" variant="ghost" size="icon" className={cn("h-7 w-7", repeat && "text-pink-300")} onClick={() => setRepeat((value) => !value)} aria-pressed={repeat} aria-label="Repeat current song"><Repeat2 className="h-3.5 w-3.5" /></Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMute} aria-label={volume === 0 ? "Unmute" : "Mute"}>{volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}</Button>
          </div>
        </div>

        {(queueExpanded ? tracks : tracks.slice(0, 3)).map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectTrack(index)}
            className={cn(
              "flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/5 sm:px-3",
              index === current && "bg-primary/10",
            )}
          >
            <span className="w-6 text-center text-xs text-white/55">
              {index === current && playing ? "▶" : index + 1}
            </span>

            <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gradient-brand">
              {item.cover_url ? <img src={item.cover_url} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-xs font-bold text-white">V</span>}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{item.title}</span>

              <span className="block truncate text-xs text-white/55">
                {item.primary_artist_name || "VYBE artist"}

                {item.featured_artist_names?.length
                  ? ` feat. ${item.featured_artist_names.join(", ")}`
                  : ""}
              </span>
            </span>

            <span className="text-xs text-white/55">
              {formatDuration(item.duration_sec)}
            </span>
          </button>
        ))}

        {tracks.length > 3 ? (
          <button type="button" onClick={() => setQueueExpanded((value) => !value)} className="mt-1 w-full rounded-xl py-2 text-xs font-medium text-fuchsia-300 transition hover:bg-white/5 hover:text-fuchsia-200">
            {queueExpanded ? "Show fewer songs" : `View all ${tracks.length} songs`}
          </button>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-white/15 bg-[#090a12]/95 px-3 py-2 shadow-[0_-18px_45px_rgba(0,0,0,.45)] backdrop-blur-xl sm:px-5">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <button type="button" onClick={() => setDetailOpen(true)} className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gradient-brand" aria-label={`Open details for ${track.title}`}>
            {track.cover_url ? <img src={track.cover_url} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center font-bold text-white">V</span>}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{track.title}</p>
            <p className="truncate text-xs text-white/50">{track.primary_artist_name || "VYBE artist"}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={previousTrack} disabled={tracks.length < 2} aria-label="Previous song"><SkipBack className="h-4 w-4" /></Button>
          <Button type="button" size="icon" className="h-11 w-11 rounded-full bg-gradient-brand text-white" onClick={() => void togglePlayback()} disabled={!canPlay || loadingAudio} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}</Button>
          <Button type="button" variant="ghost" size="icon" onClick={nextTrack} disabled={tracks.length < 2} aria-label="Next song"><SkipForward className="h-4 w-4" /></Button>
        </div>
        <div className="mx-auto mt-1 max-w-6xl"><div className="h-0.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" style={{ width: `${Math.min(100, (elapsed / Math.max(displayedDuration, 1)) * 100)}%` }} /></div></div>
      </div>

      {detailOpen ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-3 backdrop-blur-md sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Song details for ${track.title}`}>
          <div className="relative max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/15 bg-[#0b0c16] p-5 shadow-2xl sm:p-7">
            <button type="button" onClick={() => setDetailOpen(false)} className="absolute right-4 top-4 z-10 rounded-full bg-black/55 p-2 text-white backdrop-blur transition hover:bg-black/75" aria-label="Close song details">
              <X className="h-5 w-5" />
            </button>

            <div className="grid gap-6 sm:grid-cols-[minmax(0,280px)_1fr] sm:items-center">
              <div className={cn("mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-[1.75rem] bg-gradient-brand shadow-2xl transition-transform duration-700", playing && "scale-[1.025]")}>
                {track.cover_url ? (
                  <img src={track.cover_url} alt={`${track.title} cover`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-7xl font-bold text-white/90">V</div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[.22em] text-fuchsia-300">Expanded song view</p>
                <h3 className="mt-2 break-words text-3xl font-bold tracking-tight sm:text-4xl">{track.title}</h3>
                <p className="mt-2 text-base text-white/65">
                  {track.primary_artist_name || "Independent artist"}
                  {track.featured_artist_names?.length ? ` feat. ${track.featured_artist_names.join(", ")}` : ""}
                </p>
                {track.genre ? <p className="mt-1 text-sm text-cyan-200/80">{track.genre}</p> : null}

                <div className="mt-6">
                  <Slider min={0} max={Math.max(displayedDuration, 1)} step={0.1} value={[Math.min(elapsed, Math.max(displayedDuration, 1))]} onValueChange={seek} disabled={!canPlay} aria-label="Expanded track progress" />
                  <div className="mt-2 flex justify-between text-xs text-white/45">
                    <span>{formatDuration(elapsed)}</span>
                    <span>{formatDuration(displayedDuration)}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-center gap-4 sm:justify-start">
                  <Button type="button" variant="ghost" size="icon" onClick={previousTrack} disabled={tracks.length < 2} aria-label="Previous song"><SkipBack /></Button>
                  <Button type="button" size="icon" className="h-16 w-16 rounded-full bg-gradient-brand text-white" onClick={() => void togglePlayback()} disabled={!canPlay || loadingAudio} aria-label={playing ? "Pause" : "Play"}>
                    {playing ? <Pause className="fill-current" /> : <Play className="ml-1 fill-current" />}
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={nextTrack} disabled={tracks.length < 2} aria-label="Next song"><SkipForward /></Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
