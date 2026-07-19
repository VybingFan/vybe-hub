import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { ArrowRight, MapPin, Play, Sparkles, Users } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/discover")({ component: DiscoverPage });

const genres = [
  ["Rock", "/images/discover/rock.webp", "var(--genre-rock)"],
  ["Country", "/images/discover/country.webp", "var(--genre-country)"],
  ["Pop", "/images/discover/pop.webp", "var(--genre-pop)"],
  ["Electronic", "/images/discover/electronic.webp", "var(--genre-electronic)"],
  ["Gospel & Soul", "/images/discover/gospel-soul.webp", "var(--genre-soul)"],
  ["Jazz & Lo-fi", "/images/discover/jazz-lofi.webp", "var(--genre-jazz)"],
] as const;

function DiscoverPage() {
  return (
    <RoleGuard allow={["supporter", "creator", "admin"]}>
      <div className="mx-auto max-w-7xl space-y-12">
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Badge className="mb-4 rounded-full bg-primary/10 text-primary">
              <Sparkles className="mr-2 h-3.5 w-3.5" /> Made for your curiosity
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Find your next VYBE.
            </h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Explore artists, genres, stories, communities, and events that feel like you.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/profile">
              Tune your interests <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </header>

        <section className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-white/10">
          <img
            src="/images/editorial/local-spotlight.webp"
            alt="Local independent music showcase"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent" />
          <div className="relative flex min-h-[360px] max-w-xl flex-col justify-end p-7 md:p-10">
            <p className="flex items-center gap-2 text-sm font-medium text-genre-country">
              <MapPin className="h-4 w-4" /> Local spotlight
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              The scene is closer than you think.
            </h2>
            <p className="mt-3 text-white/70">
              Meet artists, members, and live moments growing in your area.
            </p>
            <Button className="mt-6 w-fit rounded-full bg-white text-black hover:bg-white/90">
              <Play className="mr-2 h-4 w-4 fill-current" /> Explore nearby
            </Button>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Browse by sound</p>
              <h2 className="mt-1 text-2xl font-semibold">Pick a genre, follow the feeling</h2>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {genres.map(([name, image, color]) => (
              <button
                key={name}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 text-left content-glow"
                style={{ "--card-glow": color } as CSSProperties}
              >
                <img
                  src={image}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-4 font-semibold text-white">
                  {name}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="relative min-h-[320px] overflow-hidden rounded-3xl border border-white/10">
            <img
              src="/images/editorial/artist-stories.webp"
              alt="Artist telling the story behind a song"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/35 to-transparent" />
            <div className="relative flex min-h-[320px] max-w-md flex-col justify-end p-7">
              <p className="text-sm text-genre-pop">Behind the music</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                Stories that make every listen mean more.
              </h3>
              <button className="mt-5 flex items-center gap-2 text-sm font-medium text-white">
                Read artist stories <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </article>
          <article className="flex min-h-[320px] flex-col justify-between rounded-3xl border border-border/70 bg-card p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-genre-electronic/15 text-genre-electronic">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-genre-electronic">Community rooms</p>
              <h3 className="mt-2 text-2xl font-semibold">
                The conversation continues after the song ends.
              </h3>
              <p className="mt-3 text-muted-foreground">
                Find members who share your taste and join artist-led spaces.
              </p>
              <button className="mt-5 flex items-center gap-2 text-sm font-medium text-foreground">
                Find your people <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </article>
        </section>
      </div>
    </RoleGuard>
  );
}
