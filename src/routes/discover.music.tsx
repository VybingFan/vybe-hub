import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Headphones, ListMusic, Loader2, Music2, Pause, Play, Search, SkipBack, SkipForward, UserRound, Volume2, VolumeX } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { publicDiscoveryService, type DiscoveryTrack } from "@/services/discovery/publicDiscoveryService";

export const Route = createFileRoute("/discover/music")({
  head: () => ({
    meta: [
      { title: "Discover Music & Creators | VYBE" },
      { name: "description", content: "Listen to music on VYBE and discover artists, songs and creator pages across genres." },
    ],
    links: [{ rel: "canonical", href: "https://vybewithvybe.com/discover/music" }],
  }),
  component: MusicDiscoveryPage,
});

const GENRE_LABELS: Record<string, string> = {
  hiphop: "Hip-Hop",
  randb: "R&B",
  rhythmandblues: "R&B",
  spokenword: "Spoken Word",
  electronicdance: "Electronic / Dance",
};

function genreGroup(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return { key: "moremusic", title: "More Music" };

  const key = raw
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
  const title = GENRE_LABELS[key] ?? raw.replace(/\b\w/g, (letter) => letter.toUpperCase());
  return { key, title };
}

function MusicDiscoveryPage() {
  const [tracks, setTracks] = useState<DiscoveryTrack[]>([]);
  const [selected, setSelected] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [volume, setVolume] = useState(0.85);
  const [previousVolume, setPreviousVolume] = useState(0.85);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    publicDiscoveryService.search("").then((result) => setTracks(result.tracks)).catch((reason) => setError(reason instanceof Error ? reason.message : "Music discovery could not load.")).finally(() => setLoading(false));
  }, []);

  const visibleTracks = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return tracks;
    return tracks.filter((track) => [track.title, track.primary_artist_name, track.genre, track.creator?.artist_name, track.creator?.location].some((value) => value?.toLowerCase().includes(term)));
  }, [query, tracks]);

  const categories = useMemo(() => {
    const rows: Array<{ title: string; tracks: DiscoveryTrack[] }> = [];
    if (visibleTracks.length) rows.push({ title: "Featured on VYBE", tracks: visibleTracks.slice(0, 8) });
    const genres = new Map<string, { title: string; tracks: DiscoveryTrack[] }>();
    visibleTracks.forEach((track) => {
      const genre = genreGroup(track.genre);
      const existing = genres.get(genre.key);
      if (existing) existing.tracks.push(track);
      else genres.set(genre.key, { title: genre.title, tracks: [track] });
    });
    [...genres.values()]
      .sort((a, b) => a.title.localeCompare(b.title))
      .forEach((genre) => rows.push(genre));
    return rows;
  }, [visibleTracks]);

  const current = tracks[selected];

  const signSelectedTrack = async (track: DiscoveryTrack) => {
    if (!track.playback_available) return "";
    setLoadingAudio(true);
    try {
      return await publicDiscoveryService.playbackUrl(track);
    } finally {
      setLoadingAudio(false);
    }
  };

  const playSignedUrl = (url: string) => {
    setAudioUrl(url);
    window.setTimeout(() => {
      const player = audioRef.current;
      if (!player) {
        setPlaybackError("The audio player is unavailable. Refresh the page and try again.");
        return;
      }
      player.load();
      void player.play().catch((reason) => {
        console.error("VYBE music discovery playback failed", reason);
        setPlaying(false);
        setPlaybackError("The selected audio could not be loaded. Try another song or refresh the page.");
      });
    }, 0);
  };

  const choose = async (track: DiscoveryTrack) => {
    const index = tracks.findIndex((item) => item.id === track.id);
    if (index < 0) return;
    setSelected(index);
    setPlaying(false);
    setPlaybackError(null);
    setAudioUrl("");

    if (!track.playback_available) {
      setPlaybackError("This creator has not enabled public playback for the selected song.");
      return;
    }

    const url = await signSelectedTrack(track);
    if (!url) {
      setPlaybackError("The selected audio could not be authorized. Try again.");
      return;
    }

    playSignedUrl(url);
  };

  const toggle = async () => {
    if (!current?.playback_available) {
      setPlaybackError("This creator has not enabled public playback for the selected song.");
      return;
    }

    if (audioUrl && audioRef.current) {
      try {
        setPlaybackError(null);
        if (audioRef.current.paused) {
          await audioRef.current.play();
          setPlaying(true);
        } else {
          audioRef.current.pause();
          setPlaying(false);
        }
      } catch (reason) {
        console.error("VYBE music discovery playback failed", reason);
        setPlaying(false);
        setPlaybackError("The selected audio could not be loaded. Try another song or refresh the page.");
      }
      return;
    }

    const url = await signSelectedTrack(current);
    if (!url) {
      setPlaybackError("The selected audio could not be authorized. Try again.");
      return;
    }

    setPlaybackError(null);
    playSignedUrl(url);
  };

  const move = (direction: number) => {
    if (!tracks.length) return;
    const next = (selected + direction + tracks.length) % tracks.length;
    void choose(tracks[next]);
  };

  const changeVolume = ([value]: number[]) => {
    const safe = Math.min(1, Math.max(0, value));
    setVolume(safe);
    if (safe > 0) setPreviousVolume(safe);
    if (audioRef.current) {
      audioRef.current.volume = safe;
      audioRef.current.muted = safe === 0;
    }
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPreviousVolume(volume);
      setVolume(0);
      if (audioRef.current) {
        audioRef.current.volume = 0;
        audioRef.current.muted = true;
      }
      return;
    }

    const restoredVolume = previousVolume > 0 ? previousVolume : 0.85;
    setVolume(restoredVolume);
    if (audioRef.current) {
      audioRef.current.volume = restoredVolume;
      audioRef.current.muted = false;
    }
  };

  return <div className="min-h-screen bg-background pb-28">
    <MarketingNav />
    <main>
      <section className="border-b border-border/60 bg-gradient-hero"><div className="mx-auto max-w-7xl px-5 py-9 sm:px-6 sm:py-14 md:py-20">
        <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-600 dark:text-cyan-300"><Headphones className="mr-2 h-3.5 w-3.5" />Music &amp; Audio Discovery</Badge>
        <div className="mt-4 grid gap-5 sm:mt-6 sm:gap-8 lg:grid-cols-[1fr_.8fr] lg:items-end"><div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-6xl">Press play. Find the creator behind the sound.</h1><p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-5 sm:text-lg sm:leading-8">Listen to published VYBE music, move through genres, and open the creator page without leaving discovery behind.</p></div>
        <div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search song, artist, genre, city…" className="h-12 rounded-full bg-background pl-12 sm:h-14" /></div></div>
      </div></section>

      {loading ? <div className="flex min-h-80 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : null}
      {error ? <p className="mx-auto my-16 max-w-3xl rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive">{error}</p> : null}
      {!loading && !error && !visibleTracks.length ? <div className="mx-auto max-w-3xl px-5 py-12 text-center sm:px-6 sm:py-20"><Music2 className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-2xl font-semibold">No published music matches yet.</h2><p className="mt-2 text-muted-foreground">Try another search or explore the available creator directory.</p><Button asChild className="mt-6"><Link to="/explore" search={{ q: "" }}>Explore creators</Link></Button></div> : null}

      {!loading && !error && visibleTracks.length ? <div className="mx-auto max-w-7xl space-y-7 px-5 py-10 sm:space-y-10 sm:px-6 sm:py-14">{categories.map((category) => <section key={category.title}><div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Music category</p><h2 className="mt-1 text-xl font-semibold sm:text-2xl md:text-3xl">{category.title}</h2></div><span className="text-xs text-muted-foreground sm:text-sm">{category.tracks.length} {category.tracks.length === 1 ? "track" : "tracks"}</span></div>
        <div className="mt-4 grid grid-cols-2 items-stretch gap-3 sm:mt-5 sm:gap-4 lg:grid-cols-4">{category.tracks.map((track) => <article key={`${category.title}-${track.id}`} className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card sm:rounded-3xl"><button type="button" onClick={() => void choose(track)} className="group relative block aspect-square w-full overflow-hidden bg-muted text-left" aria-label={`Play ${track.title}`}>{track.cover_url ? <img src={track.cover_url} alt={`${track.title} cover`} className="h-full w-full object-cover transition group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Music2 className="h-12 w-12 text-muted-foreground" /></div>}<span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" /><span className="absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg sm:bottom-4 sm:right-4 sm:h-12 sm:w-12">{current?.id === track.id && playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}</span>{!track.playback_available ? <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white sm:left-4 sm:top-4 sm:px-3 sm:text-xs">Listening restricted</span> : null}</button>
          <div className="min-w-0 p-3 sm:p-5"><h3 className="truncate text-sm font-semibold sm:text-lg">{track.title}</h3><p className="mt-0.5 truncate text-xs text-muted-foreground sm:mt-1 sm:text-sm">{track.primary_artist_name || track.creator?.artist_name}</p><div className="mt-2.5 flex min-w-0 items-center justify-between gap-2 sm:mt-4 sm:gap-3"><Badge variant="outline" className="max-w-[7rem] truncate px-2 py-0.5 text-[10px] sm:max-w-none sm:px-2.5 sm:text-xs">{track.genre || "Independent"}</Badge>{track.creator ? <Link to="/artist/$username" params={{ username: track.creator.username }} className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary sm:gap-1 sm:text-sm">Creator <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Link> : null}</div></div>
        </article>)}</div></section>)}</div> : null}
    </main>

    {current ? <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-3 shadow-[0_-10px_35px_rgba(0,0,0,.25)] backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center gap-3 sm:gap-5">
      <Avatar className="h-12 w-12 shrink-0 rounded-xl sm:h-14 sm:w-14"><AvatarImage src={current.cover_url || current.creator?.avatar_url || undefined} /><AvatarFallback className="rounded-xl"><UserRound className="h-5 w-5" /></AvatarFallback></Avatar>
      <div className="min-w-0 flex-1"><p className="truncate font-semibold">{current.title}</p><p className="truncate text-sm text-muted-foreground">{current.primary_artist_name || current.creator?.artist_name}</p>{playbackError ? <p className="truncate text-xs text-destructive" role="alert">{playbackError}</p> : null}</div>
      <div className="flex items-center gap-1 sm:gap-2"><Button size="icon" variant="ghost" onClick={() => move(-1)} aria-label="Previous track"><SkipBack className="h-5 w-5 fill-current" /></Button><Button size="icon" className="h-11 w-11 rounded-full bg-gradient-brand sm:h-12 sm:w-12" onClick={() => void toggle()} disabled={!current.playback_available || loadingAudio} aria-label={playing ? "Pause" : "Play"}>{loadingAudio ? <Loader2 className="h-5 w-5 animate-spin" /> : playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}</Button><Button size="icon" variant="ghost" onClick={() => move(1)} aria-label="Next track"><SkipForward className="h-5 w-5 fill-current" /></Button><Button size="icon" variant="ghost" onClick={toggleMute} aria-label={volume === 0 ? "Unmute" : "Mute"}>{volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</Button></div>
      <div className="hidden w-28 items-center gap-2 lg:flex"><Slider min={0} max={1} step={0.05} value={[volume]} onValueChange={changeVolume} aria-label="Discovery playback volume" /></div>
      <Button asChild variant="outline" className="hidden sm:flex">{current.creator ? <Link to="/artist/$username" params={{ username: current.creator.username }}><ListMusic className="mr-2 h-4 w-4" />Open creator</Link> : <Link to="/explore" search={{ q: "" }}>Explore</Link>}</Button>
      <audio key={`${current.id}-${audioUrl || "idle"}`} ref={audioRef} src={audioUrl || undefined} onLoadedMetadata={(event) => { event.currentTarget.volume = volume; event.currentTarget.muted = volume === 0; }} onPlay={() => { setPlaying(true); setPlaybackError(null); }} onPause={() => setPlaying(false)} onEnded={() => move(1)} onError={() => { setPlaying(false); setPlaybackError("The selected audio source could not be loaded."); }} preload="metadata" />
    </div></div> : null}
    <Footer />
  </div>;
}
