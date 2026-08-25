import { ChevronRight, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useFollowedCreators } from "@/hooks/useSupporterNotifications";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "V";
}

export function SupporterFollowingCreators() {
  const { data: creators = [], isLoading, isError } = useFollowedCreators();

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Heart className="h-4 w-4 text-primary" />
        <div>
          <h2 className="text-lg font-semibold sm:text-xl">Creators you follow</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">Your direct VYBE connection to creators you chose to keep up with.</p>
        </div>
      </div>

      {isLoading ? <Card><CardContent className="p-4 text-sm text-muted-foreground">Loading who you follow...</CardContent></Card> : null}
      {isError ? <Card className="border-dashed"><CardContent className="p-4 text-sm text-muted-foreground">Your following list is not available yet.</CardContent></Card> : null}

      {!isLoading && !isError && !creators.length ? (
        <Card className="border-dashed"><CardContent className="p-4"><p className="text-sm font-medium">You are not following any creators yet.</p><a href="/explore" className="mt-2 inline-flex text-sm font-medium text-primary hover:underline">Discover creators</a></CardContent></Card>
      ) : null}

      {!isLoading && !isError && creators.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {creators.map((creator) => (
            <a key={creator.creator_user_id} href={creator.creator_username ? `/creator/${creator.creator_username}` : "/explore"} className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition hover:border-primary/40">
              <Avatar className="h-10 w-10 shrink-0">
                {creator.signed_avatar_url ? <AvatarImage src={creator.signed_avatar_url} alt="" /> : null}
                <AvatarFallback>{initials(creator.creator_display_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{creator.creator_display_name}</p>
                {creator.creator_username ? <p className="truncate text-xs text-muted-foreground">@{creator.creator_username}</p> : null}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}
