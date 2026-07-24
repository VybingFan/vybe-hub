import { FormEvent, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clapperboard,
  CloudUpload,
  Copy,
  ExternalLink,
  Loader2,
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
import { VIDEO_TYPES, type VideoType } from "@/features/video/schema";
import {
  useCreateVideo,
  useDeleteVideo,
  useMyVideos,
  useSetVideoPublished,
} from "@/hooks/useVideos";
import { useUser } from "@/hooks/useUser";
import { videoEmbedUrl } from "@/services/video/videoService";

export const Route = createFileRoute("/_authenticated/videos")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <VideoStudio />
    </RoleGuard>
  ),
});

function VideoStudio() {
  const { user } = useUser();
  const { data: videos = [], isLoading } = useMyVideos(user?.id);
  const create = useCreateVideo(user?.id);
  const setPublished = useSetVideoPublished(user?.id);
  const remove = useDeleteVideo(user?.id);
  const [videoType, setVideoType] = useState<VideoType>("music_video");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await create.mutateAsync({
        title: String(data.get("title") || ""),
        description: String(data.get("description") || ""),
        videoType,
        sourceUrl: String(data.get("source_url") || ""),
        thumbnailUrl: String(data.get("thumbnail_url") || ""),
        publishNow: data.get("publish_now") === "on",
        rightsConfirmed: data.get("rights_confirmed") === "on",
      });
      form.reset();
      setVideoType("music_video");
      toast.success("Video added to your VYBE library");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add video");
    }
  };

  const copyLink = async (id: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/video/${id}`);
    toast.success("VYBE video link copied");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-rose-400">
          Creator Studio
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Video Library</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Publish music videos, performances, interviews, trailers, short films, and
          behind-the-scenes stories alongside your music.
        </p>
      </header>

      <Card className="border-cyan-400/25 bg-cyan-400/5">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          <CloudUpload className="h-6 w-6 shrink-0 text-cyan-400" />
          <div>
            <p className="font-semibold">Native VYBE uploads are infrastructure-ready</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              YouTube and Vimeo links work now. Direct uploads will activate after Cloudflare Stream
              is connected, providing secure encoding and mobile-quality playback without exposing
              platform credentials.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <form
          onSubmit={submit}
          className="space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-6"
        >
          <div>
            <h2 className="text-xl font-semibold">Add a hosted video</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste a public YouTube or Vimeo link. You can save a draft before publishing.
            </p>
          </div>
          <div>
            <Label htmlFor="video-title">Video title</Label>
            <Input id="video-title" name="title" required maxLength={160} className="mt-2" />
          </div>
          <div>
            <Label>Video type</Label>
            <Select value={videoType} onValueChange={(value) => setVideoType(value as VideoType)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="video-source">YouTube or Vimeo link</Label>
            <Input
              id="video-source"
              name="source_url"
              type="url"
              required
              className="mt-2"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div>
            <Label htmlFor="video-description">Description</Label>
            <Textarea
              id="video-description"
              name="description"
              maxLength={5000}
              className="mt-2 min-h-28"
              placeholder="Tell viewers about the video, production, cast, or release."
            />
          </div>
          <div>
            <Label htmlFor="video-thumbnail">Custom thumbnail URL (optional)</Label>
            <Input
              id="video-thumbnail"
              name="thumbnail_url"
              type="url"
              className="mt-2"
              placeholder="https://..."
            />
          </div>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border p-3">
            <input name="publish_now" type="checkbox" className="mt-1 h-4 w-4" />
            <span className="text-sm">
              <strong>Publish now</strong>
              <span className="mt-0.5 block text-muted-foreground">
                Otherwise, this video remains private in your library as a draft.
              </span>
            </span>
          </label>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border p-3">
            <input name="rights_confirmed" type="checkbox" required className="mt-1 h-4 w-4" />
            <span className="text-sm">
              I own this video or have permission to publish and embed it on VYBE.
            </span>
          </label>
          <Button disabled={create.isPending} className="w-full bg-gradient-brand text-white">
            {create.isPending ? <Loader2 className="animate-spin" /> : <Clapperboard />}
            {create.isPending ? "Saving video…" : "Add to Video Library"}
          </Button>
        </form>

        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Your videos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {videos.length} {videos.length === 1 ? "video" : "videos"}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {videos.map((video) => (
              <article
                key={video.id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="aspect-video bg-black">
                  <iframe
                    src={videoEmbedUrl(video)}
                    title={video.title}
                    className="h-full w-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Badge variant={video.status === "published" ? "default" : "outline"}>
                        {video.status === "published" ? "Published" : "Draft"}
                      </Badge>
                      <h3 className="mt-2 line-clamp-2 font-semibold">{video.title}</h3>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${video.title}`}
                      onClick={() => remove.mutate(video.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {video.description || "No description added."}
                  </p>
                  <div className="mt-4 grid gap-2 min-[420px]:grid-cols-2 sm:grid-cols-1 xl:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setPublished.mutate({
                          id: video.id,
                          published: video.status !== "published",
                        })
                      }
                    >
                      <CheckCircle2 />
                      {video.status === "published" ? "Move to draft" : "Publish"}
                    </Button>
                    {video.status === "published" ? (
                      <Button type="button" variant="outline" onClick={() => copyLink(video.id)}>
                        <Copy />
                        Copy link
                      </Button>
                    ) : (
                      <Button asChild variant="outline">
                        <a href={video.source_url || "#"} target="_blank" rel="noreferrer noopener">
                          <ExternalLink />
                          Source
                        </a>
                      </Button>
                    )}
                  </div>
                  {video.status === "published" && (
                    <Button asChild variant="ghost" className="mt-2 w-full">
                      <Link to="/video/$videoId" params={{ videoId: video.id }}>
                        Preview VYBE page
                      </Link>
                    </Button>
                  )}
                </div>
              </article>
            ))}
            {!isLoading && !videos.length && (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground sm:col-span-2">
                Your first video will appear here.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
