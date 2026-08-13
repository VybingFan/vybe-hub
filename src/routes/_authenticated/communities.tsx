import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, MessageCircle, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { useUser } from "@/hooks/useUser";
import { supporterExperienceService, type CommunityConversation } from "@/services/supporter/supporterExperienceService";

export const Route = createFileRoute("/_authenticated/communities")({ component: CommunitiesPage });

function CommunitiesPage() {
  const { user } = useUser();
  const [items, setItems] = useState<CommunityConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const load = () => supporterExperienceService.conversations().then(setItems).catch((error) => toast.error(error instanceof Error ? error.message : "Conversations could not load.")).finally(() => setLoading(false));
  useEffect(() => { void load(); }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!user?.id) return;
    const form = new FormData(event.currentTarget); const title = String(form.get("title") || ""); const body = String(form.get("body") || "");
    if (title.trim().length < 4 || body.trim().length < 10) return toast.error("Add a clear title and at least 10 characters to begin the conversation.");
    setCreating(true); try { await supporterExperienceService.createConversation(user.id, title, body, "general"); event.currentTarget.reset(); await load(); toast.success("Conversation started."); } catch (error) { toast.error(error instanceof Error ? error.message : "Conversation could not be created."); } finally { setCreating(false); }
  };
  return <RoleGuard allow={["supporter", "creator", "business", "admin"]}><div className="mx-auto max-w-6xl space-y-6">
    <WorkspacePageHeader eyebrow="VYBE communities" title="Find your people. Start a conversation." description="Join thoughtful conversations around music, stories, events, creative work, and shared interests." />
    <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <Card><CardContent className="p-5"><h2 className="flex items-center text-xl font-semibold"><Plus className="mr-2 h-5 w-5 text-primary" />Start a conversation</h2><p className="mt-2 text-sm text-muted-foreground">Supporters may begin respectful discussions. Community creation and moderator tools remain separate.</p><form onSubmit={submit} className="mt-5 space-y-3"><Input name="title" maxLength={120} placeholder="What do you want to talk about?" /><Textarea name="body" maxLength={3000} rows={6} placeholder="Add context so other members can join thoughtfully." /><Button type="submit" disabled={creating}>{creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}Post conversation</Button></form><p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Posts are subject to moderation and the <Link to="/community-guidelines" className="underline">Community Guidelines</Link>.</p></CardContent></Card>
      <Card><CardContent className="p-5"><h2 className="text-xl font-semibold">Recent conversations</h2>{loading ? <Loader2 className="mt-6 h-5 w-5 animate-spin text-primary" /> : <div className="mt-4 space-y-3">{items.map((item) => <article key={item.id} className="rounded-2xl border p-4"><h3 className="font-semibold">{item.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.body}</p><p className="mt-3 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p></article>)}{!items.length ? <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No conversations yet. You can start the first one.</p> : null}</div>}</CardContent></Card>
    </div>
  </div></RoleGuard>;
}
