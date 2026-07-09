import { MapPin, Music2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CreatorProfile } from "@/features/profile/schema";

interface Props {
  profile: Partial<CreatorProfile>;
  email?: string | null;
  isEditing: boolean;
  onEditToggle: () => void;
}

export function ProfileHeader({ profile, email, isEditing, onEditToggle }: Props) {
  const name = profile.artist_name || profile.display_name || "Your artist name";
  const cover = profile.cover_url || "/banners/default-creator-banner.png";
  const avatar = profile.avatar_url || "/avatars/default-avatar.png";

  return (
    <Card className="overflow-hidden border-border/50">
      <div className="relative h-48 w-full md:h-64">
        <img src={cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
      </div>
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <Avatar className="-mt-16 h-24 w-24 border-4 border-background shadow-elevated md:h-28 md:w-28">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-gradient-brand text-primary-foreground">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{name}</h1>
              {profile.display_name && profile.display_name !== profile.artist_name && (
                <p className="text-sm text-muted-foreground">{profile.display_name}</p>
              )}
              {email && <p className="text-xs text-muted-foreground">{email}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {profile.genre && (
                <Badge variant="outline" className="gap-1">
                  <Music2 className="h-3 w-3" /> {profile.genre}
                </Badge>
              )}
              {profile.location && (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" /> {profile.location}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={onEditToggle}
          className={isEditing ? "" : "bg-gradient-brand text-primary-foreground shadow-glow"}
        >
          {isEditing ? "Cancel" : "Edit profile"}
        </Button>
      </CardContent>
    </Card>
  );
}
