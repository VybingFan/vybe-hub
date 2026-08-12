import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Disc3,
  ListMusic,
  LockKeyhole,
  Music2,
  Play,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDuration, type Track } from "@/features/music/schema";
import type { PublicCreatorPlaylist } from "@/services/creator/publicCreatorService";

type Filter =
  | { kind: "all" }
  | { kind: "genre"; value: string }
  | { kind: "mood"; value: string };

export function PublicCreatorMusicExperience({
  tracks,
  playlists,
  username,
  initialTrackId,
}: {
  tracks: Track[];
  playlists: PublicCreatorPlaylist[];
  username: string;
  initialTrackId?: string;
}) {
  const publicTracks = useMemo(
    () => tracks.filter((track) => track.show_on_public_profile !== false),
    [tracks],
  );
  const ranked = useMemo(
    () =>
      publicTracks
        .filter((track) => track.profile_feature_rank != null)
        .sort(
          (a, b) =>
            (a.profile_feature_rank ?? 99) - (b.profile_feature_rank ?? 99),
        )
        .slice(0, 5),
    [publicTracks],
  );
  const topTracks = ranked.length
    ? ranked
    : publicTracks
        .slice()
        .sort(
          (a, b) =>
            Number(b.is_featured) - Number(a.is_featured) ||
            b.created_at.localeCompare(a.created_at),
        )
        .slice(0, 5);
  const latest = publicTracks
    .slice()
    .sort((a, b) =>
      (b.release_date || b.created_at).localeCompare(
        a.release_date || a.created_at,
      ),
    )[0];
  const [selectedId, setSelectedId] = useState(
    initialTrackId && publicTracks.some((track) => track.id === initialTrackId)
      ? initialTrackId
      : (topTracks[0]?.id ?? publicTracks[0]?.id),
  );
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [showAll, setShowAll] = useState(false);
  const [showAllPlaylists, setShowAllPlaylists] = useState(false);
  const selected =
    publicTracks.find((track) => track.id === selectedId) ?? publicTracks[0];

  const genres = unique(
    publicTracks
      .map((track) => track.genre)
      .filter((value): value is string => Boolean(value)),
  ).slice(0, 8);
  const moods = unique(
    publicTracks.flatMap((track) => track.discovery_metadata?.mood_tags ?? []),
  ).slice(0, 10);
  const filtered = publicTracks.filter((track) => {
    if (filter.kind === "genre") return track.genre === filter.value;
    if (filter.kind === "mood")
      return track.discovery_metadata?.mood_tags?.includes(filter.value);
    return true;
  });
  const visibleCatalog = showAll ? filtered : filtered.slice(0, 6);

  if (!publicTracks.length) {
    return (
      <div className="rounded-3xl border border-dashed p-8 text-center">
        <Music2 className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Music is being prepared</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This creator has not selected public music for this page yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="artist-top-five">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">
              Selected by the artist
            </p>
            <h2 id="artist-top-five" className="mt-1 text-2xl font-semibold">
              {ranked.length ? "Artist’s Top 5" : "Start here"}
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Tap a song to listen
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border bg-card">
          {topTracks.map((track, index) => (
            <button
              key={track.id}
              type="button"
              onClick={() => setSelectedId(track.id)}
              className={cn(
                "flex min-h-16 w-full items-center gap-3 border-b px-3 py-3 text-left last:border-0 sm:px-5",
                selected?.id === track.id && "bg-primary/10",
              )}
            >
              <span className="w-6 text-center text-xs text-muted-foreground">
                {track.profile_feature_rank ?? index + 1}
              </span>
              <Artwork track={track} className="h-11 w-11" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {track.title}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {track.primary_artist_name || "VYBE artist"}
                  {track.genre ? ` · ${track.genre}` : ""}
                </span>
              </span>
              {track.playback_mode === "preview" ? (
                <Badge variant="outline">Preview</Badge>
              ) : null}
              {!track.audio_url ? (
                <LockKeyhole className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="hidden text-xs text-muted-foreground sm:block">
                {formatDuration(track.duration_sec)}
              </span>
            </button>
          ))}
        </div>

        {selected ? (
          <div className="mt-3 flex flex-col gap-3 rounded-2xl border bg-background/80 p-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                Now selected: {selected.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {selected.playback_mode === "preview"
                  ? "Public preview"
                  : selected.audio_url
                    ? "Full public playback"
                    : "Playback restricted"}
              </p>
            </div>
            {selected.audio_url ? (
              <audio
                key={selected.id}
                src={selected.audio_url}
                controls
                preload="metadata"
                controlsList="nodownload noremoteplayback"
                className="h-10 w-full sm:w-80"
              />
            ) : (
              <Badge variant="outline">Playback unavailable</Badge>
            )}
          </div>
        ) : null}
      </section>

      {latest ? (
        <section>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">
            Latest release
          </p>
          <button
            type="button"
            onClick={() => setSelectedId(latest.id)}
            className="mt-3 flex w-full items-center gap-4 overflow-hidden rounded-3xl border bg-gradient-hero p-4 text-left transition hover:border-primary/40 sm:p-6"
          >
            <Artwork track={latest} className="h-20 w-20 sm:h-28 sm:w-28" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-[.18em] text-primary">
                {latest.release_date
                  ? new Date(
                      `${latest.release_date}T00:00:00`,
                    ).toLocaleDateString()
                  : "Available now"}
              </span>
              <span className="mt-2 block truncate text-xl font-semibold sm:text-3xl">
                {latest.title}
              </span>
              <span className="mt-1 block truncate text-sm text-muted-foreground">
                {latest.primary_artist_name || "VYBE artist"}
                {latest.genre ? ` · ${latest.genre}` : ""}
              </span>
            </span>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            </span>
          </button>
        </section>
      ) : null}

      {genres.length > 1 || moods.length ? (
        <section>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">
            Explore the sound
          </p>
          <h2 className="mt-1 text-2xl font-semibold">Choose your Vybe</h2>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            <FilterButton
              active={filter.kind === "all"}
              onClick={() => setFilter({ kind: "all" })}
            >
              All
            </FilterButton>
            {genres.map((genre) => (
              <FilterButton
                key={`genre-${genre}`}
                active={filter.kind === "genre" && filter.value === genre}
                onClick={() => setFilter({ kind: "genre", value: genre })}
              >
                {genre}
              </FilterButton>
            ))}
            {moods.map((mood) => (
              <FilterButton
                key={`mood-${mood}`}
                active={filter.kind === "mood" && filter.value === mood}
                onClick={() => setFilter({ kind: "mood", value: mood })}
              >
                {mood}
              </FilterButton>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">
              Music
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Releases and songs</h2>
          </div>
          {filtered.length > 6 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? "Show less" : `See all ${filtered.length}`}
            </Button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCatalog.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => setSelectedId(track.id)}
              className="flex min-w-0 items-center gap-3 rounded-2xl border bg-card p-3 text-left transition hover:border-primary/40"
            >
              <Artwork track={track} className="h-14 w-14" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {track.title}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {track.genre || "Independent music"}
                </span>
              </span>
              <Play className="h-4 w-4 shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {playlists.length ? (
        <section>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">
            Curated by the artist
          </p>
          <h2 className="mt-1 text-2xl font-semibold">Public playlists</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(showAllPlaylists ? playlists : playlists.slice(0, 6)).map((playlist) => (
              <Link
                key={playlist.id}
                to="/artist/$username/playlist/$slug"
                params={{ username, slug: playlist.slug }}
                className="group flex min-w-0 items-center gap-3 rounded-2xl border bg-card p-3 transition hover:border-primary/40"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                  {playlist.cover_url ? (
                    <img
                      src={playlist.cover_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ListMusic className="h-5 w-5 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {playlist.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {playlist.occasion || "Artist playlist"}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
          {playlists.length > 6 ? (
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => setShowAllPlaylists((value) => !value)}
            >
              {showAllPlaylists
                ? "Show fewer playlists"
                : `View all ${playlists.length} playlists`}
            </Button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Artwork({ track, className }: { track: Track; className: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted",
        className,
      )}
    >
      {track.cover_url ? (
        <img
          src={track.cover_url}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <Disc3 className="h-5 w-5 text-muted-foreground" />
      )}
    </span>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      className="shrink-0 rounded-full"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
