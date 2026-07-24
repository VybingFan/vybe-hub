import { createFileRoute, Link } from "@tanstack/react-router";
import { Clapperboard, Film, Loader2, Plus } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VIDEO_TYPES } from "@/features/video/schema";
import { usePublishedVideos } from "@/hooks/useVideos";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/_authenticated/watch")({ component: WatchPage });

function WatchPage() {
  return (
    <RoleGuard allow={["supporter", "creator", "admin"]}>
      <WatchLibrary />
    </RoleGuard>
  );
}

function WatchLibrary() {
  const { hasAnyRole } = useUser();
  const { data: videos = [], isLoading } = usePublishedVideos();
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-rose-400">
            Watch on VYBE
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            Independent vision has a screen.
          </h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Music videos, performances, interviews, trailers, short films, and stories from VYBE
            creators.
          </p>
        </div>
        {hasAnyRole(["creator", "admin"]) && (
          <Button asChild className="bg-gradient-brand text-white">
            <Link to="/videos">
              <Plus />
              Add your video
            </Link>
          </Button>
        )}
      </header>
      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : videos.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Link
              key={video.id}
              to="/video/$videoId"
              params={{ videoId: video.id }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-rose-400/50"
            >
              <div className="aspect-video overflow-hidden bg-muted">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-rose-500/20 to-violet-500/20">
                    <Film className="h-12 w-12 text-rose-300" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <Badge variant="outline">
                  {VIDEO_TYPES.find((type) => type.value === video.video_type)?.label || "Video"}
                </Badge>
                <h2 className="mt-3 line-clamp-2 text-lg font-semibold">{video.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {video.description || "Watch this creator video on VYBE."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <Clapperboard className="mx-auto h-10 w-10 text-rose-400" />
          <h2 className="mt-4 text-xl font-semibold">The VYBE screen is ready.</h2>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
            Published creator videos will appear here as the first visual releases arrive.
          </p>
        </div>
      )}
    </div>
  );
}
