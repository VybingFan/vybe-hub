import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Clapperboard,
  ExternalLink,
  Film,
  Link2,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PlaylistAccessMode } from "@/features/playlists/schema";
import {
  FILM_PLAYLIST_PURPOSES,
  type PlaylistItemInput,
} from "@/features/playlists/mixedMedia";
import { useUser } from "@/hooks/useUser";
import { filmPlaylistService } from "@/services/playlists/filmPlaylistService";

export const Route = createFileRoute("/_authenticated/film-playlists")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <FilmPlaylistWorkspace />
    </RoleGuard>
  ),
});

type DraftItem = PlaylistItemInput & { clientId: string; label: string };

const ACCESS_LABELS: Record<PlaylistAccessMode, string> = {
  public: "Public when sharing activates",
  unlisted: "Unlisted link",
  password: "Password protected",
  approved_listeners: "Approved viewers",
  membership_only: "Membership only",
};

function FilmPlaylistWorkspace() {
  const { user } = useUser();
  const creatorId = user?.id;
  const queryClient = useQueryClient();
  const [purpose, setPurpose] = useState<(typeof FILM_PLAYLIST_PURPOSES)[number]>(
    "Trailer playlist",
  );
  const [accessMode, setAccessMode] = useState<PlaylistAccessMode>("public");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [watchUrl, setWatchUrl] = useState("");
  const [watchLabel, setWatchLabel] = useState("");

  const setup = useQuery({
    queryKey: ["film-creator-setup", creatorId],
    queryFn: () => filmPlaylistService.getSetup(creatorId!),
    enabled: !!creatorId,
  });
  const videos = useQuery({
    queryKey: ["film-playlist-videos", creatorId],
    queryFn: () => filmPlaylistService.listVideos(creatorId!),
    enabled: !!creatorId,
  });
  const playlists = useQuery({
    queryKey: ["film-playlists", creatorId],
    queryFn: () => filmPlaylistService.list(creatorId!),
    enabled: !!creatorId,
  });

  const create = useMutation({
    mutationFn: (input: Parameters<typeof filmPlaylistService.create>[1]) =>
      filmPlaylistService.create(creatorId!, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["film-playlists", creatorId] });
      setItems([]);
      toast.success("Film playlist draft created.");
    },
  });

  const remove = useMutation({
    mutationFn: (playlistId: string) => filmPlaylistService.remove(creatorId!, playlistId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["film-playlists", creatorId] });
      toast.success("Film playlist removed. Videos remain in your library.");
    },
  });

  const selectedVideoIds = useMemo(
    () => new Set(items.flatMap((item) => (item.video_id ? [item.video_id] : []))),
    [items],
  );
  const effectivePlan = setup.data?.planCode === "founding_beta" ? "creator_pro" : setup.data?.planCode || "creator_free";
  const canUsePassword = ["creator_plus", "creator_pro", "creator_studio"].includes(effectivePlan);
  const canUseApprovedViewers = ["creator_pro", "creator_studio"].includes(effectivePlan);

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    setItems((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const addVideo = (videoId: string) => {
    const video = videos.data?.find((item) => item.id === videoId);
    if (!video || selectedVideoIds.has(video.id)) return;
    setItems((current) => [
      ...current,
      {
        clientId: crypto.randomUUID(),
        item_kind: "video",
        video_id: video.id,
        label: video.title,
        creator_note: "",
        allow_download: false,
      },
    ]);
  };

  const addWatchLink = () => {
    try {
      const url = new URL(watchUrl);
      if (url.protocol !== "https:") throw new Error();
    } catch {
      toast.error("Enter a complete HTTPS Watch link.");
      return;
    }
    setItems((current) => [
      ...current,
      {
        clientId: crypto.randomUUID(),
        item_kind: "external_watch",
        external_url: watchUrl.trim(),
        external_label: watchLabel.trim() || "Watch this project",
        label: watchLabel.trim() || "Watch this project",
        creator_note: "",
        allow_download: false,
      },
    ]);
    setWatchUrl("");
    setWatchLabel("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!items.length) {
      toast.error("Add at least one trailer, scene, or Watch link.");
      return;
    }
    try {
      await create.mutateAsync({
        title: String(data.get("title") || ""),
        description: String(data.get("description") || ""),
        purpose,
        accessMode,
        workspaceCategory:
          purpose === "Scene review" || purpose === "Rough cut review"
            ? "work_in_progress"
            : purpose === "Music match list"
              ? "collaboration"
              : "released",
        items: items.map(({ clientId: _clientId, label: _label, ...item }) => item),
      });
      form.reset();
      setPurpose("Trailer playlist");
      setAccessMode("public");
    } catch (error) {
      const message = error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "Could not create film playlist";
      toast.error(message);
    }
  };

  if (setup.isLoading || videos.isLoading || playlists.isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Creator Studio</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Film Playlist Studio</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Arrange trailers, finished or unfinished scenes, and authorized Watch links into the same controlled playlist concept used across VYBE.
        </p>
      </header>

      <Card className="border-primary/25 bg-primary/5">
        <CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{setup.data?.planName}</Badge>
              <Badge variant="outline">{setup.data?.allowance?.public_identity_label || "Film Creator"}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Your membership price remains the same. Film features and usage are measured separately. Private hosted scenes, screeners, rentals, and purchases remain disabled during this foundation phase.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/creator-focuses">Manage creator focuses</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-7 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
        <form onSubmit={submit} className="space-y-5 rounded-3xl border bg-card p-5 sm:p-6">
          <div><h2 className="text-xl font-semibold">Create a film playlist</h2><p className="mt-1 text-sm text-muted-foreground">This release saves drafts. Sharing activates after the secure mixed-media viewer is installed.</p></div>
          <div><Label htmlFor="film-playlist-title">Title</Label><Input id="film-playlist-title" name="title" required maxLength={160} className="mt-2" placeholder="Festival trailer collection" /></div>
          <div><Label>Purpose</Label><Select value={purpose} onValueChange={(value) => setPurpose(value as typeof purpose)}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{FILM_PLAYLIST_PURPOSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
          <div>
            <Label>Intended access</Label>
            <Select value={accessMode} onValueChange={(value) => setAccessMode(value as PlaylistAccessMode)}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">{ACCESS_LABELS.public}</SelectItem>
                <SelectItem value="unlisted">{ACCESS_LABELS.unlisted}</SelectItem>
                <SelectItem value="password" disabled={!canUsePassword}>{ACCESS_LABELS.password}{!canUsePassword ? " · Plus required" : ""}</SelectItem>
                <SelectItem value="approved_listeners" disabled={!canUseApprovedViewers}>{ACCESS_LABELS.approved_listeners}{!canUseApprovedViewers ? " · Pro required" : ""}</SelectItem>
                <SelectItem value="membership_only" disabled={!canUseApprovedViewers}>{ACCESS_LABELS.membership_only}{!canUseApprovedViewers ? " · Pro required" : ""}</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">Free: public and unlisted · Plus: password links · Pro/Studio: approved viewers and sign-in controls</p>
          </div>
          <div><Label htmlFor="film-playlist-description">Description or creative brief</Label><Textarea id="film-playlist-description" name="description" maxLength={5000} className="mt-2 min-h-28" placeholder="Describe the collection, scene-review goal, or music direction." /></div>

          <div className="rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Add from Video Library</h3><p className="text-xs text-muted-foreground">Draft/private videos remain workspace-only in this phase.</p></div><Button asChild type="button" variant="outline" size="sm"><Link to="/videos"><Plus className="mr-2 h-4 w-4" />Add video</Link></Button></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(videos.data ?? []).map((video) => <button key={video.id} type="button" disabled={selectedVideoIds.has(video.id)} onClick={() => addVideo(video.id)} className="rounded-xl border p-3 text-left disabled:opacity-45"><span className="flex items-center gap-2"><Film className="h-4 w-4 text-primary" /><span className="line-clamp-1 font-medium">{video.title}</span></span><span className="mt-1 block text-xs capitalize text-muted-foreground">{video.video_type.replaceAll("_", " ")} · {video.status} · {video.visibility}</span></button>)}
              {!videos.data?.length ? <p className="text-sm text-muted-foreground">Add trailers or scenes to your Video Library first.</p> : null}
            </div>
          </div>

          <div className="rounded-2xl border p-4">
            <h3 className="font-semibold">Add an authorized Watch link</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2"><Input value={watchLabel} onChange={(event) => setWatchLabel(event.target.value)} placeholder="Watch on official site" /><Input type="url" value={watchUrl} onChange={(event) => setWatchUrl(event.target.value)} placeholder="https://..." /></div>
            <Button type="button" variant="outline" className="mt-2 w-full" onClick={addWatchLink}><Link2 className="mr-2 h-4 w-4" />Add Watch link</Button>
          </div>

          <div>
            <h3 className="font-semibold">Playlist order</h3>
            <div className="mt-3 space-y-2">{items.map((item, index) => <div key={item.clientId} className="flex items-center gap-2 rounded-xl border p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">{index + 1}</span><span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.label}</span><span className="text-xs capitalize text-muted-foreground">{item.item_kind.replaceAll("_", " ")}</span></span><Button type="button" size="icon" variant="ghost" onClick={() => move(index, -1)} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" onClick={() => move(index, 1)} disabled={index === items.length - 1}><ArrowDown className="h-4 w-4" /></Button><Button type="button" size="icon" variant="ghost" onClick={() => setItems((current) => current.filter((value) => value.clientId !== item.clientId))}><Trash2 className="h-4 w-4" /></Button></div>)}{!items.length ? <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">No items selected yet.</p> : null}</div>
          </div>
          <Button disabled={create.isPending} className="w-full bg-gradient-brand text-white">{create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clapperboard className="mr-2 h-4 w-4" />}Create film playlist draft</Button>
        </form>

        <section>
          <div className="flex items-end justify-between"><div><h2 className="text-2xl font-semibold">Film playlists</h2><p className="mt-1 text-sm text-muted-foreground">{playlists.data?.length || 0} workspace drafts</p></div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">{(playlists.data ?? []).map((playlist) => <Card key={playlist.id}><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><Badge variant="outline">Draft foundation</Badge><h3 className="mt-3 text-lg font-semibold">{playlist.title}</h3></div><Button type="button" size="icon" variant="ghost" onClick={() => remove.mutate(playlist.id)}><Trash2 className="h-4 w-4" /></Button></div><p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{playlist.description || playlist.occasion}</p><div className="mt-4 flex flex-wrap gap-2 text-xs"><Badge variant="secondary">{playlist.playlist_items.length} items</Badge><Badge variant="secondary">{ACCESS_LABELS[playlist.access_mode]}</Badge></div></CardContent></Card>)}{!playlists.data?.length ? <Card className="sm:col-span-2"><CardContent className="p-8 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-primary" /><h3 className="mt-3 font-semibold">Create the first film playlist</h3><p className="mt-2 text-sm text-muted-foreground">Start with public trailers, a scene-review sequence, or authorized links showing where finished projects can be watched.</p></CardContent></Card> : null}</div>
          <Card className="mt-5 border-amber-400/25 bg-amber-400/5"><CardContent className="flex gap-3 p-4"><ExternalLink className="h-5 w-5 shrink-0 text-amber-500" /><p className="text-sm text-muted-foreground">External YouTube, Vimeo, and Watch URLs can be forwarded outside VYBE. Do not treat external hosting as revocable confidential delivery.</p></CardContent></Card>
        </section>
      </div>
    </div>
  );
}
