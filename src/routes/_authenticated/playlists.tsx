import { FormEvent, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Copy,
  ImagePlus,
  ListMusic,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/useUser";
import { useCreatorTracks, useUpdateTrack } from "@/hooks/useMusic";
import {
  useCreatePlaylist,
  useDeletePlaylist,
  useMyPlaylists,
  useReplacePlaylistCover,
} from "@/hooks/usePlaylists";
import { formatDuration, MAX_COVER_BYTES } from "@/features/music/schema";
import { PLAYLIST_PURPOSES, type Playlist, type PlaylistAccessMode } from "@/features/playlists/schema";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";

export const Route = createFileRoute("/_authenticated/playlists")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <PlaylistStudio />
    </RoleGuard>
  ),
});

function PlaylistStudio() {
  const { user } = useUser();
  const { data: tracks = [], isLoading } = useCreatorTracks(user?.id);
  const updateTrack = useUpdateTrack(user?.id);
  const { data: creatorProfile } = useCreatorProfile(user?.id);
  const { data: playlists = [] } = useMyPlaylists(user?.id);
  const create = useCreatePlaylist(user?.id);
  const replaceCover = useReplacePlaylistCover(user?.id);
  const deletePlaylist = useDeletePlaylist(user?.id);
  const [selected, setSelected] = useState<string[]>([]);
  const [songQuery, setSongQuery] = useState("");
  const [songGenre, setSongGenre] = useState("all");
  const [playlistQuery, setPlaylistQuery] = useState("");
  const [playlistSort, setPlaylistSort] = useState<"newest" | "title">("newest");
  const [createAccessMode, setCreateAccessMode] =
    useState<PlaylistAccessMode>("unlisted");
  const [createRequireSignIn, setCreateRequireSignIn] = useState(false);
  const [createAccessExpiresAt, setCreateAccessExpiresAt] = useState("");
  const [visiblePlaylistCount, setVisiblePlaylistCount] = useState(8);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [playlistCover, setPlaylistCover] = useState<File | null>(null);
  const playlistCoverPreview = useMemo(
    () => (playlistCover ? URL.createObjectURL(playlistCover) : null),
    [playlistCover],
  );
  useEffect(
    () => () => {
      if (playlistCoverPreview) URL.revokeObjectURL(playlistCoverPreview);
    },
    [playlistCoverPreview],
  );
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);
  const songGenres = useMemo(
    () =>
      Array.from(
        new Set(tracks.map((track) => track.genre?.trim()).filter(Boolean) as string[]),
      ).sort((a, b) => a.localeCompare(b)),
    [tracks],
  );
  const visibleTracks = useMemo(() => {
    const query = songQuery.trim().toLowerCase();
    return tracks.filter(
      (track) =>
        (createAccessMode === "approved_listeners"
          ? track.status === "published"
          : track.status === "published" && track.visibility === "public") &&        (songGenre === "all" || track.genre === songGenre) &&
        (!query ||
          track.title.toLowerCase().includes(query) ||
          (track.genre || "").toLowerCase().includes(query) ||
          (track.description || "").toLowerCase().includes(query)),
    );
  }, [createAccessMode, songGenre, songQuery, tracks]);
  const filteredPlaylists = useMemo(() => {
    const query = playlistQuery.trim().toLowerCase();
    const matches = playlists.filter(
      (playlist) =>
        !query ||
        playlist.title.toLowerCase().includes(query) ||
        (playlist.occasion || "").toLowerCase().includes(query) ||
        (playlist.description || "").toLowerCase().includes(query),
    );
    return [...matches].sort((a, b) =>
      playlistSort === "title"
        ? a.title.localeCompare(b.title)
        : b.created_at.localeCompare(a.created_at),
    );
  }, [playlistQuery, playlistSort, playlists]);
  const visiblePlaylists = filteredPlaylists.slice(0, visiblePlaylistCount);
  const publishAndAddTrack = async (trackId: string) => {
    try {
      await updateTrack.mutateAsync({ id: trackId, patch: { status: "published" } });
      setSelected((current) => (current.includes(trackId) ? current : [...current, trackId]));
      toast.success("Song published and added to the playlist.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish song");
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (!selected.length) return toast.error("Choose at least one published song.");
    try {
      const playlist = await create.mutateAsync({
        title: String(form.get("title") || ""),
        description: String(form.get("description") || ""),
        occasion: String(form.get("occasion") || ""),
        trackIds: selected,
        access_mode: createAccessMode,
        access_expires_at: createAccessExpiresAt
          ? new Date(createAccessExpiresAt).toISOString()
          : null,
        require_sign_in:
          createAccessMode === "approved_listeners" ||
          createAccessMode === "membership_only" ||
          createRequireSignIn,
      });
      if (!playlist?.slug)
        throw new Error("Playlist published without a share link. Refresh and try again.");
      if (playlistCover) {
        try {
          await replaceCover.mutateAsync({ playlistId: playlist.id, file: playlistCover });
        } catch (coverError) {
          toast.error(
            coverError instanceof Error
              ? `Playlist created, but its cover was not saved: ${coverError.message}`
              : "Playlist created, but its cover was not saved. Add it from Manage playlist.",
          );
        }
      }
      setCreatedSlug(playlist.slug);
      setSelected([]);
      setPlaylistCover(null);
      setSongQuery("");
      setCreateAccessMode("unlisted");
      setCreateRequireSignIn(false);
      setCreateAccessExpiresAt("");
      formElement.reset();
      toast.success("Playlist published. Your share link is ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create playlist");
    }
  };
  const playlistPath = (slug: string) =>
    creatorProfile?.username
      ? `/artist/${creatorProfile.username}/playlist/${slug}`
      : `/playlist/${slug}`;
  const shareUrl = (slug: string) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}${playlistPath(slug)}`;
  const copy = async (slug: string) => {
    if (!slug) return toast.error("This playlist does not have a share link yet.");
    const url = shareUrl(slug);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("textarea");
        input.value = url;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand("copy");
        input.remove();
        if (!copied) throw new Error("Clipboard access was denied");
      }
      toast.success("Share link copied");
    } catch {
      window.prompt("Copy this playlist link:", url);
      toast.error("Automatic copy was blocked. Copy the displayed link instead.");
    }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePlaylist.mutateAsync(deleteTarget.id);
      if (createdSlug === deleteTarget.slug) setCreatedSlug(null);
      setDeleteTarget(null);
      toast.success("Playlist deleted. Your uploaded songs are still in your music library.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete playlist");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">
          Artist workspace
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Playlist Studio</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Choose a purpose, arrange the songs, and send fans one VYBE link where the entire playlist
          plays.
        </p>
      </header>
      {createdSlug && (
        <div className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-semibold">
              <Check className="h-5 w-5 text-primary" /> Ready to send
            </p>
            <p className="mt-1 break-all text-sm text-muted-foreground">{shareUrl(createdSlug)}</p>
          </div>
          <Button onClick={() => copy(createdSlug)}>
            <Copy className="mr-2 h-4 w-4" /> Copy link
          </Button>
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
        <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-6 md:p-8">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <Plus className="text-primary" /> Create a playlist
          </h2>
          <div className="mt-7 grid gap-5">
            <div>
              <Label htmlFor="title">Playlist title</Label>
              <Input
                className="mt-2"
                id="title"
                name="title"
                required
                maxLength={120}
                placeholder="Songs for the ride home"
              />
            </div>
            <div>
              <Label htmlFor="occasion">What is it for?</Label>
              <Select name="occasion">
                <SelectTrigger className="mt-2" id="occasion">
                  <SelectValue placeholder="Choose a playlist type" />
                </SelectTrigger>
                <SelectContent>
                  {PLAYLIST_PURPOSES.map((purpose) => (
                    <SelectItem key={purpose} value={purpose}>
                      {purpose}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <Label>Who can open this playlist?</Label>

              <Select
                value={createAccessMode}
                onValueChange={(value) => {
                  const next = value as PlaylistAccessMode;
                  setCreateAccessMode(next);
                  setSelected([]);

                  if (next === "approved_listeners") {
                    setCreateRequireSignIn(true);
                  }
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="public">
                    Public â€” listed and open to everyone
                  </SelectItem>
                  <SelectItem value="unlisted">
                    Unlisted â€” only people with the link
                  </SelectItem>
                  <SelectItem value="approved_listeners">
                    Approved listeners â€” invitation required
                  </SelectItem>
                </SelectContent>
              </Select>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Public and unlisted playlists can use only public, published songs.
                Approved-listener playlists can also use published private or unlisted songs.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="create-playlist-expiration">
                    Link expiration (optional)
                  </Label>

                  <Input
                    id="create-playlist-expiration"
                    className="mt-2"
                    type="datetime-local"
                    value={createAccessExpiresAt}
                    onChange={(event) =>
                      setCreateAccessExpiresAt(event.target.value)
                    }
                  />
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-border p-4 text-sm">
                  <input
                    type="checkbox"
                    checked={
                      createAccessMode === "approved_listeners" ||
                      createRequireSignIn
                    }
                    disabled={createAccessMode === "approved_listeners"}
                    onChange={(event) =>
                      setCreateRequireSignIn(event.target.checked)
                    }
                  />
                  Require listeners to sign in
                </label>
              </div>

              {createAccessMode === "approved_listeners" ? (
                <p className="mt-3 rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">
                  Create the playlist first, then use Manage playlist to add the
                  exact listener email addresses.
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="description">A note to your listeners</Label>
              <Textarea
                className="mt-2"
                id="description"
                name="description"
                maxLength={600}
                placeholder="Tell fans why you chose these songs."
              />
            </div>
            <div>
              <Label htmlFor="playlist-cover">Playlist cover art (optional)</Label>
              <label
                htmlFor="playlist-cover"
                className="mt-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border p-4 transition hover:border-primary/50 hover:bg-primary/5"
              >
                {playlistCoverPreview ? (
                  <img
                    src={playlistCoverPreview}
                    alt="Selected playlist cover preview"
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {playlistCover ? playlistCover.name : "Choose cover art"}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    JPG, PNG, or WebP Â· up to 2MB
                  </span>
                </span>
              </label>
              <Input
                id="playlist-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file && file.size > MAX_COVER_BYTES) {
                    toast.error("Playlist cover must be 2MB or smaller.");
                    event.target.value = "";
                    setPlaylistCover(null);
                    return;
                  }
                  setPlaylistCover(file);
                }}
              />
            </div>
            <div>
              <Label>Choose songs in play order</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={songQuery}
                  onChange={(event) => setSongQuery(event.target.value)}
                  placeholder="Search your uploaded songs by title or genre"
                  className="pl-9"
                />
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Select value={songGenre} onValueChange={setSongGenre}>
                  <SelectTrigger className="sm:w-56">
                    <SelectValue placeholder="All genres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All genres</SelectItem>
                    {songGenres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>{selected.length} selected</span>
                  {!!selected.length && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelected([])}>
                      Clear selection
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-2 max-h-80 space-y-2 overflow-auto rounded-2xl border border-border p-2">
                {isLoading ? (
                  <Loader2 className="m-6 animate-spin" />
                ) : visibleTracks.length ? (
                  visibleTracks.map((track) => {
                    const checked = selected.includes(track.id);
                    const isPublished = track.status === "published";
                    return (
                      <div
                        key={track.id}
                        className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/5"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground">
                          {checked ? selected.indexOf(track.id) + 1 : "â€”"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{track.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {track.genre || "No genre"} Â· {isPublished ? "Published" : "Draft"}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(track.duration_sec)}
                        </span>
                        {isPublished ? (
                          <Button
                            type="button"
                            size="sm"
                            variant={checked ? "secondary" : "outline"}
                            onClick={() =>
                              setSelected((current) =>
                                checked
                                  ? current.filter((id) => id !== track.id)
                                  : [...current, track.id],
                              )
                            }
                          >
                            {checked ? (
                              <>
                                <Check className="mr-2 h-4 w-4" /> Added Â· Remove
                              </>
                            ) : (
                              <>
                                <Plus className="mr-2 h-4 w-4" /> Add to playlist
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={updateTrack.isPending}
                            onClick={() => publishAndAddTrack(track.id)}
                          >
                            Publish & add
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : tracks.length ? (
                  <p className="p-5 text-sm text-muted-foreground">
                    No uploaded songs match â€œ{songQuery}â€. Try another title or genre.
                  </p>
                ) : (
                  <div className="p-5 text-sm text-muted-foreground">
                    <p>
                      A playlist needs at least one published song. Upload music first, choose
                      â€œPublished,â€ then return here.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-4">
                      <Link to="/music/upload">
                        <Upload className="mr-2 h-4 w-4" /> Upload your first song
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <Button
              disabled={create.isPending || replaceCover.isPending || !selected.length}
              size="lg"
              className="bg-gradient-brand text-white"
            >
              {create.isPending || replaceCover.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ListMusic className="mr-2 h-4 w-4" />
              )}{" "}
              Publish and get link
            </Button>
          </div>
        </form>
        <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Your shared playlists</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {playlists.length} published links
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_10rem] lg:grid-cols-1 xl:grid-cols-[1fr_10rem]">
            <Input
              value={playlistQuery}
              onChange={(event) => {
                setPlaylistQuery(event.target.value);
                setVisiblePlaylistCount(8);
              }}
              placeholder="Search playlist titles or types"
            />
            <Select
              value={playlistSort}
              onValueChange={(value) => setPlaylistSort(value as typeof playlistSort)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="title">Title Aâ€“Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-5 space-y-3">
            {visiblePlaylists.length ? (
              visiblePlaylists.map((playlist) => (
                <article key={playlist.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      {playlist.cover_url ? (
                        <img
                          src={playlist.cover_url}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <ListMusic className="h-5 w-5 text-muted-foreground" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{playlist.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {(playlist.trackIds ?? []).length}{" "}
                          {(playlist.trackIds ?? []).length === 1 ? "song" : "songs"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {playlist.occasion || "Shared listening experience"}
                  </p>
                  <p className="mt-3 break-all text-xs text-muted-foreground">
                    {shareUrl(playlist.slug)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => copy(playlist.slug)}>
                      <Copy className="mr-2 h-4 w-4" /> Copy link
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/playlists/$playlistId" params={{ playlistId: playlist.id }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Manage playlist
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteTarget(playlist)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete playlist
                    </Button>
                  </div>
                </article>
              ))
            ) : playlists.length ? (
              <div className="rounded-2xl border border-dashed border-border p-7 text-center text-muted-foreground">
                No playlists match that search.
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-7 text-center text-muted-foreground">
                Your first shareable playlist will appear here.
              </div>
            )}
            {visiblePlaylistCount < filteredPlaylists.length && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setVisiblePlaylistCount((value) => value + 8)}
              >
                Load 8 more playlists
              </Button>
            )}
          </div>
        </section>
      </div>
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deletePlaylist.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete â€œ{deleteTarget?.title}â€?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the playlist and its share link. Your uploaded songs will
              remain in your music library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePlaylist.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePlaylist.isPending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deletePlaylist.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete playlist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}