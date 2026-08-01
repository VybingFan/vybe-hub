import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, MailPlus, RefreshCw, ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminTeamService,
  type AdminRoleCode,
  type AdminTeamDashboard,
} from "@/services/admin/adminTeamService";

export const Route = createFileRoute("/_authenticated/admin_/team")({ component: AdminTeamRoute });

function AdminTeamRoute() {
  return <AdminPermissionGuard anyOf={["admin.team.manage"]}><AdminTeamPage /></AdminPermissionGuard>;
}

function AdminTeamPage() {
  const [dashboard, setDashboard] = useState<AdminTeamDashboard | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [days, setDays] = useState(7);
  const [selectedRoles, setSelectedRoles] = useState<AdminRoleCode[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const access = await adminTeamService.getMyAccess();
      const canManage = access.status === "active" && access.permissions.includes("admin.team.manage");
      setAllowed(canManage);
      setDashboard(canManage ? await adminTeamService.dashboard() : null);
    } catch (error) {
      setAllowed(false);
      toast.error(error instanceof Error ? error.message : "Could not load administrator team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const activeMembers = useMemo(
    () => dashboard?.members.filter((member) => member.status === "active").length ?? 0,
    [dashboard],
  );

  function toggleRole(role: AdminRoleCode) {
    setSelectedRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
  }

  async function sendInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedRoles.length) {
      toast.error("Select at least one administrator role.");
      return;
    }
    setSaving(true);
    try {
      await adminTeamService.sendInvitation({
        email,
        recipientName: recipientName || undefined,
        roleCodes: selectedRoles,
        expiresInDays: days,
      });
      setEmail("");
      setRecipientName("");
      setSelectedRoles([]);
      toast.success("Administrator invitation emailed");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send invitation");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="mx-auto max-w-6xl p-8 text-sm text-muted-foreground">Loading administrator team…</p>;
  if (!allowed) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <Card><CardContent className="p-8 text-center"><ShieldCheck className="mx-auto h-9 w-9 text-muted-foreground" /><h1 className="mt-3 text-xl font-semibold">Super Administrator access required</h1><p className="mt-2 text-sm text-muted-foreground">Only a Super Administrator may invite or manage administrator accounts.</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header>
        <Button variant="ghost" size="sm" asChild><Link to="/admin"><ArrowLeft className="mr-1 h-4 w-4" />Back to Back Office</Link></Button>
        <div className="mt-3 flex items-center gap-2 text-primary"><UserCog className="h-5 w-5" />Super Administrator</div>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div><h1 className="text-3xl font-semibold tracking-tight">Administrator team</h1><p className="mt-2 text-sm text-muted-foreground">Invite team members and limit access to the work they are assigned.</p></div>
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh"><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Active administrators" value={activeMembers} />
        <Metric label="Operational roles" value={dashboard?.roles.length ?? 0} />
        <Metric label="Pending invitations" value={dashboard?.invitations.filter((invite) => !invite.accepted_at && !invite.revoked_at && new Date(invite.expires_at) > new Date()).length ?? 0} />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MailPlus className="h-5 w-5" />Email an administrator invitation</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={sendInvite}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Recipient name"><Input value={recipientName} maxLength={100} onChange={(event) => setRecipientName(event.target.value)} /></Field>
              <Field label="Recipient email"><Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
            </div>
            <div>
              <Label>Operational roles</Label>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                {dashboard?.roles.map((role) => (
                  <label key={role.code} className={`cursor-pointer rounded-xl border p-4 ${selectedRoles.includes(role.code) ? "border-primary bg-primary/5" : ""}`}>
                    <div className="flex gap-3"><input type="checkbox" checked={selectedRoles.includes(role.code)} onChange={() => toggleRole(role.code)} /><div><p className="font-medium">{role.name}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{role.description}</p></div></div>
                  </label>
                ))}
              </div>
            </div>
            <Field label="Invitation expires in days"><Input className="max-w-32" type="number" min={1} max={14} value={days} onChange={(event) => setDays(Number(event.target.value))} /></Field>
            <Button disabled={saving}>{saving ? "Sending…" : "Send invitation email"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Administrator accounts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {dashboard?.members.map((member) => (
            <div key={member.user_id} className="flex flex-col justify-between gap-3 rounded-xl border p-4 md:flex-row md:items-center">
              <div><p className="font-medium">{member.display_name}</p><p className="text-sm text-muted-foreground">{member.email || "Email unavailable"}</p><div className="mt-2 flex flex-wrap gap-1">{member.roles.map((role) => <Badge key={role} variant="secondary">{role.replaceAll("_", " ")}</Badge>)}</div></div>
              <Badge variant={member.status === "active" ? "default" : "outline"}>{member.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Invitation history</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!dashboard?.invitations.length ? <p className="text-sm text-muted-foreground">No administrator invitations yet.</p> : null}
          {dashboard?.invitations.map((invite) => {
            const status = invite.accepted_at ? "accepted" : invite.revoked_at ? "revoked" : new Date(invite.expires_at) <= new Date() ? "expired" : invite.delivery_status;
            return (
              <div key={invite.id} className="flex flex-col justify-between gap-3 rounded-xl border p-4 md:flex-row md:items-center">
                <div><p className="font-medium">{invite.recipient_name || invite.email}</p><p className="text-sm text-muted-foreground">{invite.email}</p><p className="mt-1 text-xs text-muted-foreground">{invite.roles.map((role) => role.replaceAll("_", " ")).join(", ")} · expires {new Date(invite.expires_at).toLocaleDateString()}</p></div>
                <div className="flex items-center gap-2"><Badge variant={status === "sent" ? "default" : "secondary"}>{status}</Badge>{status === "sent" || status === "pending" || status === "failed" ? <Button size="sm" variant="outline" onClick={async () => { try { await adminTeamService.revokeInvitation(invite.id); toast.success("Invitation revoked"); await load(); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not revoke invitation"); } }}>Revoke</Button> : null}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
