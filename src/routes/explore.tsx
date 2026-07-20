import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, MapPin, Music2, Search, UserRound } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const genreChoices = ["Hip-Hop", "R&B", "Rock", "Country", "Pop", "Electronic", "Gospel", "Jazz"];

function PublicExplorePage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [input, setInput] = useState(q);
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
      <main className="mx-auto min-h-[70vh] max-w-7xl px-6 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="rounded-full bg-primary/10 text-primary">Open VYBE discovery</Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
            Find your sound, city, or creator.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Browse published VYBE music without creating an account. Join when you want to follow,
            save, or participate.
          </p>
          <form onSubmit={submit} className="relative mx-auto mt-8 max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Search artist, song, city, or genre"
              className="h-14 rounded-full pl-12 pr-28 text-base"
            />
            <Button className="absolute right-1.5 top-1.5 h-11 rounded-full px-6">Search</Button>
          </form>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
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
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        )}
        {error && <p className="py-16 text-center text-destructive">{error}</p>}
        {!loading && !error && (
          <div className="mt-16 space-y-14">
            <section>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Creators</p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    {q ? `Creator accounts connected to “${q}”` : "Explore VYBE creator accounts"}
                  </h2>
                </div>
                <span className="text-sm text-muted-foreground">{creators.length} found</span>
              </div>
              {creators.length ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {creators.map((creator) => (
                    <Link
                      key={creator.user_id}
                      to="/artist/$username"
                      params={{ username: creator.username }}
                      className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={creator.avatar_url ?? undefined} />
                          <AvatarFallback>
                            <UserRound className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
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
                        <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-6 rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                  No creator accounts are connected to this search yet.
                </p>
              )}
            </section>

            <section>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Artist credits</p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    {q ? `Artists matching “${q}”` : "Credited performing artists"}
                  </h2>
                </div>
                <span className="text-sm text-muted-foreground">{artists.length} found</span>
              </div>
              {artists.length ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {artists.map((artist) => (
                    <button
                      key={artist.name.toLowerCase()}
                      type="button"
                      onClick={() => navigate({ to: "/explore", search: { q: artist.name } })}
                      className="rounded-2xl border bg-card p-5 text-left transition hover:border-primary/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Music2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{artist.name}</h3>
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
                <p className="mt-6 rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                  No performing-artist credits match this search yet.
                </p>
              )}
            </section>

            <section>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Published music</p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    {q ? `Songs matching “${q}”` : "Music to explore"}
                  </h2>
                </div>
                <span className="text-sm text-muted-foreground">{tracks.length} found</span>
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
                      className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:border-primary/40"
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
                      <div className="min-w-0">
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
                      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-6 rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                  No published songs match this search yet.
                </p>
              )}
            </section>

            <section className="rounded-[2rem] border bg-card p-8 text-center">
              <h2 className="text-2xl font-semibold">Want to save what you find?</h2>
              <p className="mt-2 text-muted-foreground">
                Create a free Supporter account or start your own Creator Free page.
              </p>
              <Button asChild className="mt-5 rounded-full">
                <Link to="/auth/sign-up">
                  Create a free account <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
