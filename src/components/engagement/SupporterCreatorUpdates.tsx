import { Bell, CalendarDays, ChevronRight, Radio } from "lucide-react";
import { useSupporterCreatorNotifications } from "@/hooks/useSupporterNotifications";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "V";
}

function kindLabel(kind: unknown) {
  const value = typeof kind === "string" ? kind : "update";
  const labels: Record<string, string> = {
    show: "show",
    appearance: "appearance",
    festival: "festival",
    screening: "screening",
    podcast: "podcast",
    workshop: "workshop",
    meet_greet: "meet & greet",
    livestream: "livestream",
    release: "release",
    promotion: "promotion",
    announcement: "announcement",
    other: "update",
  };
  return labels[value] || "update";
}

export function SupporterCreatorUpdates() {
  const { data: items = [], isLoading, isError } = useSupporterCreatorNotifications();

  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10 sm:rounded-xl">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary sm:text-xs sm:tracking-[.2em]">
            From your creators
          </p>
          <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Updates from people you follow</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Published announcements, events, releases, screenings, livestreams, and other updates from creators you follow appear here.
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-4 text-sm text-muted-foreground">Checking your creators...</CardContent></Card>
      ) : null}

      {isError ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Creator updates are not available yet. Once the supporter notification migration is active, updates from followed creators will appear here.
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && !items.length ? (
        <Card className="border-dashed">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm font-medium">Nothing new from your creators yet.</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
              Follow creators and their published VYBE updates will collect here, including current updates that were already live when you followed them.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && items.length ? (
        <div className="grid gap-2.5 sm:gap-3">
          {items.slice(0, 12).map((item) => {
            const title = typeof item.payload?.title === "string" ? item.payload.title : "New creator update";
            const description = typeof item.payload?.description === "string" ? item.payload.description : "";
            const startsAt = typeof item.payload?.starts_at === "string" ? item.payload.starts_at : "";
            const href = `/creator-update/${item.entity_id || item.id}`;
            return (
              <a
                key={item.id}
                href={href}

                className="group flex min-w-0 items-start gap-3 rounded-xl border bg-card p-3 transition hover:border-primary/40 sm:rounded-2xl sm:p-4"
              >
                <Avatar className="h-10 w-10 shrink-0 sm:h-12 sm:w-12">
                  {item.signed_avatar_url ? <AvatarImage src={item.signed_avatar_url} alt="" /> : null}
                  <AvatarFallback>{initials(item.creator_display_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-semibold">{item.creator_display_name}</p>

                  </div>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.12em] text-primary sm:text-xs">
                    New {kindLabel(item.payload?.kind)}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm font-medium">{title}</p>
                  {description ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground sm:text-sm">{description}</p> : null}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground sm:text-xs">
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                    {startsAt ? (
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(startsAt).toLocaleString()}</span>
                    ) : null}
                  </div>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
              </a>
            );
          })}
        </div>
      ) : null}

      {!isLoading && !isError && items.length > 12 ? (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Radio className="h-3.5 w-3.5" /> Showing the 12 newest creator updates.
        </p>
      ) : null}
    </section>
  );
}
