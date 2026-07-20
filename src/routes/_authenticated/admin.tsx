import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, Clipboard, KeyRound, RefreshCw, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  invitationService,
  type CreatorInvite,
  type CreatorPlan,
} from "@/services/invitations/invitationService";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminPage });

const PLAN_LABELS: Record<CreatorPlan, string> = {
  creator_free: "Creator Free",
  creator_plus: "Creator Plus",
  founding_beta: "Founding Beta",
};

function AdminPage() {
  const [invites, setInvites] = useState<CreatorInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<CreatorPlan>("founding_beta");
  const [days, setDays] = useState(7);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setInvites(await invitationService.list());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load invitations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createInvite(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setCreatedLink(null);
    try {
      const created = await invitationService.create({
        email,
        recipientName: name,
        plan,
        expiresInDays: days,
      });
      const link = `${window.location.origin}/creator-invite/${created.invite_token}`;
      setCreatedLink(link);
      setEmail("");
      setName("");
      toast.success("Personal creator invitation created");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create invitation");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    toast.success("Invitation link copied");
  }

  async function revoke(id: string) {
    try {
      await invitationService.revoke(id);
      toast.success("Invitation revoked");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke invitation");
    }
  }

  return (
    <RoleGuard allow={["admin"]}>
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" /> VYBE administration
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Creator invitations
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Only an administrator can issue Creator Studio access. Every link is bound to one email,
            expires, and can be redeemed once.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> Create a personal invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createInvite} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Recipient name</Label>
                <Input
                  id="invite-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="SoundWave Mane"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Recipient email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-plan">Access plan</Label>
                <select
                  id="invite-plan"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value as CreatorPlan)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(PLAN_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-days">Expires in days</Label>
                <Input
                  id="invite-days"
                  type="number"
                  min={1}
                  max={30}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                />
              </div>
              <div className="md:col-span-2">
                <Button disabled={saving}>{saving ? "Creating…" : "Create invitation"}</Button>
              </div>
            </form>

            {createdLink && (
              <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="font-medium">Copy this link now</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  For security, the complete token is shown only once. Send it only to the intended
                  email owner.
                </p>
                <div className="mt-3 flex gap-2">
                  <Input readOnly value={createdLink} />
                  <Button type="button" variant="outline" onClick={copyLink}>
                    <Clipboard className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invitation history</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => void load()} aria-label="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!loading && invites.length === 0 && (
              <p className="text-sm text-muted-foreground">No creator invitations yet.</p>
            )}
            {invites.map((invite) => {
              const expired = new Date(invite.expires_at) <= new Date();
              const status = invite.redeemed_at
                ? "Redeemed"
                : invite.revoked_at
                  ? "Revoked"
                  : expired
                    ? "Expired"
                    : "Ready";
              return (
                <div
                  key={invite.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border p-4 md:flex-row md:items-center"
                >
                  <div>
                    <p className="font-medium">
                      {invite.recipient_name || invite.email_normalized}
                    </p>
                    {invite.recipient_name && (
                      <p className="text-sm text-muted-foreground">{invite.email_normalized}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {PLAN_LABELS[invite.assigned_plan]} · expires{" "}
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={status === "Ready" ? "default" : "secondary"}>
                      {status === "Redeemed" && <Check className="mr-1 h-3 w-3" />}
                      {status}
                    </Badge>
                    {status === "Ready" && (
                      <Button size="sm" variant="outline" onClick={() => void revoke(invite.id)}>
                        <X className="mr-1 h-4 w-4" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
