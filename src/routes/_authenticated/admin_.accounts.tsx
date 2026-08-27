import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, Search, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { AdminDeletionPanel } from "@/components/accountDeletion/AdminDeletionPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminService,
  type AdminCreatorRecord,
} from "@/services/admin/adminService";
import { adminTeamService } from "@/services/admin/adminTeamService";

export const Route = createFileRoute("/_authenticated/admin_/accounts")({
  component: AdminAccountsRoute,
});

const PLAN_ORDER = [
  "founding_beta",
  "creator_studio",
  "creator_pro",
  "creator_plus",
  "creator_free",
  "none",
];

function formatPlan(code: string) {
  const labels: Record<string, string> = {
    founding_beta: "Founding",
    creator_free: "Free",
    creator_plus: "Plus",
    creator_pro: "Pro",
    creator_studio: "Studio",
    none: "No plan",
  };
  return labels[code] || code.replaceAll("_", " ");
}

function formatFocus(code: string) {
  return code
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function AdminAccountsRoute() {
  return (
    <AdminPermissionGuard anyOf={["admin.accounts.read"]}>
      <AdminAccountsPage />
    </AdminPermissionGuard>
  );
}

function AccountRow({
  record,
  focusLabel,
  canDeleteAccounts,
}: {
  record: AdminCreatorRecord;
  focusLabel?: string;
  canDeleteAccounts: boolean;
}) {
  return (
    <tr className="h-9 border-t align-middle hover:bg-muted/20">
      <td className="max-w-0 px-2 py-1.5">
        <div className="truncate text-[12px] font-semibold leading-4">
          {record.creator_name || record.display_name || "Unnamed account"}
        </div>
        <div className="truncate text-[10px] leading-3.5 text-muted-foreground">
          {record.email || "No email available"}
        </div>
      </td>

      <td className="whitespace-nowrap px-2 py-1.5 text-[10px] text-muted-foreground">
        {focusLabel || "â€”"}
      </td>

      <td className="whitespace-nowrap px-2 py-1.5">
        <Badge variant="outline" className="h-[18px] rounded-md px-1.5 text-[9px] leading-none">
          {formatPlan(record.plan_code)}
        </Badge>
      </td>

      <td className="px-2 py-1.5">
        <div className="flex flex-wrap gap-1">
          {record.roles.length ? (
            record.roles.map((role) => (
              <Badge
                key={role}
                variant={role === "admin" ? "default" : "secondary"}
                className="h-[18px] rounded-md px-1.5 text-[9px] leading-none"
              >
                {role}
              </Badge>
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground">role incomplete</span>
          )}
        </div>
      </td>

      <td className="whitespace-nowrap px-2 py-1.5 text-right text-[10px] text-muted-foreground">
        {new Date(record.joined_at).toLocaleDateString()}
      </td>

      <td className="w-9 px-1 py-1 text-right">
        {canDeleteAccounts ? (
          <AdminDeletionPanel
            userId={record.user_id}
            email={record.email}
            compact
          />
        ) : null}
      </td>
    </tr>
  );
}

function AdminAccountsPage() {
  const [records, setRecords] = useState<AdminCreatorRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [canDeleteAccounts, setCanDeleteAccounts] = useState(false);

  const load = useCallback(async (query = "") => {
    setLoading(true);
    try {
      setRecords(await adminService.listCreators(query));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load accounts",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

    let active = true;

    void adminTeamService
      .getMyAccess()
      .then((access) => {
        if (active) {
          setCanDeleteAccounts(
            access.status === "active" &&
              access.permissions.includes("admin.accounts.delete"),
          );
        }
      })
      .catch(() => {
        if (active) setCanDeleteAccounts(false);
      });

    return () => {
      active = false;
    };
  }, [load]);

  const counts = useMemo(
    () => ({
      total: records.length,
      creators: records.filter((record) => record.roles.includes("creator")).length,
      supporters: records.filter((record) => record.roles.includes("supporter")).length,
      businesses: records.filter((record) => record.roles.includes("business")).length,
    }),
    [records],
  );

  const creators = useMemo(
    () => records.filter((record) => record.roles.includes("creator")),
    [records],
  );

  const groupedCreators = useMemo(() => {
    const groups = new Map<string, Map<string, AdminCreatorRecord[]>>();

    creators.forEach((record) => {
      const focuses =
        record.focus_codes && record.focus_codes.length
          ? record.focus_codes
          : ["unassigned"];

      focuses.forEach((focusCode) => {
        if (!groups.has(focusCode)) groups.set(focusCode, new Map());
        const tiers = groups.get(focusCode)!;
        const planCode = record.plan_code || "none";
        const rows = tiers.get(planCode) ?? [];
        rows.push(record);
        tiers.set(planCode, rows);
      });
    });

    return [...groups.entries()].sort(([a], [b]) => {
      if (a === "unassigned") return 1;
      if (b === "unassigned") return -1;
      return a.localeCompare(b);
    });
  }, [creators]);

  const otherAccounts = useMemo(
    () => records.filter((record) => !record.roles.includes("creator")),
    [records],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-2.5">
      <header className="space-y-0.5">
        <Button variant="ghost" size="sm" asChild className="h-7 px-1.5 text-xs">
          <Link to="/admin">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to Back Office
          </Link>
        </Button>

        <div className="flex items-center gap-1.5 text-xs text-primary">
          <UsersRound className="h-3.5 w-3.5" />
          Members & Accounts
        </div>

        <h1 className="text-xl font-semibold tracking-tight">Account directory</h1>
        <p className="text-xs text-muted-foreground">
          Creators grouped by focus and membership tier.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-1.5">
        {Object.entries(counts).map(([label, value]) => (
          <div
            key={label}
            className="flex h-7 min-w-[100px] items-center justify-between gap-3 rounded-md border bg-card px-2"
          >
            <span className="text-sm font-semibold">{value}</span>
            <span className="text-[9px] capitalize text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <form
        className="flex gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          void load(search);
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-xs"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search creator/member name or email"
          />
        </div>

        <Button type="submit" size="sm" className="h-8 px-3 text-xs">
          Search
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label="Refresh"
          onClick={() => void load(search)}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </form>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading accountsâ€¦</p>
      ) : null}

      {!loading && !records.length ? (
        <div className="rounded-md border px-3 py-2 text-xs text-muted-foreground">
          No accounts match this search.
        </div>
      ) : null}

      {!loading && records.length ? (
        <div className="overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[32%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[8%]" />
              </colgroup>

              <thead className="bg-muted/25">
                <tr className="text-left text-[9px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-1.5 font-medium">Creator / Account</th>
                  <th className="px-2 py-1.5 font-medium">Focus</th>
                  <th className="px-2 py-1.5 font-medium">Tier</th>
                  <th className="px-2 py-1.5 font-medium">Role</th>
                  <th className="px-2 py-1.5 text-right font-medium">Joined</th>
                  <th className="px-1 py-1.5 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {groupedCreators.map(([focusCode, tiers]) => (
                  <>
                    <tr key={`focus-${focusCode}`} className="h-6 border-t border-primary/20 bg-primary/[0.08]">
                      <td colSpan={6} className="px-2 py-1 text-[10px] font-semibold">
                        {focusCode === "unassigned"
                          ? "Creator Focus Not Assigned"
                          : formatFocus(focusCode)}
                      </td>
                    </tr>

                    {PLAN_ORDER.map((planCode) => {
                      const rows = tiers.get(planCode) ?? [];
                      if (!rows.length) return null;

                      return (
                        <>
                          <tr
                            key={`tier-${focusCode}-${planCode}`}
                            className="h-5 border-t bg-muted/25"
                          >
                            <td colSpan={6} className="px-2 py-[3px]">
                              <span className="text-[9px] font-semibold uppercase tracking-wide">
                                {formatPlan(planCode)}
                              </span>
                              <span className="ml-2 text-[9px] text-muted-foreground">
                                {rows.length}
                              </span>
                            </td>
                          </tr>

                          {rows.map((record) => (
                            <AccountRow
                              key={`${focusCode}-${planCode}-${record.user_id}`}
                              record={record}
                              canDeleteAccounts={canDeleteAccounts}
                              focusLabel={
                                focusCode === "unassigned"
                                  ? "Unassigned"
                                  : formatFocus(focusCode)
                              }
                            />
                          ))}
                        </>
                      );
                    })}
                  </>
                ))}

                {otherAccounts.length ? (
                  <>
                    <tr className="h-6 border-t border-primary/20 bg-primary/[0.08]">
                      <td colSpan={6} className="px-2 py-1 text-[10px] font-semibold">
                        Other Accounts
                      </td>
                    </tr>
                    {otherAccounts.map((record) => (
                      <AccountRow key={`other-${record.user_id}`} record={record} />
                    ))}
                  </>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
