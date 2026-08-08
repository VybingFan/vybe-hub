import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, ListMusic, Loader2, Music2, Star } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

  if (tracksLoading || playlistsLoading) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">
            Creator website
          </p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
            Public music setup
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Choose the first songs visitors hear and which public playlists
            appear on your page. Access settings remain separate and protected
            links are never listed here.
          </p>
        </div>
        {profile?.username ? (
          <Button asChild variant="outline">
            <a
              href={`/artist/${profile.username}`}
              target="_blank"
              rel="noreferrer"
            >
              View public page <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        ) : null}
      </header>

      <Card>
        <CardContent className="p-5 sm:p-6">
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

          <div className="mt-5 divide-y rounded-2xl border">
            {tracks.map((track) => {
              const published =
                track.status === "published" && track.visibility === "public";
              const busy = busyId === track.id;
              return (
                <div
                  key={track.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
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
                    <SelectTrigger className="w-full sm:w-40">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 sm:p-6">
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
