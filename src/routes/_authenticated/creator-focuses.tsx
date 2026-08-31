import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Film, LockKeyhole, Music2, Sparkles, Workflow } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CREATOR_FOCUS_ADD_ON_PRICING, type CreatorFocusCode } from "@/features/membership/creatorFocusAccess";
import { useMembership } from "@/hooks/useMembership";
import { creatorFocusService } from "@/services/membership/creatorFocusService";
import { focusSubscriptionService } from "@/services/membership/focusSubscriptionService";

export const Route = createFileRoute("/_authenticated/creator-focuses")({
  component: () => <RoleGuard allow={["creator", "admin"]}><CreatorFocusesPage /></RoleGuard>,
});

type Confirmation = { kind: "primary" | "remove"; code: CreatorFocusCode; name: string } | null;

function CreatorFocusesPage() {
  const client = useQueryClient();
  const { data: membership } = useMembership();
  const summary = useQuery({ queryKey: ["creator-focus-access"], queryFn: creatorFocusService.getMine });
  const catalog = useQuery({ queryKey: ["creator-focus-catalog"], queryFn: creatorFocusService.listCatalog });
  const taxonomy = useQuery({ queryKey: ["creator-focus-taxonomy"], queryFn: creatorFocusService.listTaxonomy });
  const subscription = useQuery({ queryKey: ["creator-focus-subscription"], queryFn: focusSubscriptionService.getMine });
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const refresh = async () => { await client.invalidateQueries({ queryKey: ["creator-focus-access"] }); };
  const action = useMutation({
    mutationFn: async (request: { kind: "add" | "primary" | "remove"; code: CreatorFocusCode }) => {
      if (request.kind === "add") return creatorFocusService.addFocus(request.code);
      if (request.kind === "primary") return creatorFocusService.setPrimary(request.code, true);
      return creatorFocusService.removeFocus(request.code, true);
    },
    onSuccess: async () => { await refresh(); toast.success("Creator focus access updated."); setConfirmation(null); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Focus access could not be updated."),
  });
  const access = summary.data?.access || [];
  const accessCodes = new Set(access.map((item) => item.focus_code));
  const capacity = summary.data?.focus_limit || subscription.data?.focus_capacity || 1;
  const count = summary.data?.active_focus_count || 0;
  const plan = membership?.plan_code?.replaceAll("_", " ") || "creator membership";

  return <div className="mx-auto max-w-6xl space-y-7 min-[900px]:space-y-5">
    <header>
      <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">Creator Studio</p>
      <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Creator Focuses</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">Each focus is a separate creator workspace. Your primary focus controls your default Studio experience; changing it never deletes content.</p>
    </header>

    <div className="grid gap-4 sm:grid-cols-3 min-[900px]:gap-3">
      <Summary label="Membership" value={plan} />
      <Summary label="Active workspaces" value={`${count} of ${capacity}`} />
      <Summary label="Primary focus" value={access.find((item) => item.access_kind === "primary")?.public_name || "Music"} />
    </div>

    <section className="space-y-3">
      <div><h2 className="text-2xl font-semibold">Your workspaces</h2><p className="text-sm text-muted-foreground">Primary is your starting workspace. Additional workspaces retain their own content and usage.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        {access.map((item) => <Card key={item.focus_code}><CardContent className="space-y-4 p-5 min-[900px]:space-y-3 min-[900px]:p-4">
          <div className="flex items-start justify-between gap-3"><div className="flex gap-3">{item.focus_code === "music" ? <Music2 className="mt-1 h-5 w-5 text-primary" /> : <Film className="mt-1 h-5 w-5 text-primary" />}<div><h3 className="font-semibold">{item.public_name}</h3><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div></div><Badge variant={item.access_kind === "primary" ? "default" : "secondary"}>{item.access_kind}</Badge></div>
          <div className="flex flex-wrap gap-2">
            {item.access_kind !== "primary" ? <Button size="sm" variant="outline" onClick={() => setConfirmation({ kind: "primary", code: item.focus_code, name: item.public_name })}>Make primary</Button> : null}
            {item.access_kind === "additional" ? <Button size="sm" variant="ghost" onClick={() => setConfirmation({ kind: "remove", code: item.focus_code, name: item.public_name })}>Remove workspace</Button> : null}
            {item.launch_state === "foundation" ? <Badge variant="outline">Foundation ready</Badge> : <Badge variant="outline"><Check className="mr-1 h-3 w-3" /> Available</Badge>}
          </div>
        </CardContent></Card>)}
      </div>
    </section>

    <section className="space-y-3">
      <div><h2 className="text-2xl font-semibold">Add a creator focus</h2><p className="text-sm text-muted-foreground">Adding a focus creates another workspace. It is different from changing which authorized focus is primary.</p></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 min-[900px]:gap-3">
        {(catalog.data || []).filter((item) => !accessCodes.has(item.focus_code)).map((item) => {
          const planned = item.launch_state === "planned";
          const room = count < capacity;
          const roles = taxonomy.data?.roles.filter((role) => role.focus_code === item.focus_code) || [];
          const categories = taxonomy.data?.categories.filter((category) => category.focus_code === item.focus_code) || [];
          const readiness = taxonomy.data?.readiness.find((entry) => entry.focus_code === item.focus_code);
          return <Card key={item.focus_code}><CardContent className="flex h-full flex-col gap-4 p-5 min-[900px]:gap-3 min-[900px]:p-4"><div className="flex items-center justify-between"><Workflow className="h-5 w-5 text-primary" /><Badge variant="outline">{planned ? "Planned" : item.launch_state === "foundation" ? "Foundation" : "Available"}</Badge></div><div className="flex-1"><h3 className="font-semibold">{item.public_name}</h3><p className="mt-1 text-sm text-muted-foreground">{item.description}</p>{readiness ? <p className="mt-3 text-xs text-primary min-[900px]:mt-2">{readiness.public_message}</p> : null}<div className="mt-3 flex flex-wrap gap-1 min-[900px]:mt-2">{roles.slice(0,4).map((role) => <Badge key={role.role_code} variant="secondary">{role.public_name}</Badge>)}{roles.length > 4 ? <Badge variant="secondary">+{roles.length - 4} roles</Badge> : null}</div><p className="mt-3 text-xs text-muted-foreground min-[900px]:mt-2">Discovery: {categories.map((category) => category.creator_discovery_categories?.public_name).filter(Boolean).join(" · ") || "Categories planned"}</p></div><Button disabled={planned || !room || action.isPending} variant={room && !planned ? "default" : "outline"} onClick={() => action.mutate({ kind: "add", code: item.focus_code })}>{planned ? "Coming later" : room ? "Add workspace" : <><LockKeyhole className="mr-2 h-4 w-4" />Upgrade required</>}</Button></CardContent></Card>;
        })}
      </div>
    </section>

    <Pricing planCode={membership?.plan_code || ""} founding={membership?.plan_code === "founding_beta"} />

    <AlertDialog open={Boolean(confirmation)} onOpenChange={(open) => !open && setConfirmation(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirmation?.kind === "primary" ? `Make ${confirmation?.name} primary?` : `Remove ${confirmation?.name} workspace?`}</AlertDialogTitle><AlertDialogDescription>{confirmation?.kind === "primary" ? "This changes your default Creator Studio focus. It does not delete or move content in any workspace." : "Access will be removed, but existing content is preserved. This does not cancel a paid focus subscription."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={action.isPending} onClick={() => confirmation && action.mutate({ kind: confirmation.kind, code: confirmation.code })}>Confirm change</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function Summary({ label, value }: { label: string; value: string }) { return <Card><CardContent className="p-5 min-[900px]:p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold capitalize">{value}</p></CardContent></Card>; }

function Pricing({ planCode, founding }: { planCode: string; founding: boolean }) {
  if (founding) return <Card className="border-primary/30"><CardContent className="flex gap-4 p-6 min-[900px]:p-4"><Sparkles className="h-6 w-6 text-primary" /><div><h2 className="font-semibold">Founding Creator test access</h2><p className="mt-1 text-sm text-muted-foreground">Up to five creator focuses are available for testing during the founding phase. No focus add-on checkout is required.</p></div></CardContent></Card>;
  const pro = planCode === "creator_pro"; const studio = planCode === "creator_studio"; const paid = ["creator_plus", "creator_pro", "creator_studio"].includes(planCode);
  return <Card><CardContent className="space-y-4 p-6 min-[900px]:space-y-3 min-[900px]:p-4"><div><h2 className="text-xl font-semibold">Focus subscription options</h2><p className="mt-1 text-sm text-muted-foreground">Checkout is not open yet. These options are shown now so testing and pricing remain clear.</p></div><div className="grid gap-3 md:grid-cols-2 min-[900px]:gap-2.5"><div className="rounded-xl border p-4 min-[900px]:p-3"><p className="font-semibold">Second Creator Focus</p><p className="mt-1 text-sm">${CREATOR_FOCUS_ADD_ON_PRICING.secondFocus.monthly}/month or ${CREATOR_FOCUS_ADD_ON_PRICING.secondFocus.annual}/year</p><p className="mt-2 text-xs text-muted-foreground">Available to Plus, Pro, and Studio. Adds one workspace.</p></div>{pro || studio ? <div className="rounded-xl border p-4 min-[900px]:p-3"><p className="font-semibold">{studio ? "Studio" : "Pro"} Multi-Focus</p><p className="mt-1 text-sm">${studio ? CREATOR_FOCUS_ADD_ON_PRICING.studioMultiFocus.monthly : CREATOR_FOCUS_ADD_ON_PRICING.proMultiFocus.monthly}/month · up to five</p><p className="mt-2 text-xs text-muted-foreground">Supports the higher storage, analytics, moderation, and usage needs of three or more workspaces.</p></div> : null}</div>{!paid ? <p className="text-sm text-muted-foreground">Creator Free includes one focus. Upgrade the base membership before adding another.</p> : null}</CardContent></Card>;
}
