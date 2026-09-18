import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BookOpenText, CheckCircle2, Clock3, Copyright, LifeBuoy, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useMembership } from "@/hooks/useMembership";
import { hasCreatorCapability } from "@/features/membership/access";

export const Route = createFileRoute("/_authenticated/creator-support")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <CreatorSupportPage />
    </RoleGuard>
  ),
});

type SupportTicket = {
  id: string;
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

const categories = [
  ["general", "General help"],
  ["technical", "Technical problem"],
  ["account_profile", "Account or profile"],
  ["music_playlists", "Music or playlists"],
  ["creator_tools", "Creator tools"],
  ["billing_access", "Membership or access"],
  ["other", "Other"],
] as const;

const statusLabels: Record<string, string> = {
  open: "Submitted",
  in_review: "In Review",
  waiting_creator: "Waiting on You",
  resolved: "Resolved",
};

function CreatorSupportPage() {
  const membership = useMembership(true);
  const prioritySupport = hasCreatorCapability(membership.data?.plan_code, "support.priority");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    const [ticketResult, messageResult] = await Promise.all([
      (supabase.from("creator_support_requests") as any)
        .select("id,category,subject,details,status,priority,waiting_on,escalated_at,created_at,updated_at")
        .order("created_at", { ascending: false }),
      (supabase.from("creator_support_messages") as any)
        .select("id,request_id,author_role,body,created_at")
        .order("created_at", { ascending: true }),
    ]);

    if (ticketResult.error) toast.error(ticketResult.error.message);
    if (messageResult.error) toast.error(messageResult.error.message);
    setTickets((ticketResult.data ?? []) as SupportTicket[]);
    setMessages((messageResult.data ?? []) as SupportMessage[]);
    setSelectedId((current) => current ?? ticketResult.data?.[0]?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? null;
  const selectedMessages = messages.filter((message) => message.request_id === selectedId);

  async function createTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    const form = new FormData(event.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSending(false);
      return;
    }
    const { data, error } = await (supabase.from("creator_support_requests") as any)
      .insert({
        creator_user_id: user.id,
        category: String(form.get("category") || "general"),
        subject: String(form.get("subject") || "").trim(),
        details: String(form.get("details") || "").trim(),
        priority: prioritySupport ? "priority" : "standard",
        status: "open",
      })
      .select("id")
      .single();

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(prioritySupport ? "Priority support ticket submitted" : "Support ticket submitted");
      event.currentTarget.reset();
      setSelectedId(data?.id ?? null);
      await load();
    }
    setSending(false);
  }

  async function replyToTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    const form = new FormData(event.currentTarget);
    const body = String(form.get("reply") || "").trim();
    if (!body) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase.from("creator_support_messages") as any).insert({
      request_id: selectedId,
      author_user_id: user.id,
      author_role: "creator",
      body,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Reply sent");
      event.currentTarget.reset();
      await load();
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header>
        <div className="flex items-center gap-2 text-primary">
          <LifeBuoy className="h-5 w-5" />
          Creator Help Center
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Help, support, and your tickets</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Find the right support path, submit a ticket, and keep the conversation and status in one place.
          {prioritySupport ? " Your membership includes priority creator support." : " Standard creator support is included with your account."}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <HelpPath icon={BookOpenText} title="Help & guidance" body="Platform questions, how-to help, navigation, setup, and feature guidance." to="/help" action="Open Help Center" />
        <HelpPath icon={Copyright} title="Unauthorized use of my work" body="Report music or other work you believe is being used on VYBE without authorization." to="/copyright/report" action="Report rights issue" />
        <HelpPath icon={AlertTriangle} title="Account deletion" body="Account deletion and immediate-deletion review are managed from Account Settings." to="/settings" action="Open Account Settings" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Submit a support ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createTicket} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="support-category">Category</Label>
                <select id="support-category" name="category" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-subject">Subject</Label>
                <Input id="support-subject" name="subject" required minLength={3} maxLength={160} placeholder="What do you need help with?" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-details">Details</Label>
                <Textarea id="support-details" name="details" required minLength={10} maxLength={5000} rows={6} placeholder="Tell us what happened, what you expected, and anything that may help us review it." />
              </div>
              <Button disabled={sending}>
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Submitting..." : "Submit ticket"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Your tickets</CardTitle>
              {prioritySupport ? <Badge>Priority support</Badge> : <Badge variant="outline">Standard support</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Loading tickets...</p> : null}
            {!loading && tickets.length === 0 ? <p className="text-sm text-muted-foreground">You have not submitted a support ticket yet.</p> : null}
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${selectedId === ticket.id ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{ticket.subject}</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {categoryLabel(ticket.category)} · {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {selected ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{selected.subject}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Ticket {selected.id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={selected.status} />
                {selected.priority === "priority" ? <Badge>Priority</Badge> : null}
                {selected.escalated_at ? <Badge variant="destructive">Escalated for admin review</Badge> : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="text-sm font-medium">Original request</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{selected.details}</p>
            </div>

            <div className="space-y-3">
              {selectedMessages.length ? selectedMessages.map((message) => (
                <div key={message.id} className={`rounded-xl border p-4 ${message.author_role === "admin" ? "border-primary/30 bg-primary/5" : ""}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{message.author_role === "admin" ? "VYBE Support" : "You"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleString()}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No replies yet.</p>}
            </div>
            {selected.status !== "resolved" ? (
              <form onSubmit={replyToTicket} className="space-y-3 border-t pt-4">
                <Label htmlFor="ticket-reply">Add a reply</Label>
                <Textarea id="ticket-reply" name="reply" required rows={4} maxLength={10000} />
                <Button variant="outline">Send reply</Button>
              </form>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                This ticket is resolved.
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function HelpPath({ icon: Icon, title, body, to, action }: { icon: typeof LifeBuoy; title: string; body: string; to: "/help" | "/copyright/report" | "/settings"; action: string }) {
  return (
    <Card>
      <CardContent className="flex h-full flex-col p-5">
        <Icon className="h-5 w-5 text-primary" />
        <p className="mt-3 font-semibold">{title}</p>
        <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{body}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={to}>{action}</Link>
        </Button>
      </CardContent>
    </Card>
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

function categoryLabel(category: string) {
  return categories.find(([value]) => value === category)?.[1] ?? category.replaceAll("_", " ");
}
