import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Clock, ExternalLink, MapPin, UserRound } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CREATOR_UPDATE_KINDS } from "@/features/creatorUpdates/schema";
import { creatorUpdateService } from "@/services/creator/creatorUpdateService";

export const Route = createFileRoute("/_authenticated/creator-update/$updateId")({
  component: CreatorUpdateDetailPage,
});

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "V"
  );
}

function CreatorUpdateDetailPage() {
  const { updateId } = Route.useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["creator-update-detail", updateId],
    queryFn: () => creatorUpdateService.getPublishedDetail(updateId),
  });

  return (
    <RoleGuard allow={["supporter", "creator", "business", "admin"]}>
      <div className="mx-auto max-w-4xl space-y-5 pb-10">
        <Button variant="ghost" asChild className="-ml-2">
          <Link to="/my-vybe">
            <ArrowLeft className="h-4 w-4" />
            Back to My VYBE
          </Link>
        </Button>

        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Loading this VYBE update...</CardContent>
          </Card>
        ) : null}

        {isError ? (
          <Card className="border-dashed">
            <CardContent className="p-6">
              <h1 className="text-xl font-semibold">This update could not be loaded.</h1>
              <p className="mt-2 text-sm text-muted-foreground">Return to My VYBE and try again.</p>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !isError && !data ? (
          <Card className="border-dashed">
            <CardContent className="p-6">
              <h1 className="text-xl font-semibold">This update is no longer available.</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                It may have been removed or moved back to draft by the creator.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {data ? (
          <Card className="overflow-hidden">
            {data.update.image_url ? (
              <div className="border-b bg-muted">
                <img src={data.update.image_url} alt="" className="max-h-[32rem] w-full object-contain" />
              </div>
            ) : null}

            <CardContent className="space-y-6 p-5 sm:p-7">
              <div>
                <Badge variant="outline">
                  {CREATOR_UPDATE_KINDS.find((entry) => entry.value === data.update.kind)?.label || "Creator Update"}
                </Badge>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{data.update.title}</h1>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border bg-muted/20 p-3">
                <Avatar className="h-11 w-11">
                  {data.creator.avatar_url ? <AvatarImage src={data.creator.avatar_url} alt="" /> : null}
                  <AvatarFallback>{initials(data.creator.display_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{data.creator.display_name}</p>
                  {data.creator.username ? <p className="truncate text-xs text-muted-foreground">@{data.creator.username}</p> : null}
                </div>
                {data.creator.username ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/creator/${data.creator.username}`}>
                      <UserRound className="h-4 w-4" />
                      Creator
                    </a>
                  </Button>
                ) : null}
              </div>

              {data.update.description ? (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[.14em] text-primary">Details</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground/90 sm:text-base">
                    {data.update.description}
                  </p>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                {data.update.starts_at ? (
                  <div className="rounded-2xl border p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      Starts
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {new Date(data.update.starts_at).toLocaleDateString()} Â·{" "}
                      {new Date(data.update.starts_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                ) : null}

                {data.update.ends_at ? (
                  <div className="rounded-2xl border p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Clock className="h-4 w-4 text-primary" />
                      Ends
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {new Date(data.update.ends_at).toLocaleDateString()} Â·{" "}
                      {new Date(data.update.ends_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                ) : null}

                {data.update.location_name || data.update.location_address ? (
                  <div className="rounded-2xl border p-4 sm:col-span-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <MapPin className="h-4 w-4 text-primary" />
                      Location
                    </div>
                    {data.update.location_name ? <p className="mt-2 text-sm">{data.update.location_name}</p> : null}
                    {data.update.location_address ? <p className="mt-1 text-sm text-muted-foreground">{data.update.location_address}</p> : null}
                  </div>
                ) : null}
              </div>

              {data.update.destination_url ? (
                <Button asChild className="w-full sm:w-auto">
                  <a href={data.update.destination_url} target="_blank" rel="noreferrer noopener">
                    <ExternalLink className="h-4 w-4" />
                    {data.update.cta_label || "Learn More"}
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </RoleGuard>
  );
}