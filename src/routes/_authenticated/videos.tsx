import { FormEvent, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clapperboard,
  CloudUpload,
  Copy,
  ExternalLink,
  FileVideo2,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { CreatorCapabilityGuard } from "@/components/membership/CreatorCapabilityGuard";
import { VideoEditor } from "@/components/video/VideoEditor";
import { NativeVideoProcessingMonitor } from "@/components/video/NativeVideoProcessingMonitor";
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
  useCreateNativeVideo,
  useDeleteVideo,
  useMyVideos,
  useSetVideoPublished,
} from "@/hooks/useVideos";
import { useUser } from "@/hooks/useUser";
import { videoEmbedUrl } from "@/services/video/videoService";
import { supabase } from "@/integrations/supabase/client";

const MAX_DIRECT_UPLOAD_BYTES = 200 * 1024 * 1024;

export const Route = createFileRoute("/_authenticated/videos")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <CreatorCapabilityGuard capability="video.library" requiredPlan="creator_plus" educationKey="video_library" title="Video Library requires Creator Plus" description="Creator Free keeps its established music and profile benefits. Video publishing begins with Creator Plus.">
        <VideoStudio />
      </CreatorCapabilityGuard>
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
  const [repairingPlayback, setRepairingPlayback] = useState(false);

  const repairPlayback = async () => {
    setRepairingPlayback(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Sign in again before repairing playback.");

      const response = await fetch("/api/video-upload-url", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = (await response.json()) as {
        repaired?: number;
        total?: number;
        failures?: Array<{ message?: string }>;
        error?: string;
      };
      if (!response.ok && response.status !== 207) {
        throw new Error(result.error || "Could not repair Cloudflare playback access.");
      }
      if (result.failures?.length) {
        toast.warning(`Repaired ${result.repaired || 0} of ${result.total || 0} uploaded videos.`);
      } else {
        toast.success(`Playback access repaired for ${result.repaired || 0} uploaded videos.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not repair Cloudflare playback access.");
    } finally {
      setRepairingPlayback(false);
    }
  };

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
    <div className="mx-auto max-w-7xl space-y-8 min-[900px]:space-y-5">
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
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start min-[900px]:gap-3 min-[900px]:p-4">
          <CloudUpload className="h-6 w-6 shrink-0 text-cyan-400" />
          <div>
            <p className="font-semibold">Upload from your computer or phone gallery</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground min-[900px]:leading-5">
              Cloudflare Stream is connected. Native uploads are securely encoded for reliable
              playback while VYBE keeps platform credentials protected server-side.
            </p>
          </div>
        </CardContent>
      </Card>

      <NativeUploadCard creatorId={user?.id} />
      <NativeVideoProcessingMonitor creatorId={user?.id} videos={videos} />

      <div className="space-y-8 min-[900px]:space-y-5">
        <form
          onSubmit={submit}
          className="space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-6 min-[900px]:space-y-4 min-[900px]:p-4 min-[900px]:mx-0"
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
              className="mt-2 min-h-28 min-[900px]:min-h-20"
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
            {create.isPending ? "Saving video..." : "Add to Video Library"}
          </Button>
        </form>

        <section className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Your videos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {videos.length} {videos.length === 1 ? "video" : "videos"}
              </p>
            </div>
            {videos.some((video) => video.provider === "cloudflare_stream") ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={repairingPlayback}
                onClick={() => void repairPlayback()}
              >
                {repairingPlayback ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                {repairingPlayback ? "Repairing playback..." : "Repair uploaded video playback"}
              </Button>
            ) : null}
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 min-[900px]:mt-4 min-[900px]:gap-4 min-[1280px]:grid-cols-3">
            {videos.map((video) => (
              <article
                key={video.id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="aspect-video bg-black">
                  {video.provider === "cloudflare_stream" && video.status === "processing" ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white">
                      <Loader2 className="h-7 w-7 animate-spin text-cyan-300" />
                      <div>
                        <p className="font-semibold">Processing video...</p>
                        <p className="mt-1 text-xs text-white/70">
                          Cloudflare Stream is preparing this video for playback.
                        </p>
                      </div>
                    </div>
                  ) : video.provider === "cloudflare_stream" && video.status === "failed" ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-white">
                      <p className="font-semibold">Video processing failed</p>
                      <p className="text-xs text-white/70">
                        Try the upload again or choose another video file.
                      </p>
                    </div>
                  ) : (
                    <iframe
                      src={videoEmbedUrl(video)}
                      title={video.title}
                      className="h-full w-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
                <div className="p-4 min-[900px]:p-3 min-[1280px]:p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Badge variant={video.status === "published" ? "default" : "outline"}>
                        {video.status === "published"
                          ? "Published"
                          : video.status === "processing"
                            ? "Processing"
                            : video.status === "failed"
                              ? "Failed"
                              : "Draft"}
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
                  <div className="mt-4 grid gap-2 min-[420px]:grid-cols-2 sm:grid-cols-1 xl:grid-cols-2 min-[900px]:mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={video.status === "processing" || video.status === "failed"}
                      onClick={() =>
                        setPublished.mutate({
                          id: video.id,
                          published: video.status !== "published",
                        })
                      }
                    >
                      <CheckCircle2 />
                      {video.status === "published"
                        ? "Move to draft"
                        : video.status === "processing"
                          ? "Processing"
                          : video.status === "failed"
                            ? "Upload failed"
                            : "Publish"}
                    </Button>
                    {video.status === "published" ? (
                      <Button type="button" variant="outline" onClick={() => copyLink(video.id)}>
                        <Copy />
                        Copy link
                      </Button>
                    ) : video.source_url ? (
                      <Button asChild variant="outline">
                        <a href={video.source_url} target="_blank" rel="noreferrer noopener">
                          <ExternalLink />
                          Source
                        </a>
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" disabled>
                        Stream draft
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
                  {user?.id && <VideoEditor creatorId={user.id} video={video} />}
                </div>
              </article>
            ))}
            {!isLoading && !videos.length && (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground sm:col-span-2 min-[900px]:p-6 min-[1280px]:col-span-3">
                Your first video will appear here.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function NativeUploadCard({ creatorId }: { creatorId?: string }) {
  const createNative = useCreateNativeVideo(creatorId);
  const [file, setFile] = useState<File | null>(null);
  const [videoType, setVideoType] = useState<VideoType>("music_video");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!file) {
      toast.error("Choose a video from your computer or phone gallery.");
      return;
    }
    if (file.size > MAX_DIRECT_UPLOAD_BYTES) {
      toast.error("This first direct uploader accepts videos up to 200MB.");
      return;
    }
    if (!file.type.startsWith("video/")) {
      toast.error("Choose a video file.");
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Sign in again before uploading.");

      const prepare = await fetch("/api/video-upload-url", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
      });
      const prepared = (await prepare.json()) as {
        uploadURL?: string;
        uid?: string;
        error?: string;
      };
      if (!prepare.ok || !prepared.uploadURL || !prepared.uid) {
        throw new Error(prepared.error || "Could not prepare video upload.");
      }

      await uploadVideoFile(prepared.uploadURL, file, setProgress);
      await createNative.mutateAsync({
        title: String(data.get("native_title") || ""),
        description: String(data.get("native_description") || ""),
        videoType,
        streamUid: prepared.uid,
        rightsConfirmed: data.get("native_rights") === "on",
      });
      form.reset();
      setFile(null);
      setVideoType("music_video");
      setProgress(0);
      toast.success("Video uploaded as a draft. Publish it after processing completes.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload video");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-cyan-400/25 bg-card p-5 sm:p-6 min-[900px]:p-4">
      <div className="flex items-start gap-3">
        <Upload className="mt-1 h-6 w-6 shrink-0 text-cyan-400" />
        <div>
          <h2 className="text-xl font-semibold">Upload a video from your device</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a video from a computer, tablet, or phone gallery. The initial direct uploader
            supports files up to 200MB.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 min-[900px]:mt-4 min-[900px]:gap-3">
        <div>
          <Label htmlFor="native-title">Video title</Label>
          <Input id="native-title" name="native_title" required maxLength={160} className="mt-2" />
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
        <div className="md:col-span-2">
          <Label htmlFor="native-description">Description</Label>
          <Textarea
            id="native-description"
            name="native_description"
            maxLength={5000}
            className="mt-2"
          />
        </div>
        <label className="flex min-h-28 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border p-4 transition hover:border-cyan-400 md:col-span-2 min-[900px]:min-h-20 min-[900px]:p-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 min-[900px]:h-11 min-[900px]:w-11">
            <FileVideo2 className="h-7 w-7 text-cyan-400" />
          </span>
          <span className="min-w-0 text-sm">
            <strong className="block truncate">{file ? `Video selected: ${file.name}` : "1. Select a video"}</strong>
            <span className="mt-1 block text-muted-foreground">
              MP4, MOV, or WebM | Maximum 200MB
            </span>
          </span>
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/*"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </label>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border p-3 md:col-span-2">
          <input name="native_rights" type="checkbox" required className="mt-1 h-4 w-4" />
          <span className="text-sm">
            I own this video or have permission to upload and publish it on VYBE.
          </span>
        </label>
      </div>
      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading video to VYBE</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-cyan-400 transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      <Button
        disabled={uploading || createNative.isPending}
        className="mt-5 w-full bg-gradient-brand text-white sm:w-auto min-[900px]:mt-4"
      >
        {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
        {uploading ? "Uploading video..." : "2. Upload video to VYBE"}
      </Button>
      <p className="mt-3 text-xs text-muted-foreground min-[900px]:mt-2">
        Videos upload directly to Cloudflare Stream using a secure one-time upload link, then
        appear in your VYBE library as drafts after processing completes.
      </p>
    </form>
  );
}

function uploadVideoFile(uploadURL: string, file: File, onProgress: (progress: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", uploadURL);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new Error("The video upload was interrupted."));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error("Cloudflare could not receive this video."));
    };
    const body = new FormData();
    body.append("file", file);
    request.send(body);
  });
}
