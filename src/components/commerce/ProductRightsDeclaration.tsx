import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { commerceRightsService, SELLER_AGREEMENT_VERSION } from "@/services/commerce/commerceRightsService";

const confirmations = [
  ["ownsMaster", "I own the master recording or have written authority to sell it."],
  ["ownsComposition", "I own the music and lyrics or have written authority covering this sale."],
  ["collaborators", "Every producer, writer, performer and collaborator has authorized this sale."],
  ["samples", "All samples and interpolations are cleared, or this recording contains none."],
  ["beatLicense", "Every beat license permits paid streams/downloads and marketplace distribution."],
  ["artwork", "I own or have permission to use the artwork and promotional material."],
  ["noConflict", "No label, publisher, distributor or other agreement conflicts with this sale."],
  ["authority", "I can legally make these promises for myself or the organization I represent."],
] as const;

export function ProductRightsDeclaration({ productId, rightsStatus }: { productId: string; rightsStatus?: string }) {
  const [open, setOpen] = useState(false);
  const client = useQueryClient();
  const submit = useMutation({
    mutationFn: (values: Record<string, unknown>) => commerceRightsService.submit(productId, values),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["commerce-products"] });
      toast.success("Rights declaration submitted for VYBE review.");
      setOpen(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not submit rights information."),
  });
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values: Record<string, unknown> = {};
    confirmations.forEach(([name]) => { values[name] = form.get(name) === "on"; });
    values.cover = form.get("cover") === "on";
    values.thirdParty = form.get("thirdParty") === "on";
    values.contributors = String(form.get("contributors") || "");
    values.rightsNotes = String(form.get("rightsNotes") || "");
    values.evidenceNotes = String(form.get("evidenceNotes") || "");
    submit.mutate(values);
  };
  if (!open) return <Button size="sm" variant="outline" onClick={() => setOpen(true)}><ShieldCheck className="mr-2 h-4 w-4" />{rightsStatus === "approved" ? "Rights approved" : "Complete rights review"}</Button>;
  return <form onSubmit={handleSubmit} className="mt-4 w-full space-y-4 rounded-xl border bg-muted/30 p-4">
    <div><p className="font-semibold">Music rights declaration</p><p className="text-xs text-muted-foreground">Required before sale. Agreement version: {SELLER_AGREEMENT_VERSION}</p></div>
    <div className="space-y-3">{confirmations.map(([name, label]) => <Label key={name} className="flex items-start gap-3 text-sm font-normal"><Checkbox name={name} required className="mt-0.5" /><span>{label}</span></Label>)}</div>
    <div className="rounded-lg border border-amber-500/30 p-3"><p className="text-sm font-medium">Blocked during initial launch</p><Label className="mt-2 flex items-center gap-2 text-sm font-normal"><Checkbox name="cover" />This is a cover song.</Label><Label className="mt-2 flex items-center gap-2 text-sm font-normal"><Checkbox name="thirdParty" />This contains third-party music, samples or other material requiring enhanced review.</Label></div>
    <div><Label>Contributors and roles</Label><Textarea name="contributors" className="mt-2" placeholder="List writers, producers, featured artists and ownership information." required /></div>
    <div><Label>Rights or license details</Label><Textarea name="rightsNotes" className="mt-2" placeholder="Describe ownership, beat license, splits and permissions." required /></div>
    <div><Label>Evidence available</Label><Textarea name="evidenceNotes" className="mt-2" placeholder="List agreements, licenses, split sheets or registrations you can provide." /></div>
    <p className="text-xs leading-5 text-muted-foreground">Submitting records your acceptance of the current Creator Seller Agreement and certifies this information is complete and accurate. This interface is not a substitute for legal advice.</p>
    <div className="flex gap-2"><Button type="submit" disabled={submit.isPending}>Submit for review</Button><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
  </form>;
}
