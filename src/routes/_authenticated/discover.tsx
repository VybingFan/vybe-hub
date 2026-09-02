import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, MapPin, Music2, Search, SlidersHorizontal, UserRound, UsersRound, X } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import {
  publicDiscoveryService,
  type DiscoveryArtistCredit,
  type DiscoveryCreator,
  type DiscoveryTrack,
} from "@/services/discovery/publicDiscoveryService";

export const Route = createFileRoute("/_authenticated/discover")({ component: DiscoverPage });

const creatorFocusChoices = ["Music", "Film & Video", "Writers & Poets", "Actors", "Comedians"];
const genres = ["Hip-Hop", "R&B", "Rock", "Country", "Pop", "Electronic", "Gospel", "Jazz"];

function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [input, setInput] = useState("");
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const [creators, setCreators] = useState<DiscoveryCreator[]>([]);
  const [artists, setArtists] = useState<DiscoveryArtistCredit[]>([]);
  const [tracks, setTracks] = useState<DiscoveryTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true); setError(null);
    publicDiscoveryService.search(query)
      .then((result) => { setCreators(result.creators); setArtists(result.artists); setTracks(result.tracks); })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Discovery could not load."))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    if (!searched || loading) return;
    window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [searched, loading, query]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSearched(true);
    setQuery(input.trim());
  };
  const choose = (value: string) => {
    setSearched(true);
    setInput(value);
    setQuery(value);
  };
  const clearSearch = () => {
    setInput("");
    setQuery("");
    setSearched(false);
    setSelectedFocus(null);
  };

  return <RoleGuard allow={["supporter", "creator", "business", "admin"]}>
    <div className="mx-auto max-w-6xl space-y-7">
      <WorkspacePageHeader eyebrow="Supporter discovery" title="Find your next VYBE." description="Discover real VYBE creators and published music. Open a creator page to listen, follow, heart, save, and participate." status={<Button asChild variant="outline" className="rounded-full"><Link to="/supporter-interests"><SlidersHorizontal className="mr-2 h-4 w-4" />Tune interests</Link></Button>} />

      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card"><CardContent className="p-5 sm:p-7">
        <form onSubmit={submit} className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Search creators, interests, city, genre, or content" className="h-14 rounded-full bg-background pl-12 pr-36 text-base" />
          {input ? <button type="button" onClick={clearSearch} aria-label="Clear search" className="absolute right-[7.5rem] top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button> : null}
          <Button className="absolute right-1.5 top-1.5 h-11 rounded-full px-6" disabled={loading}>{loading && searched ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Searching</> : "Search"}</Button>
        </form>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Explore creator focuses</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {creatorFocusChoices.map((focus) => {
              const active = selectedFocus === focus;
              return <Button key={focus} size="sm" variant={active ? "default" : "outline"} className="rounded-full" onClick={() => setSelectedFocus(active ? null : focus)}>{focus}</Button>;
            })}
          </div>
          {selectedFocus === "Music" ? <div className="mt-4 border-t border-border/50 pt-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Explore music genres</p><div className="mt-3 flex flex-wrap gap-2">{genres.map((genre) => <Button key={genre} size="sm" variant={query === genre ? "default" : "outline"} className="rounded-full" onClick={() => choose(genre)}>{genre}</Button>)}</div></div> : null}
        </div>
        {searched ? <p className="mt-4 text-sm text-muted-foreground">{loading ? `Searching for â€œ${query || input.trim()}â€â€¦` : query ? `Showing results for â€œ${query}â€` : "Showing all discovery results"}</p> : null}
      </CardContent></Card>

      <div ref={resultsRef} className="scroll-mt-6">
      {loading ? <div className="flex min-h-56 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : null}
      {error ? <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">{error}</p> : null}
      {!loading && !error ? <div className="space-y-10">
        <section><div className="flex items-end justify-between"><div><p className="text-sm font-medium text-primary">Creators</p><h2 className="mt-1 text-2xl font-semibold">{query ? `Creators connected to “${query}”` : "Explore VYBE creator accounts"}</h2></div><span className="text-sm text-muted-foreground">{creators.length} found</span></div>
          {creators.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{creators.map((creator) => <Link key={creator.user_id} to="/artist/$username" params={{ username: creator.username }} search={{ track: "", autoplay: true }} className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40"><div className="flex items-center gap-4"><Avatar className="h-14 w-14"><AvatarImage src={creator.avatar_url ?? undefined} /><AvatarFallback><UserRound className="h-5 w-5" /></AvatarFallback></Avatar><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{creator.artist_name || creator.display_name}</h3><p className="truncate text-sm text-muted-foreground">{creator.genres?.join(", ") || creator.genre || "Independent creator"}</p>{creator.location ? <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{creator.location}</p> : null}</div><ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" /></div></Link>)}</div> : <Empty text="No creator accounts match this search yet." />}
        </section>

        {artists.length ? <section><div className="flex items-end justify-between"><div><p className="text-sm font-medium text-primary">Artist credits</p><h2 className="mt-1 text-2xl font-semibold">Credited performing artists</h2></div><span className="text-sm text-muted-foreground">{artists.length} found</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{artists.map((artist) => <button key={artist.name.toLowerCase()} type="button" onClick={() => choose(artist.name)} className="rounded-2xl border bg-card p-5 text-left transition hover:border-primary/40"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary"><Music2 className="h-5 w-5" /></span><span><span className="block font-semibold">{artist.name}</span><span className="text-xs text-muted-foreground">{artist.songCount} {artist.songCount === 1 ? "song" : "songs"} · {artist.uploaderCount} {artist.uploaderCount === 1 ? "creator account" : "creator accounts"}</span></span></div></button>)}</div></section> : null}

        <section><div className="flex items-end justify-between"><div><p className="text-sm font-medium text-primary">Published music</p><h2 className="mt-1 text-2xl font-semibold">Music to explore</h2></div><span className="text-sm text-muted-foreground">{tracks.length} found</span></div>
          {tracks.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{tracks.map((track) => <Link key={track.id} to="/artist/$username" params={{ username: track.creator!.username }} search={{ track: track.id, autoplay: true }} hash="music" className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:border-primary/40"><span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">{track.cover_url ? <img src={track.cover_url} alt="" className="h-full w-full object-cover" /> : <Music2 className="h-5 w-5 text-muted-foreground" />}</span><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{track.title}</span><span className="block truncate text-sm text-muted-foreground">{track.primary_artist_name || track.creator?.artist_name}</span><span className="block truncate text-xs text-muted-foreground">{track.genre || `Uploaded by ${track.creator?.artist_name || track.creator?.display_name}`}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" /></Link>)}</div> : <Empty text="No published songs match this search yet." />}
        </section>

      </div> : null}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><ActionCard title="Tune interests" text="Choose the genres and experiences that should shape your discovery." to="/supporter-interests" image="/images/supporter-cards/discover.webp" icon={<SlidersHorizontal className="h-5 w-5" />} /><ActionCard title="Read creator stories" text="Go behind creators through stories, interviews, and creative journeys." to="/read" image="/images/supporter-cards/creator-stories.webp" icon={<ArrowRight className="h-5 w-5" />} /><ActionCard title="Find your people" text="Join conversations about creators, releases, scenes, and shared interests." to="/communities" image="/images/supporter-cards/community.webp" icon={<UsersRound className="h-5 w-5" />} /><ActionCard title="Return to My VYBE" text="Open your hearted songs, lists, followed creators, and saved experiences." to="/my-vybe" image="/images/supporter-cards/my-vybe.webp" icon={<Music2 className="h-5 w-5" />} /></section>

      <Link to="/demo/creator" className="group grid overflow-hidden rounded-3xl border border-fuchsia-400/25 bg-gradient-to-r from-fuchsia-500/10 via-card to-cyan-400/10 transition hover:border-fuchsia-400/50 md:grid-cols-[220px_1fr]">
        <img src="/images/demo/nova-vale/epk/theater-portrait.webp" alt="Nova Vale guided demo creator" className="h-48 w-full object-cover md:h-full" />
        <span className="flex flex-col justify-center p-6 md:p-8">
          <span className="text-xs font-semibold uppercase tracking-[.18em] text-fuchsia-300">Guided creator demonstration</span>
          <span className="mt-2 text-2xl font-semibold">Meet Nova Vale and practice the supporter experience</span>
          <span className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Switch between public visitor, free member, and follower views. Practice listening, hearting, commenting, following, and saving without changing your real account.</span>
          <span className="mt-5 inline-flex items-center text-sm font-medium text-primary">Open Nova's guided page <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" /></span>
        </span>
      </Link>
    </div>
  </RoleGuard>;
}

function Empty({ text }: { text: string }) { return <p className="mt-5 rounded-2xl border border-dashed p-7 text-center text-sm text-muted-foreground">{text}</p>; }
function ActionCard({ title, text, to, image, icon }: { title: string; text: string; to: "/supporter-interests" | "/read" | "/communities" | "/my-vybe"; image: string; icon: ReactNode }) { return <Link to={to} className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elevated"><span className="relative block aspect-video overflow-hidden bg-muted"><img src={image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /><span className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" /><span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-background/75 text-primary shadow-lg backdrop-blur">{icon}</span></span><span className="flex flex-1 flex-col p-5"><h3 className="font-semibold">{title}</h3><p className="mt-2 flex-1 text-sm text-muted-foreground">{text}</p><span className="mt-4 inline-flex items-center text-sm font-medium text-primary">Open <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" /></span></span></Link>; }
