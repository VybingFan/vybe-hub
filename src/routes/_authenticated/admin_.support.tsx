import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, LifeBuoy, MessageSquare, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/_authenticated/admin_/support")({
  validateSearch: (search: Record<string, unknown>) => ({
    ticket: typeof search.ticket === "string" ? search.ticket : "",
  }),
  component: AdminSupportRoute,
});

type SupportTicket = {
  id: string;
  creator_user_id: string;
  category: string;
  subject: string;
  details: string;
  status: string;
  priority: string;
  waiting_on: string | null;
  escalated_at: string | null;
  created_at: string;
  updated_at: string;
};

type SupportMessage = {
  id: string;
  request_id: string;
  author_role: "creator" | "admin" | "system";
  body: string;
  created_at: string;
};
const statusLabels: Record<string, string> = {
  open: "Submitted",
  in_review: "In Review",
  waiting_creator: "Waiting on Creator",
  resolved: "Resolved",
};

function AdminSupportRoute() {
  return (
    <AdminPermissionGuard anyOf={["admin.creator.read", "admin.work_queue.read"]}>
      <AdminSupportPage />
    </AdminPermissionGuard>
  );
}

function AdminSupportPage() {
  const { ticket: focusedTicketId } = Route.useSearch();
  const { user } = useUser();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(focusedTicketId || null);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [ticketResult, messageResult] = await Promise.all([
      (supabase.from("creator_support_requests") as any)
        .select("id,creator_user_id,category,subject,details,status,priority,waiting_on,escalated_at,created_at,updated_at")
        .order("updated_at", { ascending: false }),
      (supabase.from("creator_support_messages") as any)
        .select("id,request_id,author_role,body,created_at")
        .order("created_at", { ascending: true }),
    ]);
    if (ticketResult.error) toast.error(ticketResult.error.message);
    if (messageResult.error) toast.error(messageResult.error.message);
    const loadedTickets = (ticketResult.data ?? []) as SupportTicket[];
    setTickets(loadedTickets);
    setMessages((messageResult.data ?? []) as SupportMessage[]);
    setSelectedId((current) => current ?? focusedTicketId ?? loadedTickets[0]?.id ?? null);
    setLoading(false);
  }, [focusedTicketId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? null;
  const selectedMessages = messages.filter((message) => message.request_id === selectedId);

  async function updateStatus(status: string) {
    if (!selected) return;
    const { error } = await (supabase.from("creator_support_requests") as any)
      .update({
        status,
        waiting_on: status === "waiting_creator" ? "creator" : null,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selected.id);

    if (error) toast.error(error.message);
    else {
      toast.success("Ticket status updated");
      await load();
    }
  }

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !user) return;
    const form = new FormData(event.currentTarget);
    const body = String(form.get("reply") || "").trim();
    if (!body) return;
    setReplying(true);

    const { error } = await (supabase.from("creator_support_messages") as any).insert({
      request_id: selected.id,
      author_user_id: user.id,
      author_role: "admin",
      body,
    });

    if (error) {
      toast.error(error.message);
    } else {
      await (supabase.from("creator_support_requests") as any)
        .update({
          status: "waiting_creator",
          waiting_on: "creator",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selected.id);
      toast.success("Reply sent to creator");
      event.currentTarget.reset();
      await load();
    }
    setReplying(false);
  }

  async function escalate() {
    if (!selected) return;
    const reason = window.prompt(
      "Why does this ticket require administrative Work Queue review?",
      selected.details,
    );
    if (reason === null) return;

    const { error } = await (supabase as any).rpc("escalate_creator_support_request", {
      p_request_id: selected.id,
      p_reason: reason,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Ticket escalated to Work Queue");
      await load();
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Back Office
          </Link>
        </Button>
        <div className="mt-3 flex items-center gap-2 text-primary">
          <LifeBuoy className="h-5 w-5" /> Creator support
        </div>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Support Tickets</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Handle routine creator support here. Escalate only issues that require an administrative decision, investigation, or irreversible action.
            </p>
          </div>
          <Button variant="outline" size="icon" aria-label="Refresh" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Open & recent tickets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? <p className="text-sm text-muted-foreground">Loading tickets...</p> : null}
            {!loading && tickets.length === 0 ? <p className="text-sm text-muted-foreground">No creator support tickets yet.</p> : null}
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedId(ticket.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${selectedId === ticket.id ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{ticket.subject}</span>
                  {ticket.priority === "priority" ? <Badge>Priority</Badge> : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={ticket.status} />
                  {ticket.escalated_at ? <Badge variant="destructive">Escalated</Badge> : null}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {ticket.category.replaceAll("_", " ")} · {new Date(ticket.updated_at).toLocaleString()}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        {selected ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{selected.subject}</CardTitle>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">Ticket {selected.id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Creator account: {selected.creator_user_id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={selected.status} />
                  {selected.priority === "priority" ? <Badge>Priority</Badge> : <Badge variant="outline">Standard</Badge>}
                  {selected.escalated_at ? <Badge variant="destructive">Work Queue escalation</Badge> : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-sm font-medium">Original request</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{selected.details}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={selected.status === "in_review" ? "default" : "outline"} onClick={() => void updateStatus("in_review")}>Start review</Button>
                <Button size="sm" variant={selected.status === "waiting_creator" ? "default" : "outline"} onClick={() => void updateStatus("waiting_creator")}>Waiting on creator</Button>
                <Button size="sm" variant={selected.status === "resolved" ? "default" : "outline"} onClick={() => void updateStatus("resolved")}>Mark resolved</Button>
                <Button size="sm" variant="destructive" disabled={Boolean(selected.escalated_at)} onClick={() => void escalate()}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {selected.escalated_at ? "Escalated" : "Escalate to Work Queue"}
                </Button>
              </div>

              <div className="space-y-3 border-t pt-5">
                <p className="font-medium">Conversation</p>
                {selectedMessages.length ? selectedMessages.map((message) => (
                  <div key={message.id} className={`rounded-xl border p-4 ${message.author_role === "admin" ? "border-primary/30 bg-primary/5" : ""}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{message.author_role === "admin" ? "VYBE Support" : "Creator"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleString()}</p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No replies yet.</p>}
              </div>

              {selected.status !== "resolved" ? (
                <form onSubmit={sendReply} className="space-y-3 border-t pt-5">
                  <Label htmlFor="admin-support-reply">Reply to creator</Label>
                  <Textarea id="admin-support-reply" name="reply" required rows={5} maxLength={10000} />
                  <Button disabled={replying}>
                    <Send className="mr-2 h-4 w-4" />
                    {replying ? "Sending..." : "Send reply"}
                  </Button>
                </form>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Ticket resolved.
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-sm text-muted-foreground">
              Select a ticket to review its history and respond.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const Icon = status === "resolved" ? CheckCircle2 : status === "waiting_creator" ? MessageSquare : Clock3;
  return (
    <Badge variant={status === "waiting_creator" ? "destructive" : status === "resolved" ? "secondary" : "outline"}>
      <Icon className="mr-1 h-3 w-3" />
      {statusLabels[status] ?? status.replaceAll("_", " ")}
    </Badge>
  );
}
