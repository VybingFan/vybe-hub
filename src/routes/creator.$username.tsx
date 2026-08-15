import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Film,
  LayoutDashboard,
  Loader2,
  MapPin,
  Share2,
  ShoppingBag,
} from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { PublicCreatorMusicExperience } from "@/components/music/PublicCreatorMusicExperience";
import { PublicCreatorShop } from "@/components/commerce/PublicCreatorShop";
import { SocialLinksDisplay } from "@/components/socialLinks/SocialLinksDisplay";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePublicCreator } from "@/hooks/usePublicCreator";
import { useUser } from "@/hooks/useUser";
import { MERCH_AVAILABILITY } from "@/features/merch/schema";
import { VIDEO_TYPES } from "@/features/video/schema";
import { CreatorActions } from "@/components/engagement/CreatorActions";
import { CreatorComments } from "@/components/engagement/CreatorComments";
import { FollowCreatorButton } from "@/components/engagement/FollowCreatorButton";
import { CreatorPlanBadge } from "@/components/membership/CreatorPlanBadge";
import { PublicCreatorStories } from "@/components/stories/PublicCreatorStories";

export const Route = createFileRoute("/creator/$username")({
  component: CreatorPage,
});

function CreatorPage() {
  const { username } = Route.useParams();
  return <PublicArtistHome username={username} />;
}

export function PublicArtistHome({
  username,
  selectedTrackId,
}: {
  username: string;
  selectedTrackId?: string;
}) {
  const navigate = useNavigate();
  const { user, defaultRoute } = useUser();
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
        <h1 className="text-3xl font-semibold">
          We could not find that artist.
        </h1>
        <Button asChild>
          <Link to="/">Discover VYBE</Link>
        </Button>
      </div>
    );

  const { profile, tracks, playlists, merch, videos, planCode } = data;
  const compactProfile = planCode === "creator_free";
  const isOwner = user?.id === profile.user_id;
  const name = profile.artist_name || profile.display_name;
  const share = () =>
    navigator.share
      ? navigator.share({ title: `${name} on VYBE`, url: window.location.href })
      : navigator.clipboard.writeText(window.location.href);

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <div className="border-b border-border/50 bg-background/85">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-3 px-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-3 rounded-full"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                navigate({ to: "/explore", search: { q: "" } });
              }
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {isOwner && (
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/public-music">Manage public music</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-gradient-brand text-white"
              >
                <a href={defaultRoute}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Open Creator Studio
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
      <main>
        <section className="relative">
          <div className={compactProfile ? "h-20 overflow-hidden sm:h-24" : "h-36 overflow-hidden sm:h-44 md:h-56"}>
            <img
              src={profile.cover_url || "/banners/default-creator-banner.png"}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </div>
          <div className="relative mx-auto max-w-7xl px-5 py-5 sm:px-6 md:py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <img
                  src={profile.avatar_url || "/avatars/default-avatar.png"}
                  alt={name}
                  className="h-20 w-20 rounded-2xl border border-border object-cover shadow-elevated sm:h-24 sm:w-24"
                />
                <div>
                  <p className="text-sm text-primary">@{profile.username}</p>
                  <h1 className="mt-1 break-words text-3xl font-bold sm:text-4xl">
                    {name}
                  </h1>
                  <CreatorPlanBadge userId={profile.user_id} />
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
                <FollowCreatorButton creatorUserId={profile.user_id} />
                <Button variant="outline" onClick={share}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </section>
        <nav
          aria-label={`${name} website sections`}
          className="sticky top-16 z-30 border-y border-primary/15 bg-background/92 shadow-[0_12px_30px_rgba(0,0,0,.08)] backdrop-blur-xl"
        >
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-primary">
              {compactProfile ? `${name}'s VYBE creator profile` : `Explore everything ${name} is sharing`}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <CreatorSectionLink href="#music">Music</CreatorSectionLink>
              <CreatorSectionLink href="#about">About</CreatorSectionLink>
              {!!videos.length && (
                <CreatorSectionLink href="#videos">Videos</CreatorSectionLink>
              )}
              {!!merch.length && (
                <CreatorSectionLink href="#shop">Shop</CreatorSectionLink>
              )}
              <CreatorSectionLink href="#community">Community</CreatorSectionLink>
            </div>
          </div>
        </nav>
        <section
          id="music"
          className="mx-auto max-w-7xl scroll-mt-28 px-4 py-10 sm:px-6 md:py-14"
        >
          <PublicCreatorMusicExperience
            tracks={tracks}
            playlists={playlists}
            username={profile.username}
            creatorUserId={profile.user_id}
            creatorName={name}
            initialTrackId={selectedTrackId}
            featuredCollectionLabel={compactProfile ? "Featured Music" : undefined}
          />
        </section>

        <PublicCreatorShop creatorId={profile.user_id} creatorName={name} />
        <section
          id="about"
          className="mx-auto grid max-w-7xl scroll-mt-28 gap-5 px-4 pb-16 sm:px-6 lg:grid-cols-[1.4fr_.6fr]"
        >
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">
              The creator
            </p>
            <h2 className="mt-2 text-3xl font-semibold">About {name}</h2>
            <p className="mt-5 whitespace-pre-line leading-7 text-muted-foreground">
              {profile.bio || "This artist is getting their VYBE ready."}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Connect</h2>
            <div className="mt-4">
              <SocialLinksDisplay profile={profile} />
            </div>
            {profile.merch_url ? (
              <Button asChild className="mt-6" variant="outline">
                <a
                  href={profile.merch_url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Visit artist store <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>
        </section>
        {!!videos.length && (
          <section
            id="videos"
            className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-16 sm:px-6"
          >
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-rose-400">
              Watch
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Videos from {name}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <Link
                  key={video.id}
                  to="/video/$videoId"
                  params={{ videoId: video.id }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-rose-400/50"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-rose-500/20 to-violet-500/20">
                        <Film className="h-12 w-12 text-rose-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-medium text-rose-400">
                      {VIDEO_TYPES.find(
                        (type) => type.value === video.video_type,
                      )?.label || "Video"}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-lg font-semibold">
                      {video.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {video.description || `Watch ${video.title} on VYBE.`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        {!!merch.length && (
          <section
            id="shop"
            className="mx-auto max-w-7xl scroll-mt-28 px-6 pb-16"
          >
            <p className="text-sm font-semibold uppercase tracking-[.2em] text-genre-country">
              Artist collection
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              Merch, art, and experiences
            </h2>
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
                    <p className="text-xs text-genre-country">
                      {product.category}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {product.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {product.description}
                    </p>
                    <Badge variant="outline" className="mt-3">
                      {MERCH_AVAILABILITY.find(
                        (status) => status.value === product.availability,
                      )?.label || "Coming soon"}
                    </Badge>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-medium">
                        {product.price_cents == null
                          ? "Ask artist"
                          : `$${(product.price_cents / 100).toFixed(2)}`}
                      </span>
                      {product.purchase_url &&
                        product.availability === "available_externally" && (
                          <Button asChild size="sm">
                            <a
                              href={product.purchase_url}
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              {purchaseActionLabel(product.purchase_url)}
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
        <div id="community" className="scroll-mt-28">
          <PublicCreatorStories creatorUserId={profile.user_id} />
          <CreatorActions entityId={profile.user_id} />
          <CreatorComments entityId={profile.user_id} />
        </div>
      </main>
    </div>
  );
}

function purchaseActionLabel(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("stripe.com")) return "Buy with Stripe";
    if (host.includes("square")) return "Buy with Square";
    if (host.includes("paypal.com") || host.includes("paypal.me")) return "Buy with PayPal";
    if (host.includes("etsy.com")) return "View on Etsy";
    if (host.includes("shopify.com") || host.includes("myshopify.com")) return "Visit store";
  } catch { /* URL input validation handles malformed values. */ }
  return "View product";
}
function CreatorSectionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="shrink-0 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {children}
    </a>
  );
}
