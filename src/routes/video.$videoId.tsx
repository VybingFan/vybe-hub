import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Share2 } from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePublicVideo } from "@/hooks/useVideos";
import { VIDEO_TYPES } from "@/features/video/schema";
import { videoEmbedUrl } from "@/services/video/videoService";

export const Route = createFileRoute("/video/$videoId")({ component: PublicVideoPage });

function PublicVideoPage() {
  const { videoId } = Route.useParams();
  const { data: video, isLoading } = usePublicVideo(videoId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!video) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-3xl font-semibold">This video is not available.</h1>
        <Button asChild>
          <Link to="/experience/watch">Explore Watch on VYBE</Link>
        </Button>
      </div>
    );
  }

  const typeLabel = VIDEO_TYPES.find((type) => type.value === video.video_type)?.label || "Video";
  const share = () =>
    navigator.share
      ? navigator.share({ title: video.title, url: window.location.href })
      : navigator.clipboard.writeText(window.location.href);

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Button asChild variant="ghost" className="-ml-3">
          <Link to="/experience/watch">
            <ArrowLeft />
            Watch on VYBE
          </Link>
        </Button>
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-black shadow-elevated sm:rounded-3xl">
          <div className="aspect-video">
            <iframe
              src={videoEmbedUrl(video)}
              title={video.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="outline">{typeLabel}</Badge>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{video.title}</h1>
            {video.description && (
              <p className="mt-4 max-w-3xl whitespace-pre-line leading-7 text-muted-foreground">
                {video.description}
              </p>
            )}
          </div>
          <Button type="button" variant="outline" onClick={share}>
            <Share2 />
            Share video
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
