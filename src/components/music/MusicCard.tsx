import { Play, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDuration, type Track } from "@/features/music/schema";

interface Props {
  track: Track;
  onPlay?: (track: Track) => void;
  className?: string;
}

export function MusicCard({ track, onPlay, className }: Props) {
  const cover = track.cover_url || "/banners/default-creator-banner.png";
  return (
    <Card className={cn("group overflow-hidden border-border/50 transition hover:border-primary/40", className)}>
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <img src={cover} alt={track.title} className="h-full w-full object-cover" />
        {onPlay && (
          <button
            type="button"
            onClick={() => onPlay(track)}
            className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 transition group-hover:opacity-100"
            aria-label={`Play ${track.title}`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand shadow-glow">
              <Play className="h-5 w-5 text-primary-foreground" />
            </span>
          </button>
        )}
        {track.is_featured && (
          <Badge className="absolute left-2 top-2 gap-1 bg-gradient-brand text-primary-foreground">
            <Star className="h-3 w-3" /> Featured
          </Badge>
        )}
        <Badge
          variant={track.status === "published" ? "default" : "outline"}
          className="absolute right-2 top-2 capitalize"
        >
          {track.status}
        </Badge>
      </div>
      <CardContent className="space-y-1 p-4">
        <h3 className="line-clamp-1 font-semibold">{track.title}</h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{track.genre || "—"}</span>
          <span>{formatDuration(track.duration_sec)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
