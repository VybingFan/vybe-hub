import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, Search, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { AdminDeletionPanel } from "@/components/accountDeletion/AdminDeletionPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  adminService,
  type AdminCreatorRecord,
} from "@/services/admin/adminService";

export const Route = createFileRoute("/_authenticated/admin_/accounts")({
  component: AdminAccountsRoute,
});

function AdminAccountsRoute() {
  return (
    <AdminPermissionGuard anyOf={["admin.accounts.read"]}>
      <AdminAccountsPage />
    </AdminPermissionGuard>
  );
}

function AdminAccountsPage() {
  const [records, setRecords] = useState<AdminCreatorRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query = "") => {
    setLoading(true);

    try {
      const results = await adminService.listCreators(query);
      setRecords(results);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load accounts",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      total: records.length,
      creators: records.filter((record) =>
        record.roles.includes("creator"),
      ).length,
      supporters: records.filter((record) =>
        record.roles.includes("supporter"),
      ).length,
      businesses: records.filter((record) =>
        record.roles.includes("business"),
      ).length,
    }),
    [records],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Back Office
          </Link>
        </Button>

        <div className="mt-3 flex items-center gap-2 text-primary">
          <UsersRound className="h-5 w-5" />
          Members & Accounts
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Account directory
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          The complete account registry for supporters, creators,
          businesses, and administrators.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        {Object.entries(counts).map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-xs capitalize text-muted-foreground">
                {label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void load(search);
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

          <Input
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search member name or email"
          />
        </div>

        <Button type="submit">
          Search
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Refresh"
          onClick={() => void load(search)}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </form>

      {loading ? (
        <p className="text-sm text-muted-foreground">
          Loading accounts…
        </p>
      ) : null}

      {!loading && !records.length ? (
        <Card>
          <CardContent className="p-7 text-sm text-muted-foreground">
            No accounts match this search.
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {records.map((record) => (
          <Card key={record.user_id}>
            <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-start">
              <div>
                <p className="font-semibold">
                  {record.display_name || "Unnamed account"}
                </p>

                <p className="text-sm text-muted-foreground">
                  {record.email || "No email available"}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Joined{" "}
                  {new Date(record.joined_at).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-3 sm:max-w-md">
                <div className="flex flex-wrap items-start gap-2">
                  {record.roles.length ? (
                    record.roles.map((role) => (
                      <Badge
                        key={role}
                        variant={
                          role === "admin"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">
                      role incomplete
                    </Badge>
                  )}

                  {record.roles.includes("creator") ? (
                    <Badge variant="outline">
                      {record.plan_code.replaceAll("_", " ")}
                    </Badge>
                  ) : null}
                </div>

                <AdminPermissionGuard
                  anyOf={["admin.accounts.delete"]}
                  silent
                >
                  <AdminDeletionPanel
                    userId={record.user_id}
                    email={record.email}
                  />
                </AdminPermissionGuard>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}