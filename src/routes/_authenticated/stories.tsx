import { type FormEvent, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/stories")({ component: () => <RoleGuard allow={["creator", "admin"]}><StoriesPage /></RoleGuard> });

function StoriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const load = async () => { const { data } = await (supabase.from("creator_stories") as any).select("*").order("created_at", { ascending: false }); setItems(data || []); };
  useEffect(() => { void load(); }, []);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const status = String(form.get("status"));
    const publishAt = form.get("publish_at") || null;
    const { error } = await (supabase.from("creator_stories") as any).insert({ creator_user_id: user.id, title: form.get("title"), body: form.get("body"), visibility: form.get("visibility"), status, publish_at: publishAt, published_at: status === "published" ? new Date().toISOString() : null });
    if (error) toast.error(error.message); else { formElement.reset(); await load(); toast.success("Story saved"); }
  };
  return <div className="mx-auto max-w-4xl space-y-6"><h1 className="text-4xl font-semibold">Creator Stories</h1><Card><CardContent className="p-6"><form onSubmit={save} className="space-y-4"><Input name="title" required maxLength={140} placeholder="Story title" /><Textarea name="body" required rows={8} placeholder="Tell your story" /><div className="grid gap-3 sm:grid-cols-3"><select name="visibility" className="h-10 rounded-md border bg-background px-3"><option value="public">Public</option><option value="members">VYBE members</option></select><select name="status" className="h-10 rounded-md border bg-background px-3"><option value="draft">Draft</option><option value="published">Publish now</option><option value="scheduled">Schedule</option></select><Input name="publish_at" type="datetime-local" /></div><Button>Save story</Button></form></CardContent></Card>{items.map((item) => <Card key={item.id}><CardContent className="p-5"><div className="flex justify-between"><h2 className="font-semibold">{item.title}</h2><span className="text-sm capitalize text-primary">{item.status}</span></div><p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.body}</p></CardContent></Card>)}</div>;
}
