import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, MapPin, Music2, Search, UserRound } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/useUser";
import {
  publicDiscoveryService,
  type DiscoveryArtistCredit,
  type DiscoveryCreator,
  type DiscoveryTrack,
} from "@/services/discovery/publicDiscoveryService";

export const Route = createFileRoute("/explore")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q.slice(0, 80) : "",
  }),
  component: PublicExplorePage,
});

const creatorFocusChoices = ["Music", "Film & Video", "Writers & Poets", "Actors", "Comedians"];
const genreChoices = ["Hip-Hop", "R&B", "Rock", "Country", "Pop", "Electronic", "Gospel", "Jazz"];

function PublicExplorePage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useUser();
  const [input, setInput] = useState(q);
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const [creators, setCreators] = useState<DiscoveryCreator[]>([]);
  const [artists, setArtists] = useState<DiscoveryArtistCredit[]>([]);
  const [tracks, setTracks] = useState<DiscoveryTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInput(q);
    setLoading(true);
    setError(null);
    publicDiscoveryService
      .search(q)
      .then((result) => {
        setCreators(result.creators);
        setArtists(result.artists);
        setTracks(result.tracks);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Search failed"))
      .finally(() => setLoading(false));
  }, [q]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    navigate({ to: "/explore", search: { q: input.trim() } });
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[1.5rem] border border-border/70 px-4 py-8 text-center shadow-elevated sm:rounded-[2rem] sm:px-6 sm:py-12 md:px-12 md:py-16">
          <img src="/images/supporter-cards/discover.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/88 to-background/70" />
          <div className="relative mx-auto max-w-3xl">
          <Badge className="rounded-full bg-primary/10 text-primary">Open VYBE discovery</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:mt-5 sm:text-4xl md:text-6xl">
            Find creators worth coming back for.
          </h1>
          <p className="mt-4 text-muted-foreground">
            {user
              ? "You are signed in. Discover creators across entertainment and creative work, then follow, heart, save, or participate across VYBE."
              : "Browse VYBE creators freely. Create a free Supporter account when you want to follow, save, or participate."}
          </p>
          <form onSubmit={submit} className="relative mx-auto mt-6 flex max-w-2xl flex-col gap-3 sm:mt-8 sm:block">
            <Search className="pointer-events-none absolute left-4 top-7 h-5 w-5 -translate-y-1/2 text-muted-foreground sm:top-1/2" />
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Search creator, interest, city, genre, or name"
              className="h-14 rounded-full pl-12 pr-4 text-base sm:pr-28"
            />
            <Button className="h-11 w-full rounded-full px-6 sm:absolute sm:right-1.5 sm:top-1.5 sm:w-auto">Search</Button>
          </form>
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Explore creator focuses</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {creatorFocusChoices.map((focus) => {
                const active = selectedFocus === focus;
                return (
                  <Button
                    key={focus}
                    size="sm"
                    variant={active ? "default" : "secondary"}
                    className="rounded-full"
                    aria-pressed={active}
                    onClick={() => setSelectedFocus(active ? null : focus)}
                  >
                    {focus}
                  </Button>
                );
              })}
            </div>
          </div>

          {selectedFocus ? (
            <div className="mt-5 border-t border-border/50 pt-5">
              {selectedFocus === "Music" ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Explore music genres</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {genreChoices.map((genre) => (
                      <Button
                        key={genre}
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => navigate({ to: "/explore", search: { q: genre } })}
                      >
                        {genre}
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="mx-auto max-w-2xl rounded-2xl border border-border/60 bg-background/40 px-4 py-4">
                  <p className="text-sm font-medium">{selectedFocus} discovery</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Focus-specific filters will appear here as this creator area is connected to VYBE discovery.
                  </p>
                </div>
              )}
            </div>
          ) : null}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        )}
        {error && <p className="py-16 text-center text-destructive">{error}</p>}
        {!loading && !error && (
          <div className="mt-10 space-y-10 sm:mt-16 sm:space-y-14">
            <section>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Creators</p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    {q ? `Creators connected to “${q}”` : "Explore creators across VYBE"}
                  </h2>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">{creators.length} found</span>
              </div>
              {creators.length ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {creators.map((creator) => (
                    <Link
                      key={creator.user_id}
                      to="/artist/$username"
                      params={{ username: creator.username }}
                      className="group min-w-0 rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 sm:p-5"
                    >
                      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <Avatar className="h-14 w-14 shrink-0">
                          <AvatarImage src={creator.avatar_url ?? undefined} />
                          <AvatarFallback>
                            <UserRound className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold">
                            {creator.artist_name || creator.display_name}
                          </h3>
                          <p className="truncate text-sm text-muted-foreground">
                            {creator.genres?.join(", ") || creator.genre || "Independent creator"}
                          </p>
                          {creator.location && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {creator.location}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-6 rounded-2xl border border-dashed p-5 text-center text-muted-foreground sm:p-8">
                  No creator accounts are connected to this search yet.
                </p>
              )}
            </section>

            <section>
              <div className="mb-6 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5">
                <p className="text-sm font-medium text-primary">Music discovery</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Music remains one part of VYBE discovery. Artist credits and published songs appear here while additional creator-focus discovery grows across the platform.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Artist credits</p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    {q ? `Artists matching “${q}”` : "Credited performing artists"}
                  </h2>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">{artists.length} found</span>
              </div>
              {artists.length ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {artists.map((artist) => (
                    <button
                      key={artist.name.toLowerCase()}
                      type="button"
                      onClick={() => navigate({ to: "/explore", search: { q: artist.name } })}
                      className="min-w-0 rounded-2xl border bg-card p-4 text-left transition hover:border-primary/40 sm:p-5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Music2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold">{artist.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {artist.songCount} {artist.songCount === 1 ? "song" : "songs"} ·{" "}
                            {artist.uploaderCount}{" "}
                            {artist.uploaderCount === 1 ? "creator account" : "creator accounts"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-6 rounded-2xl border border-dashed p-5 text-center text-muted-foreground sm:p-8">
                  No performing-artist credits match this search yet.
                </p>
              )}
            </section>

            <section>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Published music</p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    {q ? `Songs matching “${q}”` : "Music to explore"}
                  </h2>
                </div>
                <span className="shrink-0 text-sm text-muted-foreground">{tracks.length} found</span>
              </div>
              {tracks.length ? (
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {tracks.map((track) => (
                    <Link
                      key={track.id}
                      to="/artist/$username"
                      params={{ username: track.creator!.username }}
                      search={{ track: track.id }}
                      hash="music"
                      className="flex min-w-0 items-center gap-3 rounded-2xl border bg-card p-3 transition hover:border-primary/40 sm:gap-4 sm:p-4"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                        {track.cover_url ? (
                          <img
                            src={track.cover_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Music2 className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold">{track.title}</h3>
                        <p className="truncate text-sm text-muted-foreground">
                          {track.primary_artist_name ||
                            track.creator?.artist_name ||
                            track.creator?.display_name}
                          {track.featured_artist_names.length
                            ? ` feat. ${track.featured_artist_names.join(", ")}`
                            : ""}
                          {track.genre ? ` · ${track.genre}` : ""}
                        </p>
                        <p className="truncate text-xs text-muted-foreground/70">
                          Uploaded by {track.creator?.artist_name || track.creator?.display_name}
                        </p>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-6 rounded-2xl border border-dashed p-5 text-center text-muted-foreground sm:p-8">
                  No published songs match this search yet.
                </p>
              )}
            </section>

            <section className="rounded-[1.5rem] border bg-card p-5 text-center sm:rounded-[2rem] sm:p-8">
              {user ? (
                <>
                  <h2 className="text-2xl font-semibold">Keep what moves you close.</h2>
                  <p className="mt-2 text-muted-foreground">You are signed in. Return to hearted songs, saved lists, followed creators, and communities in My VYBE.</p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                    <Button asChild className="w-full rounded-full sm:w-auto"><Link to="/my-vybe">Open My VYBE <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                    <Button asChild variant="outline" className="w-full rounded-full sm:w-auto"><Link to="/home">Member Home</Link></Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold">Want to save what you find?</h2>
                  <p className="mt-2 text-muted-foreground">Sign in as a supporter or create a free account to follow, heart, save, and participate.</p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                    <Button asChild variant="outline" className="w-full rounded-full sm:w-auto"><Link to="/auth/sign-in">Supporter Sign In</Link></Button>
                    <Button asChild className="w-full rounded-full sm:w-auto"><Link to="/auth/sign-up">Create Free Account <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
