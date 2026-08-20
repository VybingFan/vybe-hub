import { useState } from "react";
import { Heart, MessageCircle, Repeat2, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCreatorEngagementDetails } from "@/hooks/useCreatorEngagement";
import type { CreatorEngagementKind } from "@/services/engagement/creatorEngagementService";

const labels: Record<CreatorEngagementKind, string> = {
  followers: "Followers",
  likes: "Likes",
  saves: "Saves",
  comments: "Comments",
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "V";
}

export function CreatorEngagementPanel({
  days,
  social,
}: {
  days: number;
  social: Record<string, number>;
}) {
  const [active, setActive] = useState<CreatorEngagementKind>("comments");
  const { data, isLoading } = useCreatorEngagementDetails(days);
  const cards = [
    ["followers", social.followers || 0, UserPlus],
    ["likes", social.likes || 0, Heart],
    ["saves", social.saves || 0, Repeat2],
    ["comments", social.comments || 0, MessageCircle],
  ] as const;
  const items = data?.[active] || [];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([key, value, Icon]) => (
          <button
            key={key}
            type="button"
            className="text-left"
            onClick={() => setActive(key)}
            aria-pressed={active === key}
          >
            <Card className={cn("h-full transition hover:border-primary/50", active === key && "border-primary ring-1 ring-primary/20")}>
              <CardContent className="flex items-center gap-4 p-5">
                <Icon className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-3xl font-semibold">{value}</p>
                  <p className="text-sm text-muted-foreground">{labels[key]}</p>
                  <p className="mt-1 text-xs text-primary">View details</p>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-semibold">{labels[active]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Supporter activity during this Insights reporting period.
            </p>
          </div>

          <div className="mt-5 max-h-[30rem] space-y-3 overflow-y-auto pr-1">
            {isLoading ? <p className="text-sm text-muted-foreground">Loading engagement…</p> : null}
            {!isLoading && !items.length ? (
              <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                No {labels[active].toLowerCase()} in this reporting period.
              </p>
            ) : null}
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-xl border p-4">
                <Avatar className="h-10 w-10 shrink-0">
                  {(item.signed_avatar_url || item.avatar_url) ? (
                    <AvatarImage src={item.signed_avatar_url || item.avatar_url || undefined} />
                  ) : null}
                  <AvatarFallback>{initials(item.display_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold">{item.display_name}</span>
                    {item.username ? <span className="text-xs text-muted-foreground">@{item.username}</span> : null}
                    <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  {item.track_title ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {active === "likes" ? "Liked" : "Saved"} <span className="font-medium text-foreground">{item.track_title}</span>
                      {item.list_name ? ` to ${item.list_name}` : ""}
                    </p>
                  ) : null}
                  {item.body ? <p className="mt-2 whitespace-pre-wrap text-sm">{item.body}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
