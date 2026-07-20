import { FormEvent, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ImagePlus, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/useUser";
import { useCreateMerch, useDeleteMerch, useMerch } from "@/hooks/useMerch";
import { MERCH_AVAILABILITY, MERCH_CATEGORIES } from "@/features/merch/schema";

export const Route = createFileRoute("/_authenticated/merch")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <MerchStudio />
    </RoleGuard>
  ),
});

function MerchStudio() {
  const { user } = useUser();
  const { data: products = [] } = useMerch(user?.id);
  const create = useCreateMerch(user?.id);
  const remove = useDeleteMerch(user?.id);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await create.mutateAsync({
        image,
        input: {
          title: String(data.get("title")),
          description: String(data.get("description") || ""),
          category: String(data.get("category") || "Other"),
          image_url: null,
          image_path: null,
          price_cents: data.get("price") ? Math.round(Number(data.get("price")) * 100) : null,
          currency: "USD",
          purchase_url: String(data.get("purchase_url") || "") || null,
          availability: String(data.get("availability") || "coming_soon") as never,
          is_active: true,
        },
      });
      form.reset();
      setImage(null);
      setImagePreview(null);
      toast.success("Merch item added to your artist page");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add item");
    }
  };
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-genre-country">
          Creator commerce
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Merch Studio</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Build the collection supporters see directly on your VYBE page—music, art, collectibles,
          experiences, apparel, and more.
        </p>
      </header>
      <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Add an item</h2>
          <div>
            <Label>Item name</Label>
            <Input name="title" required className="mt-2" />
          </div>
          <div>
            <Label>Category</Label>
            <Select name="category">
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent>
                {MERCH_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea name="description" required className="mt-2" placeholder="Materials, sizes, colors, edition details, or the story behind this item" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Display price (USD, optional)</Label>
              <Input name="price" type="number" min="0" step="0.01" className="mt-2" />
            </div>
            <div>
              <Label>Availability</Label>
              <Select name="availability" defaultValue="coming_soon">
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>{MERCH_AVAILABILITY.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Product image</Label>
            <label className="mt-2 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border p-4 transition hover:border-primary/60">
              {imagePreview ? <img src={imagePreview} alt="Product preview" className="h-24 w-24 rounded-xl object-cover" /> : <span className="flex h-24 w-24 items-center justify-center rounded-xl bg-muted"><ImagePlus className="h-8 w-8 text-muted-foreground" /></span>}
              <span className="text-sm"><strong>{image ? image.name : "Choose product image"}</strong><br /><span className="text-muted-foreground">Recommended: 1200 × 1200 px square<br />JPG, PNG, or WebP • Maximum 8MB<br />Keep important artwork and text centered.</span></span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0] ?? null; setImage(file); setImagePreview(file ? URL.createObjectURL(file) : null); }} />
            </label>
          </div>
          <div>
            <Label>External purchase or details URL (optional)</Label>
            <Input name="purchase_url" type="url" className="mt-2" placeholder="Leave blank for coming soon" />
          </div>
          <Button disabled={create.isPending} className="w-full bg-gradient-brand text-white">
            {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingBag className="mr-2 h-4 w-4" />}
            {create.isPending ? "Uploading and saving…" : "Add showcase item"}
          </Button>
        </form>
        <section>
          <h2 className="text-2xl font-semibold">Your collection</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {products.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-muted">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs text-genre-country">{product.category}</p>
                  <h3 className="mt-1 font-semibold">{product.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                  <p className="mt-2 text-xs font-medium text-primary">{MERCH_AVAILABILITY.find((status) => status.value === product.availability)?.label || "Coming soon"}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span>
                      {product.price_cents == null
                        ? "Ask artist"
                        : `$${(product.price_cents / 100).toFixed(2)}`}
                    </span>
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
            {!products.length && (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground sm:col-span-2">
                Add the first item in your artist collection.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
