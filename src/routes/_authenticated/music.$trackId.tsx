import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileAudio, ImagePlus, Loader2, Save, Star, Trash2 } from "lucide-react";
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
import {
  useCreatorTracks,
  useDeleteTrack,
  useReplaceTrackAudio,
  useReplaceTrackCover,
  useSetProfileLead,
  useUpdateTrack,
} from "@/hooks/useMusic";
import { formatDuration, MAX_COVER_BYTES, type ContentStatus } from "@/features/music/schema";
import { readAudioDuration } from "@/services/music/musicService";

export const Route = createFileRoute("/_authenticated/music/$trackId")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <SongEditor />
    </RoleGuard>
  ),
});

function SongEditor() {
  const { trackId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { data: tracks = [], isLoading } = useCreatorTracks(user?.id);
  const track = tracks.find((item) => item.id === trackId);
  const update = useUpdateTrack(user?.id);
  const replaceCover = useReplaceTrackCover(user?.id);
  const replaceAudio = useReplaceTrackAudio(user?.id);
  const setLead = useSetProfileLead(user?.id);
  const remove = useDeleteTrack(user?.id);
  const [title, setTitle] = useState("");
  const [primaryArtist, setPrimaryArtist] = useState("");
  const [featuredArtists, setFeaturedArtists] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [status, setStatus] = useState<ContentStatus>("draft");

  useEffect(() => {
    if (!track) return;
    setTitle(track.title);
    setPrimaryArtist(track.primary_artist_name || "");
    setFeaturedArtists((track.featured_artist_names || []).join(", "));
    setGenre(track.genre || "");
    setDescription(track.description || "");
    setReleaseDate(track.release_date || "");
    setStatus(track.status);
  }, [track]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !primaryArtist.trim()) {
      return toast.error("Song title and primary artist are required.");
    }
    try {
      await update.mutateAsync({
        id: trackId,
        patch: {
          title: title.trim(),
          primary_artist_name: primaryArtist.trim(),
          featured_artist_names: featuredArtists
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean),
          genre: genre.trim(),
          description: description.trim(),
          release_date: releaseDate,
          status,
        },
      });
      toast.success("Song details saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the song");
    }
  };

  const uploadCover = async (file?: File) => {
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      return toast.error("Choose a JPG, PNG, or WebP cover image.");
    }
    if (file.size > MAX_COVER_BYTES) return toast.error("Cover exceeds 2MB");
    try {
      await replaceCover.mutateAsync({ id: trackId, file });
      toast.success("Cover art updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update cover art");
    }
  };

  const uploadAudio = async (file?: File) => {
    if (!file) return;
    try {
      const durationSec = await readAudioDuration(file);
      if (!durationSec) throw new Error("VYBE could not read the replacement audio duration.");
      await replaceAudio.mutateAsync({ id: trackId, file, durationSec });
      toast.success("Audio replaced everywhere this song appears.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not replace the audio");
    }
  };

  const deleteSong = async () => {
    try {
      await remove.mutateAsync(trackId);
      toast.success("Song deleted.");
      navigate({ to: "/music" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the song");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }
  if (!track) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border p-10 text-center">
        <h1 className="text-2xl font-semibold">Song not found</h1>
        <Button asChild className="mt-6">
          <Link to="/music">Return to Music Library</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <Button asChild variant="ghost" className="-ml-3 mb-3">
          <Link to="/music">
            <ArrowLeft className="mr-2 h-4 w-4" /> Music Library
          </Link>
        </Button>
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Edit song</p>
        <h1 className="mt-2 text-4xl font-semibold">{track.title}</h1>
        <p className="mt-2 text-muted-foreground">
          Manage its audio, artwork, credits, publishing status, and profile placement.
        </p>
      </header>

      <form onSubmit={save} className="grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <img
              src={track.cover_url || "/banners/default-creator-banner.png"}
              alt=""
              className="aspect-square w-full object-cover"
            />
            <div className="space-y-3 p-5">
              <Label className="flex cursor-pointer items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-medium hover:border-primary/60">
                {replaceCover.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="mr-2 h-4 w-4" />
                )}
                Replace cover art
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
              <p className="text-xs text-muted-foreground">JPG, PNG, or WebP up to 2MB.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-medium">Current audio</p>
            <audio controls preload="metadata" src={track.audio_url} className="mt-3 w-full" />
            <p className="mt-2 text-xs text-muted-foreground">
              Duration: {formatDuration(track.duration_sec)}
            </p>
          </div>
        </aside>

        <div className="space-y-8">
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="text-2xl font-semibold">Song details</h2>
            <div className="mt-6 grid gap-5">
              <div>
                <Label htmlFor="song-title">Song title</Label>
                <Input
                  id="song-title"
                  className="mt-2"
                  value={title}
                  maxLength={120}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="primary-artist">Primary artist</Label>
                  <Input
                    id="primary-artist"
                    className="mt-2"
                    value={primaryArtist}
                    onChange={(event) => setPrimaryArtist(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="featured-artists">Featured artists</Label>
                  <Input
                    id="featured-artists"
                    className="mt-2"
                    value={featuredArtists}
                    placeholder="Separate names with commas"
                    onChange={(event) => setFeaturedArtists(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <Label htmlFor="song-genre">Genre</Label>
                  <Input
                    id="song-genre"
                    className="mt-2"
                    value={genre}
                    maxLength={60}
                    onChange={(event) => setGenre(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="release-date">Release date</Label>
                  <Input
                    id="release-date"
                    className="mt-2"
                    type="date"
                    value={releaseDate}
                    onChange={(event) => setReleaseDate(event.target.value)}
                  />
                </div>
                <div>
                  <Label>Publishing status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as ContentStatus)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="song-description">Description</Label>
                <Textarea
                  id="song-description"
                  className="mt-2 min-h-28"
                  value={description}
                  maxLength={1000}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-primary/25 bg-primary/5 p-6 md:p-8">
            <FileAudio className="h-7 w-7 text-primary" />
            <h2 className="mt-5 text-2xl font-semibold">Replace audio file</h2>
            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
              Upload a corrected or updated MP3 while keeping this song’s identity, cover, credits,
              playlist positions, and public playlist links.
            </p>
            <div className="mt-5 rounded-2xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
              Replacing the audio updates this song everywhere it appears on VYBE. The previous file
              is removed only after the replacement succeeds.
            </div>
            <Label className="mt-5 inline-flex cursor-pointer items-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">
              {replaceAudio.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileAudio className="mr-2 h-4 w-4" />
              )}
              Choose replacement MP3
              <input
                type="file"
                accept="audio/mpeg,audio/mp3"
                className="hidden"
                disabled={replaceAudio.isPending}
                onChange={(event) => {
                  void uploadAudio(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </Label>
          </section>

          <div className="flex flex-col-reverse justify-between gap-4 sm:flex-row">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete song
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete “{track.title}”?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the audio, cover art, and song from every playlist
                    containing it. Use Replace audio when correcting an existing song.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground"
                    onClick={() => void deleteSong()}
                  >
                    Delete song
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={setLead.isPending}
                onClick={async () => {
                  try {
                    await setLead.mutateAsync(track.is_featured ? null : track.id);
                    toast.success(
                      track.is_featured ? "Profile lead cleared." : "Profile lead updated.",
                    );
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not update lead");
                  }
                }}
              >
                <Star className="mr-2 h-4 w-4" />
                {track.is_featured ? "Clear profile lead" : "Set as profile lead"}
              </Button>
              <Button
                size="lg"
                disabled={update.isPending}
                className="bg-gradient-brand text-primary-foreground"
              >
                {update.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save song
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
