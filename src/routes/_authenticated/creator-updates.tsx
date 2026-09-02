import { FormEvent, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Clock, ExternalLink, ImagePlus, Loader2, Megaphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CREATOR_UPDATE_KINDS, type CreatorUpdateKind } from "@/features/creatorUpdates/schema";
import { useCreateCreatorUpdate, useCreatorUpdates, useDeleteCreatorUpdate, useSetCreatorUpdatePublished } from "@/hooks/useCreatorUpdates";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/_authenticated/creator-updates")({
  component: () => <RoleGuard allow={["creator", "admin"]}><CreatorUpdatesPage /></RoleGuard>,
});

function combineLocalDateTime(dateValue: FormDataEntryValue | null, timeValue: FormDataEntryValue | null) {
  const date = String(dateValue || "").trim();
  const time = String(timeValue || "").trim();
  if (!date) return "";
  return `${date}T${time || "00:00"}`;
}

function CreatorUpdatesPage() {
  const { user } = useUser();
  const creatorId = user?.id;
  const { data: items = [], isLoading } = useCreatorUpdates(creatorId);
  const create = useCreateCreatorUpdate(creatorId);
  const publish = useSetCreatorUpdatePublished(creatorId);
  const remove = useDeleteCreatorUpdate(creatorId);
  const [kind, setKind] = useState<CreatorUpdateKind>("show");
  const [image, setImage] = useState<File | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const startsAt = combineLocalDateTime(data.get("start_date"), data.get("start_time"));
    const endsAt = combineLocalDateTime(data.get("end_date"), data.get("end_time"));

    if (!startsAt && String(data.get("start_time") || "").trim()) {
      toast.error("Choose a start date before adding a start time.");
      return;
    }
    if (!endsAt && String(data.get("end_time") || "").trim()) {
      toast.error("Choose an end date before adding an end time.");
      return;
    }
    if (startsAt && endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
      toast.error("The end date and time must be after the start.");
      return;
    }

    try {
      await create.mutateAsync({
        input: {
          kind,
          title: String(data.get("title") || ""),
          description: String(data.get("description") || ""),
          startsAt,
          endsAt,
          locationName: String(data.get("location_name") || ""),
          locationAddress: String(data.get("location_address") || ""),
          destinationUrl: String(data.get("destination_url") || ""),
          ctaLabel: String(data.get("cta_label") || ""),
          publishNow: data.get("publish_now") === "on",
        },
        image,
      });
      form.reset();
      setImage(null);
      setKind("show");
      toast.success("Event or update saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this update");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-cyan-400">Creator HQ</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Events & Updates</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">Keep supporters current with shows, appearances, releases, promotions, announcements, and links to tickets, registration, videos, interviews, or anywhere else they should go.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={submit} className="space-y-5 rounded-3xl border border-border bg-card p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-semibold">Post something new</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Upload a flyer or image when you have one. For video, livestreams, ticketing, registration, or full details, add the external destination instead of uploading another video here.</p>
          </div>

          <div>
            <Label>Type</Label>
            <Select value={kind} onValueChange={(value) => setKind(value as CreatorUpdateKind)}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>{CREATOR_UPDATE_KINDS.map((entry) => <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="update-title">Title</Label>
            <Input id="update-title" name="title" required maxLength={160} className="mt-2" placeholder="Live at The Venue, New interview, Grand opening…" />
          </div>

          <div>
            <Label htmlFor="update-description">Details</Label>
            <Textarea id="update-description" name="description" maxLength={3000} className="mt-2 min-h-28" placeholder="Tell supporters what is happening and why they may want to check it out." />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-border/70 p-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-cyan-400" />
                <Label htmlFor="start-date">Starts</Label>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_.8fr] xl:grid-cols-1 2xl:grid-cols-[1fr_.8fr]">
                <div>
                  <Label htmlFor="start-date" className="text-xs text-muted-foreground">Date</Label>
                  <Input id="start-date" name="start_date" type="date" className="mt-1.5 cursor-pointer" />
                </div>
                <div>
                  <Label htmlFor="start-time" className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />Time</Label>
                  <Input id="start-time" name="start_time" type="time" className="mt-1.5 cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 p-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-cyan-400" />
                <Label htmlFor="end-date">Ends <span className="font-normal text-muted-foreground">(optional)</span></Label>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_.8fr] xl:grid-cols-1 2xl:grid-cols-[1fr_.8fr]">
                <div>
                  <Label htmlFor="end-date" className="text-xs text-muted-foreground">Date</Label>
                  <Input id="end-date" name="end_date" type="date" className="mt-1.5 cursor-pointer" />
                </div>
                <div>
                  <Label htmlFor="end-time" className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />Time</Label>
                  <Input id="end-time" name="end_time" type="time" className="mt-1.5 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
          <p className="-mt-2 text-xs leading-5 text-muted-foreground">Choose the date from the calendar and add a time when the event has one. End date and time are optional.</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="min-w-0"><Label htmlFor="location-name">Location / Venue</Label><Input id="location-name" name="location_name" maxLength={200} className="mt-2 w-full" placeholder="Venue name or Online" /></div>
            <div className="min-w-0"><Label htmlFor="location-address">Address / Area</Label><Input id="location-address" name="location_address" maxLength={300} className="mt-2 w-full" placeholder="Philadelphia, PA or full address" /></div>
          </div>

          <div>
            <Label htmlFor="update-image">Flyer or promotional image</Label>
            <label htmlFor="update-image" className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm">
              <ImagePlus className="h-5 w-5 text-cyan-400" />
              <span className="min-w-0">{image ? image.name : "Choose JPG, PNG, or WebP · up to 5MB"}</span>
            </label>
            <input id="update-image" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setImage(event.target.files?.[0] || null)} />
          </div>

          <div>
            <Label htmlFor="destination-url">Destination link</Label>
            <Input id="destination-url" name="destination_url" type="url" className="mt-2" placeholder="https://tickets…, https://youtube…, https://instagram…" />
            <p className="mt-1 text-xs text-muted-foreground">Use this for tickets, RSVP, registration, hosted video, article, booking page, store, livestream, or any other destination.</p>
          </div>

          <div>
            <Label htmlFor="cta-label">Button text</Label>
            <Input id="cta-label" name="cta_label" maxLength={60} className="mt-2" placeholder="Get Tickets, Watch, RSVP, Learn More…" />
          </div>

          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border p-3">
            <input name="publish_now" type="checkbox" className="mt-1 h-4 w-4" />
            <span className="text-sm"><strong>Publish now</strong><span className="mt-0.5 block text-muted-foreground">Otherwise this stays in your Creator HQ as a draft.</span></span>
          </label>

          <Button disabled={create.isPending} className="w-full bg-gradient-brand text-white">
            {create.isPending ? <Loader2 className="animate-spin" /> : <Megaphone />}
            {create.isPending ? "Saving…" : "Save Event or Update"}
          </Button>
        </form>

        <section>
          <div className="flex items-end justify-between gap-4">
            <div><h2 className="text-2xl font-semibold">Your posts</h2><p className="mt-1 text-sm text-muted-foreground">{items.length} {items.length === 1 ? "item" : "items"}</p></div>
          </div>

          <div className="mt-5 space-y-4">
            {items.map((item) => {
              const type = CREATOR_UPDATE_KINDS.find((entry) => entry.value === item.kind)?.label || "Update";
              return (
                <Card key={item.id}>
                  <CardContent className="grid gap-4 p-5 sm:grid-cols-[8rem_1fr]">
                    <div className="overflow-hidden rounded-xl bg-muted">
                      {item.image_url ? <img src={item.image_url} alt="" className="aspect-square h-full w-full object-cover" /> : <div className="flex aspect-square items-center justify-center"><CalendarDays className="h-8 w-8 text-muted-foreground" /></div>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={item.status === "published" ? "default" : "outline"}>{item.status === "published" ? "Published" : "Draft"}</Badge>
                        <Badge variant="outline">{type}</Badge>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                      {item.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.description}</p> : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => publish.mutate({ id: item.id, published: item.status !== "published" })}>
                          {item.status === "published" ? "Move to Draft" : "Publish"}
                        </Button>
                        {item.destination_url ? <Button asChild variant="outline" size="sm"><a href={item.destination_url} target="_blank" rel="noreferrer noopener"><ExternalLink />Test Link</a></Button> : null}
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove.mutate(item)}><Trash2 />Delete</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {!isLoading && !items.length ? <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Your first event, announcement, or promotion will appear here.</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
