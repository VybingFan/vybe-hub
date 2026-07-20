import type { ChangeEvent } from "react";
import { ImagePlus, Play, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDuration, type Track } from "@/features/music/schema";

interface Props {
  track: Track;
  onPlay?: (track: Track) => void;
  onCoverChange?: (track: Track, file: File) => void;
  coverPending?: boolean;
  className?: string;
}

export function MusicCard({ track, onPlay, onCoverChange, coverPending, className }: Props) {
  const cover = track.cover_url || "/banners/default-creator-banner.png";
  const chooseCover = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onCoverChange?.(track, file);
    event.target.value = "";
  };
  return (
    <Card
      className={cn(
        "group overflow-hidden border-border/50 transition hover:border-primary/40",
        className,
      )}
    >
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
            <Star className="h-3 w-3" /> Profile lead
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
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {track.primary_artist_name || "Artist not credited"}
          {track.featured_artist_names?.length
            ? ` feat. ${track.featured_artist_names.join(", ")}`
            : ""}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{track.genre || "—"}</span>
          <span>{formatDuration(track.duration_sec)}</span>
        </div>
        {onCoverChange && (
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium transition hover:border-primary/60 hover:text-primary">
            <ImagePlus className="h-4 w-4" />
            {coverPending ? "Saving cover…" : track.cover_url ? "Replace cover" : "Add cover art"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={coverPending}
              onChange={chooseCover}
            />
          </label>
        )}
      </CardContent>
    </Card>
  );
}
