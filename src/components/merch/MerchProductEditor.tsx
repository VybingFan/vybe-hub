import { FormEvent, useState } from "react";
import { Archive, ImagePlus, Loader2, Pencil, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MERCH_AVAILABILITY, MERCH_CATEGORIES, type MerchProduct } from "@/features/merch/schema";
import { useArchiveMerch, useUpdateMerch } from "@/hooks/useMerch";

export function MerchProductEditor({ creatorId, product }: { creatorId: string; product: MerchProduct }) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(product.image_url);
  const update = useUpdateMerch(creatorId);
  const archive = useArchiveMerch(creatorId);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await update.mutateAsync({
        id: product.id,
        image,
        input: {
          title: String(data.get("title") || "").trim(),
          description: String(data.get("description") || "").trim(),
          category: String(data.get("category") || "Other"),
          price_cents: data.get("price") ? Math.round(Number(data.get("price")) * 100) : null,
          currency: "USD",
          purchase_url: String(data.get("purchase_url") || "").trim() || null,
          availability: String(data.get("availability") || "coming_soon") as MerchProduct["availability"],
        },
      });
      setOpen(false);
      setImage(null);
      toast.success("Merchandise item updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update item");
    }
  };

  const toggleArchive = async () => {
    try {
      await archive.mutateAsync({ id: product.id, active: !product.is_active });
      toast.success(product.is_active ? "Item archived" : "Item restored");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update item");
    }
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen((value) => !value)}>
          <Pencil className="mr-2 h-4 w-4" />{open ? "Close" : "Edit"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={toggleArchive} disabled={archive.isPending}>
          {product.is_active ? <Archive className="mr-2 h-4 w-4" /> : <RotateCcw className="mr-2 h-4 w-4" />}
          {product.is_active ? "Archive" : "Restore"}
        </Button>
      </div>
      {open && (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl bg-muted/35 p-3">
          <div><Label>Item name</Label><Input name="title" required defaultValue={product.title} className="mt-1" /></div>
          <div><Label>Description</Label><Textarea name="description" required defaultValue={product.description} className="mt-1" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Category</Label><Select name="category" defaultValue={product.category}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{MERCH_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Availability</Label><Select name="availability" defaultValue={product.availability}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{MERCH_AVAILABILITY.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><Label>Display price (USD)</Label><Input name="price" type="number" min="0" step="0.01" defaultValue={product.price_cents == null ? "" : (product.price_cents / 100).toFixed(2)} className="mt-1" /></div>
          <div><Label>Checkout, store, or product URL</Label><Input name="purchase_url" type="url" defaultValue={product.purchase_url || ""} placeholder="Stripe, Square, PayPal, Etsy, Shopify, or your store" className="mt-1" /></div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-3">
            {preview ? <img src={preview} alt="Product preview" className="h-16 w-16 rounded-lg object-cover" /> : <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted"><ImagePlus className="h-6 w-6" /></span>}
            <span className="text-sm">Replace product image<br /><span className="text-muted-foreground">JPG, PNG, or WebP · 2MB maximum</span></span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0] || null; setImage(file); if (file) setPreview(URL.createObjectURL(file)); }} />
          </label>
          <Button className="w-full bg-gradient-brand text-white" disabled={update.isPending}>
            {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{update.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      )}
    </div>
  );
}
