import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BellRing,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  Megaphone,
  Plus,
  RefreshCw,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { BackOfficeNotificationControls } from "@/components/admin/BackOfficeNotificationControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminNotificationService,
  type AdminNotification,
  type WorkQueueSummary,
} from "@/services/admin/adminNotificationService";
import {
  adminTeamService,
  type AdminAccess,
  type AdminTeamMember,
} from "@/services/admin/adminTeamService";
import {
  adminWorkService,
  type AdminWorkItem,
  type AdminWorkPriority,
  type AdminWorkStatus,
  type AdminWorkSummary,
} from "@/services/admin/adminWorkService";

export const Route = createFileRoute("/_authenticated/admin_/work-queue")({
  component: WorkQueuePage,
});

type WorkView = "my" | "unassigned" | "all";

const statusLabels: Record<AdminWorkStatus, string> = {
  unassigned: "Unassigned",
  assigned: "Assigned",
  in_progress: "In Progress",
  waiting: "Waiting",
  completed: "Completed",
  cancelled: "Cancelled",
};

function WorkQueuePage() {
  const [summary, setSummary] = useState<WorkQueueSummary | null>(null);
  const [workSummary, setWorkSummary] = useState<AdminWorkSummary | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [items, setItems] = useState<AdminWorkItem[]>([]);
  const [access, setAccess] = useState<AdminAccess | null>(null);
  const [teamMembers, setTeamMembers] = useState<AdminTeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [view, setView] = useState<WorkView>("my");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const canManage =
    access?.status === "active" && access.permissions.includes("admin.team.manage");

  const load = useCallback(async () => {
    try {
      await adminWorkService.syncAlerts();
      const [nextSummary, nextNotifications, nextItems, nextAccess, nextWorkSummary, userId] =
        await Promise.all([
          adminNotificationService.summary(),
          adminNotificationService.list(),
          adminWorkService.list(),
          adminTeamService.getMyAccess(),
          adminWorkService.summary(),
          adminWorkService.currentUserId(),
        ]);

      setSummary(nextSummary);
      setNotifications(nextNotifications);
      setItems(nextItems);
      setAccess(nextAccess);
      setWorkSummary(nextWorkSummary);
      setCurrentUserId(userId);

      if (
        nextAccess.status === "active" &&
        nextAccess.permissions.includes("admin.team.manage")
      ) {
        const team = await adminTeamService.dashboard();
        setTeamMembers(team.members.filter((member) => member.status === "active"));
      } else {
        setTeamMembers([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load the work queue");
    }
  }, []);

  useEffect(() => void load(), [load]);

  const filteredItems = useMemo(() => {
    if (view === "my") return items.filter((item) => item.assigned_to === currentUserId);
    if (view === "unassigned")
      return items.filter((item) => item.status === "unassigned" && !item.assigned_to);
    return items;
  }, [items, currentUserId, view]);

  async function createManualWork(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    try {
      const dueValue = String(form.get("dueAt") || "").trim();
      await adminWorkService.create({
        sourceType: "manual",
        sourceId: crypto.randomUUID(),
        category: String(form.get("category") || "operations").trim(),
        title: String(form.get("title") || "").trim(),
        description: String(form.get("description") || "").trim() || null,
        actionPath: String(form.get("actionPath") || "").trim() || null,
        priority: String(form.get("priority") || "normal") as AdminWorkPriority,
        dueAt: dueValue ? new Date(dueValue).toISOString() : null,
      });
      toast.success("Back Office work item created");
      setShowCreate(false);
      formElement.reset();
      await load();
      setView("unassigned");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create work item");
    } finally {
      setSaving(false);
    }
  }

  async function assign(itemId: string, userId: string) {
    if (!userId) return;
    try {
      await adminWorkService.assign(itemId, userId);
      toast.success("Work assigned");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not assign work");
    }
  }

  async function changeStatus(item: AdminWorkItem, status: Exclude<AdminWorkStatus, "unassigned">) {
    try {
      await adminWorkService.update({ workItemId: item.id, status });
      toast.success(`Work marked ${statusLabels[status].toLowerCase()}`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update work status");
    }
  }

  return (
    <AdminPermissionGuard anyOf={["admin.work_queue.read"]}>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <BellRing className="h-5 w-5" /> Internal operations
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Work Queue
            </h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              See what is assigned to you, claim or assign unowned work, and track operational
              progress without losing the original VYBE record.
            </p>
          </div>
          <div className="flex gap-2">
            {canManage ? (
              <Button variant="outline" onClick={() => setShowCreate((value) => !value)}>
                <Plus className="mr-2 h-4 w-4" /> New work item
              </Button>
            ) : null}
            <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QueueMetric
            icon={UserRoundCheck}
            label="My open work"
            value={workSummary?.my_open ?? 0}
          />
          <QueueMetric
            icon={ClipboardList}
            label="Unassigned work"
            value={workSummary?.unassigned ?? 0}
          />
          <QueueMetric
            icon={BellRing}
            label="My urgent work"
            value={workSummary?.my_urgent ?? 0}
          />
          <QueueMetric
            icon={Clock3}
            label="My overdue work"
            value={workSummary?.overdue ?? 0}
          />
        </div>

        <BackOfficeNotificationControls />

        {showCreate && canManage ? (
          <Card>
            <CardHeader>
              <CardTitle>Create Back Office work</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={createManualWork}>
                <div className="space-y-2">
                  <Label htmlFor="work-title">Title</Label>
                  <Input id="work-title" name="title" required placeholder="Review creator support issue" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work-category">Category</Label>
                  <Input id="work-category" name="category" required placeholder="creator_support" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="work-description">Description</Label>
                  <Textarea id="work-description" name="description" placeholder="What needs to be handled?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work-action-path">VYBE link</Label>
                  <Input id="work-action-path" name="actionPath" placeholder="/admin/creators" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work-priority">Priority</Label>
                  <select
                    id="work-priority"
                    name="priority"
                    defaultValue="normal"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work-due">Due date</Label>
                  <Input id="work-due" name="dueAt" type="datetime-local" />
                </div>
                <div className="flex items-end">
                  <Button disabled={saving}>{saving ? "Creating..." : "Create work item"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant={view === "my" ? "default" : "outline"} onClick={() => setView("my")}>
              My Work ({workSummary?.my_open ?? 0})
            </Button>
            <Button
              variant={view === "unassigned" ? "default" : "outline"}
              onClick={() => setView("unassigned")}
            >
              Unassigned ({workSummary?.unassigned ?? 0})
            </Button>
            <Button variant={view === "all" ? "default" : "outline"} onClick={() => setView("all")}>
              All Active ({items.length})
            </Button>
          </div>

          {filteredItems.length ? (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <WorkItemCard
                  key={item.id}
                  item={item}
                  currentUserId={currentUserId}
                  canManage={Boolean(canManage)}
                  teamMembers={teamMembers}
                  onAssign={assign}
                  onStatus={changeStatus}
                  onRefresh={load}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                {view === "my"
                  ? "Nothing is assigned to you right now."
                  : view === "unassigned"
                    ? "No unassigned work is waiting."
                    : "No active Back Office work items yet."}
              </CardContent>
            </Card>
          )}
        </section>

        {summary ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QueueMetric icon={BellRing} label="Unread alerts" value={summary.unread} />
            <QueueMetric
              icon={BriefcaseBusiness}
              label="Business applications"
              value={summary.business_applications}
            />
            <QueueMetric
              icon={Megaphone}
              label="Campaign reviews"
              value={summary.campaign_reviews}
            />
            <QueueMetric
              icon={FileCheck2}
              label="Document reviews"
              value={summary.document_reviews}
            />
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Existing VYBE alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{item.title}</p>
                      <Badge variant={item.status === "unread" ? "default" : "outline"}>
                        {item.status}
                      </Badge>
                      <Badge variant="secondary">{item.priority}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      onClick={() => void adminNotificationService.markRead(item.id)}
                    >
                      <Link to={item.action_path}>Open</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        await adminNotificationService.resolve(item.id);
                        await load();
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Resolve
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No unread or active notifications.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPermissionGuard>
  );
}

function WorkItemCard({
  item,
  currentUserId,
  canManage,
  teamMembers,
  onAssign,
  onStatus,
  onRefresh,
}: {
  item: AdminWorkItem;
  currentUserId: string | null;
  canManage: boolean;
  teamMembers: AdminTeamMember[];
  onAssign: (itemId: string, userId: string) => Promise<void>;
  onStatus: (
    item: AdminWorkItem,
    status: Exclude<AdminWorkStatus, "unassigned">,
  ) => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const [notes, setNotes] = useState(item.notes ?? "");
  const [editingNotes, setEditingNotes] = useState(false);
  const isMine = item.assigned_to === currentUserId;
  const canUpdate = canManage || isMine;
  const assignee = teamMembers.find((member) => member.user_id === item.assigned_to);

  async function saveNotes() {
    try {
      await adminWorkService.update({ workItemId: item.id, notes });
      toast.success("Work notes saved");
      setEditingNotes(false);
      await onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save notes");
    }
  }

  return (
    <Card className={item.priority === "urgent" ? "border-destructive/40" : undefined}>
      <CardContent className="p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{item.title}</p>
              <Badge variant={item.priority === "urgent" ? "destructive" : "secondary"}>
                {item.priority}
              </Badge>
              <Badge variant="outline">{statusLabels[item.status]}</Badge>
              <Badge variant="outline">{item.category.replaceAll("_", " ")}</Badge>
            </div>
            {item.description ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span>
                Assignee:{" "}
                {item.assigned_to
                  ? assignee?.display_name || (isMine ? "You" : "Assigned administrator")
                  : "Unassigned"}
              </span>
              <span>
                Due: {item.due_at ? new Date(item.due_at).toLocaleString() : "No due date"}
              </span>
              <span>Updated: {new Date(item.updated_at).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
            {item.action_path ? (
              <Button asChild variant="outline" size="sm">
                <Link to={item.action_path}>Open source</Link>
              </Button>
            ) : null}

            {canManage ? (
              <select
                aria-label={`Assign ${item.title}`}
                value={item.assigned_to ?? ""}
                onChange={(event) => void onAssign(item.id, event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Assign to...</option>
                {teamMembers.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.display_name || member.email || member.user_id}
                  </option>
                ))}
              </select>
            ) : null}

            {canUpdate && item.assigned_to ? (
              <select
                aria-label={`Status for ${item.title}`}
                value={item.status}
                onChange={(event) =>
                  void onStatus(
                    item,
                    event.target.value as Exclude<AdminWorkStatus, "unassigned">,
                  )
                }
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting">Waiting</option>
                <option value="completed">Completed</option>
                {canManage ? <option value="cancelled">Cancelled</option> : null}
              </select>
            ) : null}
          </div>
        </div>

        {canUpdate ? (
          <div className="mt-4 border-t pt-4">
            {editingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add internal work notes..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void saveNotes()}>
                    Save notes
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setEditingNotes(true)}>
                {item.notes ? "Edit work notes" : "Add work notes"}
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function QueueMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BellRing;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <Icon className="h-5 w-5 text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
