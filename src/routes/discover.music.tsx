import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Headphones, ListMusic, Loader2, Music2, Pause, Play, Search, SkipBack, SkipForward, UserRound } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { publicDiscoveryService, type DiscoveryTrack } from "@/services/discovery/publicDiscoveryService";

export const Route = createFileRoute("/discover/music")({ component: MusicDiscoveryPage });

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
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
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
  const choose = async (track: DiscoveryTrack) => {
    const index = tracks.findIndex((item) => item.id === track.id);
    if (index < 0) return;
    setSelected(index); setPlaying(false); setPlaybackError(null);
    if (!track.audio_url) {
      setPlaybackError("This creator has not enabled public playback for the selected song.");
      return;
    }
    window.setTimeout(() => {
      void audioRef.current?.play().catch((reason) => {
        console.error("VYBE music discovery playback failed", reason);
        setPlaying(false);
        setPlaybackError("The selected audio could not be loaded. Try another song or refresh the page.");
      });
    }, 0);
  };
  const toggle = async () => {
    if (!current?.audio_url) { setPlaybackError("This creator has not enabled public playback for the selected song."); return; }
    if (!audioRef.current) { setPlaybackError("The audio player is unavailable. Refresh the page and try again."); return; }
    try {
      setPlaybackError(null);
      if (audioRef.current.paused) { await audioRef.current.play(); setPlaying(true); } else { audioRef.current.pause(); setPlaying(false); }
    } catch (reason) {
      console.error("VYBE music discovery playback failed", reason);
      setPlaying(false);
      setPlaybackError("The selected audio could not be loaded. Try another song or refresh the page.");
    }
  };
  const move = (direction: number) => {
    if (!tracks.length) return;
    const next = (selected + direction + tracks.length) % tracks.length;
    void choose(tracks[next]);
  };

  return <div className="min-h-screen bg-background pb-28">
    <MarketingNav />
    <main>
      <section className="border-b border-border/60 bg-gradient-hero"><div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-600 dark:text-cyan-300"><Headphones className="mr-2 h-3.5 w-3.5" />Music &amp; Audio Discovery</Badge>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_.8fr] lg:items-end"><div><h1 className="text-4xl font-bold tracking-tight md:text-6xl">Press play. Find the creator behind the sound.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Listen to published VYBE music, move through genres, and open the creator page without leaving discovery behind.</p></div>
        <div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search song, artist, genre, city…" className="h-14 rounded-full bg-background pl-12" /></div></div>
      </div></section>

      {loading ? <div className="flex min-h-80 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : null}
      {error ? <p className="mx-auto my-16 max-w-3xl rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive">{error}</p> : null}
      {!loading && !error && !visibleTracks.length ? <div className="mx-auto max-w-3xl px-6 py-20 text-center"><Music2 className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-2xl font-semibold">No published music matches yet.</h2><p className="mt-2 text-muted-foreground">Try another search or explore the available creator directory.</p><Button asChild className="mt-6"><Link to="/explore" search={{ q: "" }}>Explore creators</Link></Button></div> : null}

      {!loading && !error && visibleTracks.length ? <div className="mx-auto max-w-7xl space-y-10 px-6 py-14">{categories.map((category) => <section key={category.title}><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Music category</p><h2 className="mt-1 text-2xl font-semibold md:text-3xl">{category.title}</h2></div><span className="text-sm text-muted-foreground">{category.tracks.length} {category.tracks.length === 1 ? "track" : "tracks"}</span></div>
        <div className="mt-5 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">{category.tracks.map((track) => <article key={`${category.title}-${track.id}`} className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card"><button type="button" onClick={() => void choose(track)} className="group relative block aspect-square w-full overflow-hidden bg-muted text-left" aria-label={`Play ${track.title}`}>{track.cover_url ? <img src={track.cover_url} alt={`${track.title} cover`} className="h-full w-full object-cover transition group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Music2 className="h-12 w-12 text-muted-foreground" /></div>}<span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" /><span className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg">{current?.id === track.id && playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}</span>{!track.audio_url ? <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs text-white">Listening restricted</span> : null}</button>
          <div className="p-5"><h3 className="truncate text-lg font-semibold">{track.title}</h3><p className="mt-1 truncate text-sm text-muted-foreground">{track.primary_artist_name || track.creator?.artist_name}</p><div className="mt-4 flex items-center justify-between gap-3"><Badge variant="outline">{track.genre || "Independent"}</Badge>{track.creator ? <Link to="/artist/$username" params={{ username: track.creator.username }} className="flex items-center gap-1 text-sm font-medium text-primary">Creator <ArrowRight className="h-4 w-4" /></Link> : null}</div></div>
        </article>)}</div></section>)}</div> : null}
    </main>

    {current ? <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-3 shadow-[0_-10px_35px_rgba(0,0,0,.25)] backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center gap-3 sm:gap-5">
      <Avatar className="h-14 w-14 rounded-xl"><AvatarImage src={current.cover_url || current.creator?.avatar_url || undefined} /><AvatarFallback className="rounded-xl"><UserRound className="h-5 w-5" /></AvatarFallback></Avatar>
      <div className="min-w-0 flex-1"><p className="truncate font-semibold">{current.title}</p><p className="truncate text-sm text-muted-foreground">{current.primary_artist_name || current.creator?.artist_name}</p>{playbackError ? <p className="truncate text-xs text-destructive" role="alert">{playbackError}</p> : null}</div>
      <div className="flex items-center gap-1 sm:gap-2"><Button size="icon" variant="ghost" onClick={() => move(-1)} aria-label="Previous track"><SkipBack className="h-5 w-5 fill-current" /></Button><Button size="icon" className="h-12 w-12 rounded-full bg-gradient-brand" onClick={() => void toggle()} disabled={!current.audio_url} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}</Button><Button size="icon" variant="ghost" onClick={() => move(1)} aria-label="Next track"><SkipForward className="h-5 w-5 fill-current" /></Button></div>
      <Button asChild variant="outline" className="hidden sm:flex">{current.creator ? <Link to="/artist/$username" params={{ username: current.creator.username }}><ListMusic className="mr-2 h-4 w-4" />Open creator</Link> : <Link to="/explore" search={{ q: "" }}>Explore</Link>}</Button>
      <audio key={`${current.id}-${current.audio_url || "restricted"}`} ref={audioRef} src={current.audio_url || undefined} onPlay={() => { setPlaying(true); setPlaybackError(null); }} onPause={() => setPlaying(false)} onEnded={() => move(1)} onError={() => { setPlaying(false); setPlaybackError("The selected audio source could not be loaded."); }} preload="metadata" />
    </div></div> : null}
    <Footer />
  </div>;
}
