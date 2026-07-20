import { FormEvent, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, ListMusic, Loader2, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/useUser";
import { useCreatorTracks } from "@/hooks/useMusic";
import { useCreatePlaylist, useMyPlaylists } from "@/hooks/usePlaylists";
import { formatDuration } from "@/features/music/schema";
import { PLAYLIST_PURPOSES } from "@/features/playlists/schema";
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
  const { data: creatorProfile } = useCreatorProfile(user?.id);
  const { data: playlists = [] } = useMyPlaylists(user?.id);
  const create = useCreatePlaylist(user?.id);
  const [selected, setSelected] = useState<string[]>([]);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const published = useMemo(() => tracks.filter((track) => track.status === "published"), [tracks]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!selected.length) return toast.error("Choose at least one published song.");
    try {
      const playlist = await create.mutateAsync({
        title: String(form.get("title") || ""),
        description: String(form.get("description") || ""),
        occasion: String(form.get("occasion") || ""),
        trackIds: selected,
      });
      setCreatedSlug(playlist.slug);
      setSelected([]);
      event.currentTarget.reset();
      toast.success("Playlist published. Your share link is ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create playlist");
    }
  };
  const playlistPath = (slug: string) =>
    creatorProfile?.username
      ? `/artist/${creatorProfile.username}/playlist/${slug}`
      : `/playlist/${slug}`;
  const copy = async (slug: string) => {
    const url = `${window.location.origin}${playlistPath(slug)}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied");
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
            <p className="mt-1 break-all text-sm text-muted-foreground">{`${typeof window !== "undefined" ? window.location.origin : ""}${playlistPath(createdSlug)}`}</p>
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
              <div className="mt-2 max-h-80 space-y-2 overflow-auto rounded-2xl border border-border p-2">
                {isLoading ? (
                  <Loader2 className="m-6 animate-spin" />
                ) : published.length ? (
                  published.map((track) => {
                    const checked = selected.includes(track.id);
                    return (
                      <label
                        key={track.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl p-3 hover:bg-white/5"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            setSelected((current) =>
                              value
                                ? [...current, track.id]
                                : current.filter((id) => id !== track.id),
                            )
                          }
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{track.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {track.genre || "No genre"}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(track.duration_sec)}
                        </span>
                      </label>
                    );
                  })
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
              disabled={create.isPending || !published.length}
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
          <h2 className="text-2xl font-semibold">Your shared playlists</h2>
          <div className="mt-5 space-y-3">
            {playlists.length ? (
              playlists.map((playlist) => (
                <article key={playlist.id} className="rounded-2xl border border-border bg-card p-5">
                  <p className="font-semibold">{playlist.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {playlist.occasion || "Shared listening experience"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => copy(playlist.slug)}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy link
                  </Button>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-7 text-center text-muted-foreground">
                Your first shareable playlist will appear here.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
