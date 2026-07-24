import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  ExternalLink,
  ImagePlus,
  Loader2,
  Music2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUser } from "@/hooks/useUser";
import { useCreatorTracks } from "@/hooks/useMusic";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import {
  useDeletePlaylist,
  useMyPlaylist,
  useReplacePlaylistCover,
  useReplacePlaylistTracks,
  useUpdatePlaylist,
} from "@/hooks/usePlaylists";
import { formatDuration } from "@/features/music/schema";
import { PLAYLIST_PURPOSES } from "@/features/playlists/schema";

export const Route = createFileRoute("/_authenticated/playlists/$playlistId")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <PlaylistEditor />
    </RoleGuard>
  ),
});

function PlaylistEditor() {
  const { playlistId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { data: playlist, isLoading } = useMyPlaylist(user?.id, playlistId);
  const { data: tracks = [] } = useCreatorTracks(user?.id);
  const { data: creator } = useCreatorProfile(user?.id);
  const update = useUpdatePlaylist(user?.id);
  const replaceTracks = useReplacePlaylistTracks(user?.id);
  const replaceCover = useReplacePlaylistCover(user?.id);
  const remove = useDeletePlaylist(user?.id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occasion, setOccasion] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [trackIds, setTrackIds] = useState<string[]>([]);

  useEffect(() => {
    if (!playlist) return;
    setTitle(playlist.title);
    setDescription(playlist.description || "");
    setOccasion(playlist.occasion || "");
    setStatus(playlist.is_published ? "published" : "draft");
    setTrackIds(playlist.trackIds ?? []);
  }, [playlist]);

  const trackMap = useMemo(() => new Map(tracks.map((track) => [track.id, track])), [tracks]);
  const selectedTracks = trackIds.flatMap((id) => {
    const track = trackMap.get(id);
    return track ? [track] : [];
  });
  const availableTracks = tracks.filter(
    (track) => track.status === "published" && !trackIds.includes(track.id),
  );
  const fallbackCover = selectedTracks.find((track) => track.cover_url)?.cover_url;
  const artwork = playlist?.cover_url || fallbackCover || "/banners/default-creator-banner.png";
  const publicPath = playlist
    ? creator?.username
      ? `/artist/${creator.username}/playlist/${playlist.slug}`
      : `/playlist/${playlist.slug}`
    : "";

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= trackIds.length) return;
    setTrackIds((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return toast.error("Enter a playlist title.");
    if (!trackIds.length) return toast.error("Keep at least one published song in the playlist.");
    try {
      await update.mutateAsync({
        playlistId,
        input: {
          title: title.trim(),
          description: description.trim(),
          occasion,
          is_published: status === "published",
        },
      });
      await replaceTracks.mutateAsync({ playlistId, trackIds });
      toast.success("Playlist saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the playlist");
    }
  };

  const uploadCover = async (file?: File) => {
    if (!file) return;
    try {
      await replaceCover.mutateAsync({ playlistId, file });
      toast.success("Playlist cover updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the cover");
    }
  };

  const deletePlaylist = async () => {
    try {
      await remove.mutateAsync(playlistId);
      toast.success("Playlist deleted. Your songs remain in the Music Library.");
      navigate({ to: "/playlists" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the playlist");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }
  if (!playlist) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border p-10 text-center">
        <h1 className="text-2xl font-semibold">Playlist not found</h1>
        <Button asChild className="mt-6">
          <Link to="/playlists">Return to Playlist Studio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-3">
            <Link to="/playlists">
              <ArrowLeft className="mr-2 h-4 w-4" /> Playlist Studio
            </Link>
          </Button>
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">
            Edit playlist
          </p>
          <h1 className="mt-2 text-4xl font-semibold">{playlist.title}</h1>
          <p className="mt-2 text-muted-foreground">
            Manage its artwork, information, songs, order, and public availability.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(`${window.location.origin}${publicPath}`);
              toast.success("Playlist link copied.");
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> Copy link
          </Button>
          <Button asChild variant="outline">
            <a href={publicPath} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> View public page
            </a>
          </Button>
        </div>
      </header>

      <form onSubmit={save} className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <img src={artwork} alt="" className="aspect-square w-full object-cover" />
            <div className="p-5">
              <Label className="flex cursor-pointer items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-medium hover:border-primary/60">
                {replaceCover.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="mr-2 h-4 w-4" />
                )}
                Replace playlist cover
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={replaceCover.isPending}
                  onChange={(event) => {
                    void uploadCover(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </Label>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                JPG, PNG, or WebP up to 2MB. Until you add one, VYBE uses the first available song
                cover.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-medium">Public link</p>
            <p className="mt-2 break-all text-xs text-muted-foreground">{publicPath}</p>
          </div>
        </aside>

        <div className="space-y-8">
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="text-2xl font-semibold">Playlist details</h2>
            <div className="mt-6 grid gap-5">
              <div>
                <Label htmlFor="playlist-title">Title</Label>
                <Input
                  id="playlist-title"
                  className="mt-2"
                  value={title}
                  maxLength={120}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>Purpose</Label>
                  <Select value={occasion} onValueChange={setOccasion}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose a purpose" />
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
                  <Label>Availability</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as "published" | "draft")}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="playlist-description">Note to listeners</Label>
                <Textarea
                  id="playlist-description"
                  className="mt-2 min-h-28"
                  value={description}
                  maxLength={600}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Songs and play order</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Changes apply everywhere this playlist link is shared.
                </p>
              </div>
              <span className="text-sm text-muted-foreground">{trackIds.length} songs</span>
            </div>
            <div className="mt-6 space-y-2">
              {selectedTracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 p-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <img
                    src={track.cover_url || "/banners/default-creator-banner.png"}
                    alt=""
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{track.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDuration(track.duration_sec)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`Move ${track.title} up`}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={index === selectedTracks.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={`Move ${track.title} down`}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    disabled={trackIds.length === 1}
                    onClick={() =>
                      setTrackIds((current) => current.filter((id) => id !== track.id))
                    }
                    aria-label={`Remove ${track.title}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {!!availableTracks.length && (
              <div className="mt-8">
                <h3 className="font-semibold">Add from Music Library</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {availableTracks.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      className="flex items-center gap-3 rounded-2xl border border-border/70 p-3 text-left transition hover:border-primary/40"
                      onClick={() => setTrackIds((current) => [...current, track.id])}
                    >
                      <Music2 className="h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {track.title}
                      </span>
                      <Plus className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="flex flex-col-reverse justify-between gap-4 sm:flex-row">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete playlist
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete “{playlist.title}”?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the playlist, its cover, and its public link. Uploaded songs remain
                    in your Music Library.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground"
                    onClick={() => void deletePlaylist()}
                  >
                    Delete playlist
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              size="lg"
              disabled={update.isPending || replaceTracks.isPending || !trackIds.length}
              className="bg-gradient-brand text-primary-foreground"
            >
              {update.isPending || replaceTracks.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save playlist
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
