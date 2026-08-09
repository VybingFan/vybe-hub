import { ExternalLink, MapPin, Music2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CreatorProfile } from "@/features/profile/schema";

interface Props {
  profile: Partial<CreatorProfile>;
  email?: string | null;
  isEditing: boolean;
  onEditToggle: () => void;
  publicUrl?: string | null;
}

export function ProfileHeader({
  profile,
  email,
  isEditing,
  onEditToggle,
  publicUrl,
}: Props) {
  const name =
    profile.artist_name || profile.display_name || "Your artist name";
  const cover = profile.cover_url || "/banners/default-creator-banner.png";
  const avatar = profile.avatar_url || "/avatars/default-avatar.png";
  const genres = profile.genres?.length
    ? profile.genres
    : profile.genre
      ? [profile.genre]
      : [];

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="relative h-28 w-full sm:h-36">
        <img src={cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>
      <div className="flex flex-col gap-4 px-4 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-end gap-3">
          <Avatar className="-mt-10 h-20 w-20 shrink-0 border-4 border-background shadow-elevated sm:h-24 sm:w-24">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-gradient-brand text-primary-foreground">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 pb-1">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {name}
            </h1>
            {profile.display_name &&
            profile.display_name !== profile.artist_name ? (
              <p className="truncate text-sm text-muted-foreground">
                {profile.display_name}
              </p>
            ) : null}
            {email ? (
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {genres.slice(0, 3).map((genre) => (
                <Badge key={genre} variant="outline" className="gap-1">
                  <Music2 className="h-3 w-3" />
                  {genre}
                </Badge>
              ))}
              {profile.location ? (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {profile.location}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {publicUrl ? (
            <Button asChild variant="outline" size="sm">
              <a href={publicUrl} target="_blank" rel="noreferrer">
                View public page
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          ) : null}
          <Button
            size="sm"
            variant={isEditing ? "outline" : "default"}
            onClick={onEditToggle}
          >
            {isEditing ? "Cancel" : "Edit profile"}
          </Button>
        </div>
      </div>
    </section>
  );
}
