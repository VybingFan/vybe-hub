import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  Clipboard,
  BriefcaseBusiness,
  BellRing,
  Copyright,
  Gamepad2,
  KeyRound,
  Library,
  RefreshCw,
  ShieldCheck,
  Users,
  UserCog,
  X,
} from "lucide-react";
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
import { adminService, type BackOfficeSummary } from "@/services/admin/adminService";
import { adminTeamService, type AdminAccess } from "@/services/admin/adminTeamService";
import {
  adminNotificationService,
  type WorkQueueSummary,
} from "@/services/admin/adminNotificationService";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminPage });

const PLAN_LABELS: Record<CreatorPlan, string> = {
  creator_free: "Creator Free",
  creator_plus: "Creator Plus",
  creator_pro: "Creator Pro",
  creator_studio: "Creator Studio",
  founding_beta: "Founding Creator (invitation-only)",
};

function AdminPage() {
  const [invites, setInvites] = useState<CreatorInvite[]>([]);
  const [summary, setSummary] = useState<BackOfficeSummary | null>(null);
  const [workQueue, setWorkQueue] = useState<WorkQueueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<CreatorPlan>("founding_beta");
  const [days, setDays] = useState(7);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [canManageAdminTeam, setCanManageAdminTeam] = useState(false);
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const access = await adminTeamService.getMyAccess();
      setAdminAccess(access);
      const canManageTeam =
        access.status === "active" && access.permissions.includes("admin.team.manage");
      setCanManageAdminTeam(canManageTeam);
      if (!canManageTeam) return;
      const [invitationRecords, operatingSummary, queueSummary] = await Promise.all([
        invitationService.list(),
        adminService.getSummary(),
        adminNotificationService.summary(),
      ]);
      setInvites(invitationRecords);
      setSummary(operatingSummary);
      setWorkQueue(queueSummary);
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

  if (!adminAccess) {
    return (
      <RoleGuard allow={["admin"]}>
        <div className="mx-auto max-w-6xl p-8 text-sm text-muted-foreground">
          Loading your administrator permissions…
        </div>
      </RoleGuard>
    );
  }

  if (!loading && adminAccess && !canManageAdminTeam) {
    return (
      <RoleGuard allow={["admin"]}>
        <LimitedAdminHome access={adminAccess} />
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allow={["admin"]}>
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" /> Owner and administrator only
          </div>
          <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                VYBE Back Office
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                One operating center for accounts, creators, content, rights, memberships,
                invitations, and release readiness.
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {summary
              ? `Database summary refreshed ${new Date(summary.generated_at).toLocaleString()}`
              : loading
                ? "Loading operating summary…"
                : "Operating summary unavailable"}
          </p>
        </header>

        {summary ? <BackOfficeOverview summary={summary} /> : null}

        {workQueue && workQueue.unread > 0 ? (
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex gap-3">
                <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold">
                    {workQueue.unread} item{workQueue.unread === 1 ? "" : "s"} need attention
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {workQueue.business_applications} pending business application
                    {workQueue.business_applications === 1 ? "" : "s"} ·{" "}
                    {workQueue.campaign_reviews} campaign review
                    {workQueue.campaign_reviews === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link to="/admin/work-queue">
                  Open work queue <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <BackOfficeLaunchpad summary={summary} workQueue={workQueue} canManageAdminTeam={canManageAdminTeam} />

        <Card id="invitation-management">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> Creator access and invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-5 max-w-3xl text-sm leading-6 text-muted-foreground">
              Issue Creator Studio access. Every link is bound to one email, expires, and can be
              redeemed once.
            </p>
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

function LimitedAdminHome({ access }: { access: AdminAccess }) {
  const workspaceItems = [
    { permission: "admin.analytics.read", title: "Analytics & Reports", description: "Review platform metrics and released reports.", to: "/admin/reports" as const, icon: Activity },
    { permission: "admin.accounts.read", title: "Members & Accounts", description: "View member and account records.", to: "/admin/accounts" as const, icon: Users },
    { permission: "admin.business.read", title: "Business Operations", description: "View business partners, campaigns, and offers.", to: "/admin/businesses" as const, icon: BriefcaseBusiness },
    { permission: "admin.creator.read", title: "Creator Operations", description: "View creator accounts and catalog activity.", to: "/admin/creators" as const, icon: Library },
    { permission: "admin.rights.read", title: "Rights & Moderation", description: "View rights records and review activity.", to: "/admin/rights" as const, icon: Copyright },
    { permission: "admin.content.read", title: "Play Operations", description: "View Play content and moderation activity.", to: "/admin/play" as const, icon: Gamepad2 },
  ].filter((item) => access.permissions.includes(item.permission));

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header>
        <div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" />Permission-aware administrator access</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your administrator workspace</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Only the work areas assigned to your operational role are available.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {access.roles.map((role) => <Badge key={role} variant="secondary">{role.replaceAll("_", " ")}</Badge>)}
        </div>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workspaceItems.map((item) => (
          <Card key={item.to} className="flex h-full flex-col">
            <CardContent className="flex h-full flex-col p-5">
              <item.icon className="h-6 w-6 text-primary" />
              <p className="mt-4 font-semibold">{item.title}</p>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
              <Button asChild variant="outline" className="mt-5"><Link to={item.to}>Open workspace <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BackOfficeLaunchpad({
  summary,
  workQueue,
  canManageAdminTeam,
}: {
  summary: BackOfficeSummary | null;
  workQueue: WorkQueueSummary | null;
  canManageAdminTeam: boolean;
}) {
  const rightsAttention = summary
    ? summary.attention.rights_jobs_queued +
      summary.attention.rights_jobs_failed +
      summary.attention.rights_jobs_flagged +
      summary.attention.moderation_cases_open +
      summary.attention.copyright_reports_open
    : 0;

  const businessWaiting = workQueue
    ? workQueue.business_applications + workQueue.campaign_reviews
    : 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-semibold">What needs work?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open the area you need. Detailed tools remain inside each workspace.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Assignment workflow foundation comes next.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <BackOfficeActionCard
          icon={BellRing}
          title="Needs Attention"
          description="Open the shared work queue for items that need VYBE review or follow-up."
          to="/admin/work-queue"
          action="Open work queue"
          count={workQueue?.unread ?? 0}
          countLabel="waiting"
          attention={(workQueue?.unread ?? 0) > 0}
        />
        <BackOfficeActionCard
          icon={Users}
          title="Creator Operations"
          description="Creator accounts, access, catalog activity, plans, and creator support work."
          to="/admin/creators"
          action="Open creator operations"
          count={summary?.accounts.creators}
          countLabel="creators"
        />
        <BackOfficeActionCard
          icon={BriefcaseBusiness}
          title="Business Operations"
          description="Business requests, partner records, proposals, campaigns, offers, and approvals."
          to="/admin/businesses"
          action="Open business operations"
          count={workQueue ? businessWaiting : undefined}
          countLabel="waiting"
          attention={businessWaiting > 0}
        />
        <BackOfficeActionCard
          icon={Copyright}
          title="Rights & Content"
          description="Music rights, copyright, moderation, scans, and content review."
          to="/admin/rights"
          action="Open rights & content"
          count={summary ? rightsAttention : undefined}
          countLabel="attention items"
          attention={rightsAttention > 0}
        />
        <BackOfficeActionCard
          icon={Users}
          title="Accounts & Memberships"
          description="Member records, account review, access, memberships, and privacy operations."
          to="/admin/accounts"
          action="Open accounts"
          count={summary?.accounts.total}
          countLabel="accounts"
        />
        <BackOfficeActionCard
          icon={Activity}
          title="Platform Health"
          description="System health, operating readiness, and platform-level review."
          to="/admin/system-health"
          action="Open platform health"
        />
        {canManageAdminTeam ? (
          <BackOfficeActionCard
            icon={UserCog}
            title="Admin Team"
            description="Manage authorized staff access. Assignment controls will build from here."
            to="/admin/team"
            action="Open admin team"
          />
        ) : null}
      </div>
    </section>
  );
}

function BackOfficeActionCard({
  icon: Icon,
  title,
  description,
  to,
  action,
  count,
  countLabel,
  attention = false,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  to:
    | "/admin/work-queue"
    | "/admin/creators"
    | "/admin/businesses"
    | "/admin/rights"
    | "/admin/accounts"
    | "/admin/system-health"
    | "/admin/team";
  action: string;
  count?: number;
  countLabel?: string;
  attention?: boolean;
}) {
  return (
    <Card className={attention ? "border-primary/40 bg-primary/5" : "flex h-full flex-col"}>
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-xl bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          {typeof count === "number" ? (
            <Badge variant={attention ? "default" : "secondary"}>
              {count} {countLabel}
            </Badge>
          ) : null}
        </div>
        <p className="mt-4 font-semibold">{title}</p>
        <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
        <Button asChild variant={attention ? "default" : "outline"} className="mt-5">
          <Link to={to}>
            {action} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
function BackOfficeOverview({ summary }: { summary: BackOfficeSummary }) {
  const attentionTotal =
    summary.attention.rights_jobs_queued +
    summary.attention.rights_jobs_failed +
    summary.attention.rights_jobs_flagged +
    summary.attention.moderation_cases_open +
    summary.attention.copyright_reports_open;

  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OperatingMetric
          icon={Users}
          label="Accounts"
          value={summary.accounts.total}
          note={`${summary.accounts.creators} creators · ${summary.accounts.supporters} supporters`}
        />
        <OperatingMetric
          icon={Library}
          label="Published songs"
          value={summary.content.tracks_published}
          note={`${summary.content.tracks_draft} drafts · ${summary.content.tracks_total} total`}
        />
        <OperatingMetric
          icon={Library}
          label="Published playlists"
          value={summary.content.playlists_published}
          note={`${summary.content.playlists_total} total playlists`}
        />
        <OperatingMetric
          icon={attentionTotal ? AlertTriangle : Activity}
          label="Attention queue"
          value={attentionTotal}
          note={attentionTotal ? "Items need review" : "No active review signals"}
          attention={attentionTotal > 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Operational attention</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <AttentionItem
              label="Queued audio scans"
              value={summary.attention.rights_jobs_queued}
            />
            <AttentionItem
              label="Failed audio scans"
              value={summary.attention.rights_jobs_failed}
              urgent={summary.attention.rights_jobs_failed > 0}
            />
            <AttentionItem
              label="Flagged audio scans"
              value={summary.attention.rights_jobs_flagged}
              urgent={summary.attention.rights_jobs_flagged > 0}
            />
            <AttentionItem
              label="Open moderation cases"
              value={summary.attention.moderation_cases_open}
              urgent={summary.attention.moderation_cases_open > 0}
            />
            <AttentionItem
              label="Open copyright reports"
              value={summary.attention.copyright_reports_open}
              urgent={summary.attention.copyright_reports_open > 0}
            />
            <AttentionItem
              label="Ready creator invitations"
              value={summary.attention.invitations_ready}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Platform inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InventoryRow
              label="Videos"
              value={`${summary.content.videos_published} published · ${summary.content.videos_total} total`}
            />
            <InventoryRow
              label="Merchandise"
              value={`${summary.content.merch_active} active · ${summary.content.merch_total} total`}
            />
            <InventoryRow
              label="New accounts"
              value={`${summary.accounts.new_last_7_days} in the last 7 days`}
            />
            <InventoryRow
              label="Active memberships"
              value={
                Object.entries(summary.memberships)
                  .map(([plan, count]) => `${plan.replaceAll("_", " ")} ${count}`)
                  .join(" · ") || "No active entitlements"
              }
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function OperatingMetric({
  icon: Icon,
  label,
  value,
  note,
  attention = false,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  note: string;
  attention?: boolean;
}) {
  return (
    <Card className={attention ? "border-amber-500/40 bg-amber-500/5" : undefined}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className={`h-5 w-5 ${attention ? "text-amber-600" : "text-primary"}`} />
        </div>
        <p className="mt-3 text-3xl font-semibold">{value}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function AttentionItem({
  label,
  value,
  urgent = false,
}: {
  label: string;
  value: number;
  urgent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
      <span className="text-sm">{label}</span>
      <Badge variant={urgent ? "destructive" : "secondary"}>{value}</Badge>
    </div>
  );
}

function InventoryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-between gap-1 rounded-xl border p-3 sm:flex-row">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground sm:text-right">{value}</span>
    </div>
  );
}

function WorkAreaCard({
  icon: Icon,
  title,
  description,
  to,
  action,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  to: "/admin/creators" | "/admin/rights" | "/admin/play" | "/admin/businesses" | "/admin/team";
  action: string;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex h-full flex-col p-5">
        <Icon className="h-6 w-6 text-primary" />
        <p className="mt-4 font-semibold">{title}</p>
        <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
        <Button asChild variant="outline" className="mt-5">
          <Link to={to}>
            {action} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
