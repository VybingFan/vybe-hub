import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePublishedCreatorUpdates } from "@/hooks/useCreatorUpdates";
import { CREATOR_UPDATE_KINDS } from "@/features/creatorUpdates/schema";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
export function PublicCreatorUpdates({ creatorId, creatorName }: { creatorId: string; creatorName: string }) {
  const { data: items = [], isLoading } = usePublishedCreatorUpdates(creatorId);
  return (
    <section id="happening" className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-16 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[.2em] text-cyan-400">What&apos;s happening</p>
      <h2 className="mt-2 text-3xl font-semibold">Events & updates from {creatorName}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Shows, appearances, releases, promotions, announcements, and places to watch or learn more.</p>
      {isLoading ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading creator updates…</div>
      ) : items.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const kind = CREATOR_UPDATE_KINDS.find((entry) => entry.value === item.kind)?.label || "Update";
            const date = formatDate(item.starts_at);
            return (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                {item.image_url ? (
                  <a href={item.image_url} target="_blank" rel="noreferrer noopener" className="block overflow-hidden bg-muted" aria-label={`View ${item.title} flyer or image`}>
                    <img src={item.image_url} alt={`${item.title} flyer or promotional image`} className="aspect-[4/3] w-full object-cover transition duration-300 hover:scale-[1.02]" />
                  </a>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-cyan-500/15 to-violet-500/15"><CalendarDays className="h-12 w-12 text-cyan-300" /></div>
                )}
                <div className="p-5">
                  <Badge variant="outline">{kind}</Badge>
                  <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                  {date ? <p className="mt-2 text-sm font-medium text-cyan-300">{date}</p> : null}
                  {(item.location_name || item.location_address) ? (
                    <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{[item.location_name, item.location_address].filter(Boolean).join(" · ")}</span></p>
                  ) : null}
                  {item.description ? <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">{item.description}</p> : null}
                  {item.destination_url ? (
                    <Button asChild className="mt-5 w-full" variant="outline"><a href={item.destination_url} target="_blank" rel="noreferrer noopener">{item.cta_label || "Learn More"}<ExternalLink className="ml-2 h-4 w-4" /></a></Button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-7 text-sm text-muted-foreground">No public events or updates have been posted yet. Check back for what {creatorName} is doing next.</div>
      )}
    </section>
  );
}
