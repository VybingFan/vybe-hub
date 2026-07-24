import { createFileRoute } from "@tanstack/react-router";
import { Eye, Headphones, Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { useMyActivity } from "@/hooks/useActivity";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/_authenticated/activity")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <ActivityPage />
    </RoleGuard>
  ),
});

function ActivityPage() {
  const { user } = useUser();
  const { data: activity = [], isLoading } = useMyActivity(user?.id);
  if (isLoading)
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  const opens = activity.filter((item) => item.event_type === "link_opened").length;
  const plays = activity.filter((item) => item.event_type === "playback_started").length;
  const playlists = new Map<string, { title: string; opens: number; plays: number }>();
  activity.forEach((item) => {
    const row = playlists.get(item.playlist_id) || {
      title: item.playlists?.title || "Shared playlist",
      opens: 0,
      plays: 0,
    };
    if (item.event_type === "link_opened") row.opens += 1;
    else row.plays += 1;
    playlists.set(item.playlist_id, row);
  });
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">
          Creator insights
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Activity</h1>
        <p className="mt-3 text-muted-foreground">
          See anonymous engagement with your shared playlist experiences. Current totals cover the
          latest 250 events.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Eye className="h-8 w-8 text-cyan-400" />
            <div>
              <p className="text-3xl font-semibold">{opens}</p>
              <p className="text-sm text-muted-foreground">Playlist links opened</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Headphones className="h-8 w-8 text-fuchsia-400" />
            <div>
              <p className="text-3xl font-semibold">{plays}</p>
              <p className="text-sm text-muted-foreground">Track playbacks started</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <section>
        <h2 className="text-2xl font-semibold">By playlist</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          {[...playlists.values()].map((playlist) => (
            <div
              key={playlist.title}
              className="grid gap-2 border-b border-border px-4 py-4 last:border-0 sm:grid-cols-[1fr_auto_auto] sm:gap-5 sm:px-5"
            >
              <span className="font-medium">{playlist.title}</span>
              <div className="flex gap-4 sm:contents">
                <span className="text-sm text-muted-foreground">{playlist.opens} opens</span>
                <span className="text-sm text-muted-foreground">{playlist.plays} plays</span>
              </div>
            </div>
          ))}
          {!playlists.size && (
            <p className="p-8 text-center text-muted-foreground">
              Share a playlist to begin collecting activity.
            </p>
          )}
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-semibold">Recent activity</h2>
        <div className="mt-4 space-y-2">
          {activity.slice(0, 50).map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <p className="font-medium">
                    {item.event_type === "link_opened"
                      ? "Playlist link opened"
                      : "Track playback started"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.tracks?.title ? `${item.tracks.title} • ` : ""}
                    {item.playlists?.title || "Shared playlist"}
                  </p>
                </div>
                <time className="text-xs text-muted-foreground sm:shrink-0">
                  {new Date(item.created_at).toLocaleString()}
                </time>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
