import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  ListMusic,
  Loader2,
  Music2,
  Search,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatorTracks } from "@/hooks/useMusic";
import { useMyPlaylists } from "@/hooks/usePlaylists";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { useUser } from "@/hooks/useUser";
import { creatorTracksKey } from "@/hooks/useMusic";
import { publicMusicSetupService } from "@/services/music/publicMusicSetupService";

export const Route = createFileRoute("/_authenticated/public-music")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <PublicMusicSetup />
    </RoleGuard>
  ),
});

function PublicMusicSetup() {
  const { user } = useUser();
  const creatorId = user?.id;
  const { data: tracks = [], isLoading: tracksLoading } =
    useCreatorTracks(creatorId);
  const { data: playlists = [], isLoading: playlistsLoading } =
    useMyPlaylists(creatorId);
  const { data: profile } = useCreatorProfile(creatorId);
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showIneligible, setShowIneligible] = useState(false);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: creatorTracksKey(creatorId) }),
      queryClient.invalidateQueries({ queryKey: ["playlists", creatorId] }),
      profile?.username
        ? queryClient.invalidateQueries({
            queryKey: ["public-creator", profile.username],
          })
        : Promise.resolve(),
    ]);
  };

  const update = useMutation({
    mutationFn: async (operation: () => Promise<void>) => operation(),
    onSuccess: refresh,
  });

  const run = async (
    id: string,
    operation: () => Promise<void>,
    message: string,
  ) => {
    setBusyId(id);
    try {
      await update.mutateAsync(operation);
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  };

  const publicPlaylists = playlists.filter(
    (playlist) => playlist.is_published && playlist.access_mode === "public",
  );
  const protectedPlaylists = playlists.filter(
    (playlist) => !playlist.is_published || playlist.access_mode !== "public",
  );
  const topFive = useMemo(
    () =>
      tracks
        .filter((track) => track.profile_feature_rank)
        .sort(
          (a, b) =>
            (a.profile_feature_rank ?? 99) - (b.profile_feature_rank ?? 99),
        ),
    [tracks],
  );
  const displayTracks = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return [...tracks]
      .filter((track) => {
        const eligible =
          track.status === "published" && track.visibility === "public";
        if (!showIneligible && !eligible) return false;
        if (!needle) return true;
        return [track.title, track.primary_artist_name, track.genre]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle));
      })
      .sort((a, b) => {
        const genre = (a.genre || "Other").localeCompare(b.genre || "Other");
        return genre || a.title.localeCompare(b.title);
      });
  }, [query, showIneligible, tracks]);

  if (tracksLoading || playlistsLoading) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <WorkspacePageHeader
        eyebrow="Creator website"
        title="Public music setup"
        description="Choose the first songs visitors hear and which public playlists appear on your page. Protected and unlisted music remains separate."
        status={
          <Badge variant="secondary">
            {
              tracks.filter(
                (track) =>
                  track.status === "published" && track.visibility === "public",
              ).length
            }{" "}
            eligible
          </Badge>
        }
        action={
          profile?.username ? (
            <Button asChild variant="outline">
              <a
                href={`/artist/${profile.username}`}
                target="_blank"
                rel="noreferrer"
              >
                View public page <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Star className="mt-1 h-5 w-5 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Artist&apos;s Top 5</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Assign positions 1–5. Choosing an occupied position replaces the
                previous song in that position without deleting or unpublishing
                it.
              </p>
            </div>
          </div>

          {topFive.length ? (
            <div className="mt-4 flex flex-wrap gap-2 rounded-xl bg-muted/40 p-3">
              {topFive.map((track) => (
                <Badge key={track.id} variant="secondary">
                  {track.profile_feature_rank}. {track.title}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, artist, or genre"
                className="pl-9"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowIneligible((current) => !current)}
            >
              {showIneligible ? "Eligible only" : "Show ineligible"}
            </Button>
          </div>

          <div className="mt-3 max-h-[32rem] divide-y overflow-y-auto rounded-xl border">
            {displayTracks.map((track) => {
              const published =
                track.status === "published" && track.visibility === "public";
              const busy = busyId === track.id;
              return (
                <div
                  key={track.id}
                  className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
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
                      <p className="truncate font-medium">{track.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {track.genre || "No genre"} ·{" "}
                        {published
                          ? "Public and published"
                          : "Not eligible for public display"}
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-1 h-5 px-1.5 text-[10px]"
                      >
                        {track.genre || "Other"}
                      </Badge>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={track.show_on_public_profile !== false}
                      disabled={!published || busy}
                      onCheckedChange={(checked) =>
                        void run(
                          track.id,
                          () =>
                            publicMusicSetupService.setTrackShown(
                              track.id,
                              creatorId!,
                              checked === true,
                            ),
                          checked
                            ? "Song added to public page."
                            : "Song removed from public page.",
                        )
                      }
                    />
                    Show
                  </label>

                  <Select
                    value={track.profile_feature_rank?.toString() ?? "none"}
                    disabled={!published || busy}
                    onValueChange={(value) =>
                      void run(
                        track.id,
                        () =>
                          publicMusicSetupService.setTopFivePosition(
                            track.id,
                            value === "none" ? null : Number(value),
                          ),
                        value === "none"
                          ? "Removed from Top 5."
                          : `Set as Top 5 position ${value}.`,
                      )
                    }
                  >
                    <SelectTrigger className="h-9 w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not in Top 5</SelectItem>
                      {[1, 2, 3, 4, 5].map((rank) => (
                        <SelectItem key={rank} value={String(rank)}>
                          Position {rank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
            {!displayTracks.length ? (
              <p className="p-5 text-sm text-muted-foreground">
                No songs match this view.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <ListMusic className="mt-1 h-5 w-5 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">
                Public playlists on your website
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A playlist must be published, Public, and selected below before
                it appears on your creator page.
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y rounded-2xl border">
            {publicPlaylists.length ? (
              publicPlaylists.map((playlist) => (
                <label
                  key={playlist.id}
                  className="flex min-h-16 items-center gap-3 p-4"
                >
                  <Checkbox
                    checked={playlist.show_on_public_profile === true}
                    disabled={busyId === playlist.id}
                    onCheckedChange={(checked) =>
                      void run(
                        playlist.id,
                        () =>
                          publicMusicSetupService.setPlaylistShown(
                            playlist.id,
                            creatorId!,
                            checked === true,
                          ),
                        checked
                          ? "Playlist added to public page."
                          : "Playlist removed from public page.",
                      )
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {playlist.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {playlist.occasion || "Public playlist"}
                    </span>
                  </span>
                  <Badge variant="outline">Public</Badge>
                </label>
              ))
            ) : (
              <p className="p-5 text-sm text-muted-foreground">
                No eligible public playlists yet. Create or update one in
                Playlist Studio.
              </p>
            )}
          </div>

          {protectedPlaylists.length ? (
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              {protectedPlaylists.length} private, unlisted, approved-listener,
              subscriber, draft, or otherwise protected playlist
              {protectedPlaylists.length === 1 ? " is" : "s are"}
              intentionally hidden from this list.
            </p>
          ) : null}

          <Button asChild variant="outline" className="mt-5">
            <Link to="/playlists">Open Playlist Studio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
