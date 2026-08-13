import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { commerceRightsService, type RightsDecision } from "@/services/commerce/commerceRightsService";

export const Route = createFileRoute("/_authenticated/admin_/commerce-rights")({ component: () => <RoleGuard allow={["admin"]}><CommerceRightsAdmin /></RoleGuard> });

function CommerceRightsAdmin() {
  const client = useQueryClient();
  const [notes, setNotes] = useState<Record<string,string>>({});
  const { data: items = [], isLoading } = useQuery({ queryKey: ["commerce-rights-review"], queryFn: commerceRightsService.reviewQueue });
  const review = useMutation({ mutationFn: ({ id, decision }: { id: string; decision: RightsDecision }) => commerceRightsService.review(id, decision, notes[id] || ""), onSuccess: async () => { await client.invalidateQueries({ queryKey: ["commerce-rights-review"] }); toast.success("Rights review saved."); }, onError: (error) => toast.error(error instanceof Error ? error.message : "Review failed.") });
  return <div className="mx-auto max-w-6xl space-y-5"><WorkspacePageHeader eyebrow="Trust and safety" title="Music rights review" description="Review creator declarations before any music product can be activated for sale." status={<Badge variant="outline">{items.length} pending</Badge>} />
    {isLoading ? <p>Loading review queue...</p> : items.length ? items.map((item: any) => { const declaration = Array.isArray(item.commerce_rights_declarations) ? item.commerce_rights_declarations[0] : item.commerce_rights_declarations; return <Card key={item.id}><CardContent className="space-y-4 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{item.title}</h2><p className="text-sm text-muted-foreground">{item.product_type} - creator {item.creator_id}</p></div><Badge>{item.rights_status}</Badge></div><div className="grid gap-3 text-sm md:grid-cols-2"><p><strong>Contributors:</strong> {declaration?.contributors || "Not provided"}</p><p><strong>Rights details:</strong> {declaration?.rights_notes || "Not provided"}</p><p><strong>Evidence:</strong> {declaration?.evidence_notes || "Not listed"}</p><p><strong>Agreement:</strong> {declaration?.seller_agreement_version || "Unknown"}</p></div><Textarea value={notes[item.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Required review notes for changes or rejection" /><div className="flex flex-wrap gap-2"><Button onClick={() => review.mutate({ id: item.id, decision: "approved" })}><ShieldCheck className="mr-2 h-4 w-4" />Approve</Button><Button variant="outline" onClick={() => review.mutate({ id: item.id, decision: "changes_requested" })}>Request changes</Button><Button variant="destructive" onClick={() => review.mutate({ id: item.id, decision: "rejected" })}>Reject</Button></div></CardContent></Card>; }) : <Card><CardContent className="p-8 text-center text-muted-foreground">No rights declarations require review.</CardContent></Card>}
  </div>;
}
