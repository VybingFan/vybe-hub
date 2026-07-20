import { createFileRoute } from "@tanstack/react-router";
import { Check, Mail, MessageCircle, UserRound } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMyConnections, useUpdateConnection } from "@/hooks/useConnections";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/_authenticated/connections")({ component: () => <RoleGuard allow={["creator", "admin"]}><ConnectionsPage /></RoleGuard> });

function ConnectionsPage() {
  const { user } = useUser();
  const { data: connections = [] } = useMyConnections(user?.id);
  const update = useUpdateConnection(user?.id);
  const newCount = connections.filter((item) => item.status === "new").length;
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header><p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Opt-in audience</p><h1 className="mt-2 text-4xl font-semibold">Listener connections</h1><p className="mt-3 max-w-3xl text-muted-foreground">People listed here voluntarily shared their details after visiting one of your playlists. Contact them personally for now; automated campaigns are not connected.</p></header>
      <div className="grid gap-4 sm:grid-cols-2"><Card><CardContent className="p-6"><p className="text-3xl font-semibold">{connections.length}</p><p className="text-sm text-muted-foreground">Total connection requests</p></CardContent></Card><Card><CardContent className="p-6"><p className="text-3xl font-semibold">{newCount}</p><p className="text-sm text-muted-foreground">New requests</p></CardContent></Card></div>
      <div className="grid gap-4 lg:grid-cols-2">{connections.map((connection) => <Card key={connection.id}><CardContent className="space-y-4 p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 font-semibold"><UserRound className="h-4 w-4" />{connection.display_name || "Listener"}</h2><p className="mt-1 text-sm text-muted-foreground">via {connection.playlists?.title || "shared playlist"}</p></div><Badge variant={connection.status === "new" ? "default" : "outline"}>{connection.status}</Badge></div><div className="space-y-2 text-sm"><a className="flex items-center gap-2 text-primary hover:underline" href={`mailto:${connection.email}`}><Mail className="h-4 w-4" />{connection.email}</a>{connection.social_handle && <p className="flex items-center gap-2"><MessageCircle className="h-4 w-4" />{connection.social_handle}</p>}{connection.message && <p className="rounded-xl bg-muted p-3 text-muted-foreground">“{connection.message}”</p>}</div><div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{connection.consent_updates ? "Requested future updates" : "Direct response only"} • {new Date(connection.created_at).toLocaleString()}</p>{connection.status === "new" && <Button size="sm" variant="outline" onClick={() => update.mutate({ id: connection.id, status: "contacted" })}><Check className="mr-2 h-4 w-4" />Mark contacted</Button>}</div></CardContent></Card>)}{!connections.length && <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground lg:col-span-2">Connection requests will appear here after a listener opts in from a shared playlist.</p>}</div>
    </div>
  );
}
