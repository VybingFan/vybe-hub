import type { FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { CreatorCapabilityGuard } from "@/components/membership/CreatorCapabilityGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/creator-support")({
  component: () => <RoleGuard allow={["creator", "admin"]}><CreatorCapabilityGuard capability="support.priority" requiredPlan="creator_plus" title="Priority support requires Creator Plus" description="Creator Free retains standard support access. Priority creator support begins with Creator Plus."><CreatorSupportPage /></CreatorCapabilityGuard></RoleGuard>,
});

function CreatorSupportPage() {
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase.from("creator_support_requests") as any).insert({ creator_user_id: user.id, category: "creator_plus", subject: form.get("subject"), details: form.get("details"), priority: "priority" });
    error ? toast.error(error.message) : toast.success("Priority support request received");
  };
  return <Card className="mx-auto max-w-2xl"><CardContent className="space-y-4 p-6"><h1 className="text-3xl font-semibold">Creator Plus Support</h1><form onSubmit={submit} className="space-y-4"><Input name="subject" required placeholder="What do you need help with?" /><Textarea name="details" required /><Button>Send priority request</Button></form></CardContent></Card>;
}
