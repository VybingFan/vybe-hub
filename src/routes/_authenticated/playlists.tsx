import { FormEvent, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Copy,
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
  useReplacePlaylistTracks,
} from "@/hooks/usePlaylists";
import { formatDuration } from "@/features/music/schema";
import { PLAYLIST_PURPOSES, type Playlist } from "@/features/playlists/schema";
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
  const replaceTracks = useReplacePlaylistTracks(user?.id);
  const deletePlaylist = useDeletePlaylist(user?.id);
  const [selected, setSelected] = useState<string[]>([]);
  const [songQuery, setSongQuery] = useState("");
  const [songGenre, setSongGenre] = useState("all");
  const [playlistQuery, setPlaylistQuery] = useState("");
  const [playlistSort, setPlaylistSort] = useState<"newest" | "title">("newest");
  const [visiblePlaylistCount, setVisiblePlaylistCount] = useState(8);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editSelected, setEditSelected] = useState<string[]>([]);
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
        (songGenre === "all" || track.genre === songGenre) &&
        (!query ||
          track.title.toLowerCase().includes(query) ||
          (track.genre || "").toLowerCase().includes(query) ||
          (track.description || "").toLowerCase().includes(query)),
    );
  }, [songGenre, songQuery, tracks]);
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
  const publishedTracks = useMemo(
    () => tracks.filter((track) => track.status === "published"),
    [tracks],
  );

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
      });
      if (!playlist?.slug)
        throw new Error("Playlist published without a share link. Refresh and try again.");
      setCreatedSlug(playlist.slug);
      setSelected([]);
      setSongQuery("");
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
  const beginEditing = (playlist: Playlist) => {
    setEditingPlaylistId(playlist.id);
    setEditSelected(playlist.trackIds ?? []);
  };
  const savePlaylistSongs = async () => {
    if (!editingPlaylistId) return;
    if (!editSelected.length) {
      toast.error("Keep at least one published song in the playlist.");
      return;
    }
    try {
      await replaceTracks.mutateAsync({
        playlistId: editingPlaylistId,
        trackIds: editSelected,
      });
      setEditingPlaylistId(null);
      setEditSelected([]);
      toast.success("Playlist songs updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update playlist songs");
    }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePlaylist.mutateAsync(deleteTarget.id);
      if (editingPlaylistId === deleteTarget.id) {
        setEditingPlaylistId(null);
        setEditSelected([]);
      }
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
                          {checked ? selected.indexOf(track.id) + 1 : "—"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{track.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {track.genre || "No genre"} · {isPublished ? "Published" : "Draft"}
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
                                <Check className="mr-2 h-4 w-4" /> Added · Remove
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
                    No uploaded songs match “{songQuery}”. Try another title or genre.
                  </p>
                ) : (
                  <div className="p-5 text-sm text-muted-foreground">
                    <p>
                      A playlist needs at least one published song. Upload music first, choose
                      “Published,” then return here.
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
              disabled={create.isPending || !selected.length}
              size="lg"
              className="bg-gradient-brand text-white"
            >
              {create.isPending ? (
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
                <SelectItem value="title">Title A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-5 space-y-3">
            {visiblePlaylists.length ? (
              visiblePlaylists.map((playlist) => (
                <article key={playlist.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{playlist.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {(playlist.trackIds ?? []).length}{" "}
                        {(playlist.trackIds ?? []).length === 1 ? "song" : "songs"}
                      </p>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (editingPlaylistId === playlist.id) {
                          setEditingPlaylistId(null);
                          setEditSelected([]);
                        } else {
                          beginEditing(playlist);
                        }
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      {editingPlaylistId === playlist.id ? "Close" : "Manage songs"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteTarget(playlist)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>

                  {editingPlaylistId === playlist.id && (
                    <div className="mt-5 rounded-2xl border border-border/70 bg-background/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">Songs in this playlist</p>
                          <p className="text-xs text-muted-foreground">
                            Select your published songs, then save.
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {editSelected.length} selected
                        </span>
                      </div>
                      <div className="mt-3 max-h-64 space-y-2 overflow-auto">
                        {publishedTracks.length ? (
                          publishedTracks.map((track) => {
                            const checked = editSelected.includes(track.id);
                            return (
                              <button
                                key={track.id}
                                type="button"
                                className="flex w-full items-center gap-3 rounded-xl border border-border/60 px-3 py-2 text-left transition-colors hover:bg-muted"
                                onClick={() =>
                                  setEditSelected((current) =>
                                    checked
                                      ? current.filter((id) => id !== track.id)
                                      : [...current, track.id],
                                  )
                                }
                              >
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                    checked
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border"
                                  }`}
                                >
                                  {checked && <Check className="h-3.5 w-3.5" />}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm">
                                  {track.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDuration(track.duration_sec)}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                            Publish a song before managing this playlist.
                          </p>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPlaylistId(null);
                            setEditSelected([]);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!editSelected.length || replaceTracks.isPending}
                          onClick={savePlaylistSongs}
                        >
                          {replaceTracks.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save songs
                        </Button>
                      </div>
                    </div>
                  )}
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
            <AlertDialogTitle>Delete “{deleteTarget?.title}”?</AlertDialogTitle>
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
