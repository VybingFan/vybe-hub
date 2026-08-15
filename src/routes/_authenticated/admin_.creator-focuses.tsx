import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import type { CreatorFocusCode } from "@/features/membership/creatorFocusAccess";
import { supabase } from "@/integrations/supabase/client";
import { adminService, type AdminCreatorRecord } from "@/services/admin/adminService";
import { creatorFocusService, type CreatorFocusCatalogItem, type CreatorFocusReadinessItem, type CreatorFocusRoleItem } from "@/services/membership/creatorFocusService";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin_/creator-focuses")({ component: AdminCreatorFocusRoute });

type AccessRow = { creator_id: string; focus_code: CreatorFocusCode; access_kind: "primary" | "additional"; status: string };

function AdminCreatorFocusRoute() { return <AdminPermissionGuard anyOf={["admin.creator.read", "admin.creator.manage", "admin.creator.membership"]}><AdminCreatorFocusPage /></AdminPermissionGuard>; }

function AdminCreatorFocusPage() {
  const [creators, setCreators] = useState<AdminCreatorRecord[]>([]);
  const [access, setAccess] = useState<AccessRow[]>([]);
  const [catalog, setCatalog] = useState<CreatorFocusCatalogItem[]>([]);
  const [roles, setRoles] = useState<CreatorFocusRoleItem[]>([]);
  const [readiness, setReadiness] = useState<CreatorFocusReadinessItem[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const load = async () => {
    try {
      const [records, focusCatalog, taxonomy, accessResult] = await Promise.all([
        adminService.listCreators(""), creatorFocusService.listCatalog(),
        creatorFocusService.listTaxonomy(),
        supabase.from("creator_focus_access" as any).select("creator_id,focus_code,access_kind,status").in("status", ["active", "grace"]),
      ]);
      if (accessResult.error) throw accessResult.error;
      setCreators(records.filter((record) => record.roles.includes("creator")));
      setCatalog(focusCatalog); setRoles(taxonomy.roles); setReadiness(taxonomy.readiness); setAccess((accessResult.data || []) as unknown as AccessRow[]);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not load creator focus access."); }
  };
  useEffect(() => { void load(); }, []);
  const visible = useMemo(() => creators.filter((creator) => `${creator.display_name} ${creator.email} ${creator.plan_code}`.toLowerCase().includes(search.toLowerCase())), [creators, search]);
  const update = async (creatorId: string, code: CreatorFocusCode, enabled: boolean) => {
    setBusy(`${creatorId}:${code}`);
    try { await creatorFocusService.adminSetAccess(creatorId, code, enabled); await load(); toast.success("Creator focus access updated."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Access could not be updated."); }
    finally { setBusy(null); }
  };
  const cycleReadiness = async (focus: CreatorFocusCode) => { const states = ["planned","foundation","available","blocked"] as const; const current = readiness.find((item) => item.focus_code === focus)?.readiness_status || "planned"; setBusy(`readiness:${focus}`); try { await creatorFocusService.adminSetReadiness(focus, states[(states.indexOf(current) + 1) % states.length]); await load(); toast.success("Focus readiness updated."); } catch(error) { toast.error(error instanceof Error ? error.message : "Readiness could not be updated."); } finally { setBusy(null); } };
  return <div className="mx-auto max-w-6xl space-y-6"><header><p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Back Office</p><h1 className="mt-1 text-3xl font-semibold">Creator Focus Access</h1><p className="mt-2 text-muted-foreground">Review taxonomy and workspace authorization. Roles and credits never grant paid focus access.</p></header><section><h2 className="text-xl font-semibold">Entertainment taxonomy</h2><div className="mt-3 grid gap-3 md:grid-cols-3">{catalog.map((focus) => { const state = readiness.find((item) => item.focus_code === focus.focus_code)?.readiness_status || focus.launch_state; return <Card key={focus.focus_code}><CardContent className="p-4"><div className="flex justify-between gap-2"><p className="font-semibold">{focus.public_name}</p><Badge variant="outline">{state}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{roles.filter((role) => role.focus_code === focus.focus_code).map((role) => role.public_name).join(" · ")}</p><Button className="mt-3" size="sm" variant="outline" disabled={busy === `readiness:${focus.focus_code}`} onClick={() => void cycleReadiness(focus.focus_code)}>Advance readiness</Button></CardContent></Card>; })}</div></section><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search creators, email, or membership" />
    <div className="space-y-4">{visible.map((creator) => { const mine = access.filter((row) => row.creator_id === creator.user_id); const codes = new Set(mine.map((row) => row.focus_code)); return <Card key={creator.user_id}><CardContent className="space-y-4 p-5"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><p className="font-semibold">{creator.display_name || "Unnamed creator"}</p><p className="text-sm text-muted-foreground">{creator.email || creator.user_id}</p></div><Badge variant="outline">{creator.plan_code.replaceAll("_", " ")}</Badge></div><div className="flex flex-wrap gap-2">{catalog.map((focus) => { const enabled = codes.has(focus.focus_code); const primary = mine.some((row) => row.focus_code === focus.focus_code && row.access_kind === "primary"); const key = `${creator.user_id}:${focus.focus_code}`; return <Button key={focus.focus_code} size="sm" variant={enabled ? "default" : "outline"} disabled={primary || busy === key || focus.launch_state === "planned"} onClick={() => void update(creator.user_id, focus.focus_code, !enabled)}>{focus.public_name}{primary ? " · primary" : enabled ? " · remove" : focus.launch_state === "planned" ? " · planned" : " · grant"}</Button>; })}</div></CardContent></Card>; })}</div>
  </div>;
}
