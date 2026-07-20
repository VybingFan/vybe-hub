import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Heart, Loader2, MapPin, Share2, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { SharedPlaylistPlayer } from "@/components/playlists/SharedPlaylistPlayer";
import { SocialLinksDisplay } from "@/components/socialLinks/SocialLinksDisplay";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePublicCreator } from "@/hooks/usePublicCreator";

export const Route = createFileRoute("/creator/$username")({ component: CreatorPage });

function CreatorPage() {
  const { username } = Route.useParams();
  return <PublicArtistHome username={username} />;
}

export function PublicArtistHome({ username }: { username: string }) {
  const { data, isLoading, error } = usePublicCreator(username);
  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (error || !data)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
        <Logo />
        <h1 className="text-3xl font-semibold">We could not find that artist.</h1>
        <Button asChild>
          <Link to="/">Discover VYBE</Link>
        </Button>
      </div>
    );

  const { profile, tracks, merch } = data;
  const name = profile.artist_name || profile.display_name;
  const share = () =>
    navigator.share
      ? navigator.share({ title: `${name} on VYBE`, url: window.location.href })
      : navigator.clipboard.writeText(window.location.href);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/">
            <Logo />
          </Link>
          <Button asChild size="sm" className="bg-gradient-brand text-white">
            <Link to="/auth/sign-up">Join VYBE</Link>
          </Button>
        </div>
      </header>
      <main>
        <section className="relative">
          <div className="h-64 overflow-hidden md:h-80">
            <img
              src={profile.cover_url || "/banners/default-creator-banner.png"}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </div>
          <div className="relative mx-auto -mt-24 max-w-7xl px-6 pb-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <img
                  src={profile.avatar_url || "/avatars/default-avatar.png"}
                  alt={name}
                  className="h-32 w-32 rounded-3xl border-4 border-background object-cover shadow-elevated"
                />
                <div>
                  <p className="text-sm text-primary">@{profile.username}</p>
                  <h1 className="mt-1 text-4xl font-bold md:text-6xl">{name}</h1>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(profile.genres?.length
                      ? profile.genres
                      : profile.genre
                        ? [profile.genre]
                        : []
                    ).map((genre) => (
                      <Badge key={genre} variant="outline">
                        {genre}
                      </Badge>
                    ))}
                    {profile.location && (
                      <Badge variant="outline">
                        <MapPin className="mr-1 h-3 w-3" />
                        {profile.location}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild className="bg-gradient-brand text-white">
                  <Link to="/auth/sign-up">
                    <Heart className="mr-2 h-4 w-4" />
                    Follow
                  </Link>
                </Button>
                <Button variant="outline" onClick={share}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.3fr_.7fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Music</p>
            <h2 className="mt-2 text-3xl font-semibold">Listen without leaving the page</h2>
            <div className="mt-6">
              <SharedPlaylistPlayer tracks={tracks} />
            </div>
          </div>
          <aside className="space-y-5">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold">About {name}</h2>
              <p className="mt-4 whitespace-pre-line leading-7 text-muted-foreground">
                {profile.bio || "This artist is getting their VYBE ready."}
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold">Connect</h2>
              <div className="mt-4">
                <SocialLinksDisplay profile={profile} />
              </div>
            </div>
            {profile.merch_url && (
              <div className="rounded-3xl border border-genre-country/30 bg-card p-6">
                <ShoppingBag className="h-6 w-6 text-genre-country" />
                <h2 className="mt-4 text-xl font-semibold">Artist merch</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Shop music, art, collectibles, apparel, experiences, and other items chosen by{" "}
                  {name}.
                </p>
                <Button asChild className="mt-5" variant="outline">
                  <a href={profile.merch_url} target="_blank" rel="noreferrer noopener">
                    Visit merch store <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            )}
          </aside>
        </section>
        {!!merch.length && (
          <section className="mx-auto max-w-7xl px-6 pb-16">
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-genre-country">
              Artist collection
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Merch, art, and experiences</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {merch.map((product) => (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-muted">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xs text-genre-country">{product.category}</p>
                    <h3 className="mt-1 text-lg font-semibold">{product.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {product.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-medium">
                        {product.price_cents == null
                          ? "Ask artist"
                          : `$${(product.price_cents / 100).toFixed(2)}`}
                      </span>
                      {product.purchase_url && (
                        <Button asChild size="sm">
                          <a href={product.purchase_url} target="_blank" rel="noreferrer noopener">
                            View
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
