import { useQuery } from "@tanstack/react-query";
import { LockKeyhole, Music2, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { commerceService } from "@/services/commerce/commerceService";

export function PublicCreatorShop({ creatorId, creatorName }: { creatorId: string; creatorName: string }) {
  const { data: products = [] } = useQuery({ queryKey: ["public-commerce-products", creatorId], queryFn: () => commerceService.publicProducts(creatorId), enabled: !!creatorId });
  const { data: settings } = useQuery({ queryKey: ["commerce-settings"], queryFn: commerceService.settings });
  if (!products.length) return null;
  return (
    <section id="music-sales" className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Shop directly from the creator</p>
      <h2 className="mt-2 text-3xl font-semibold">Music from {creatorName}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article key={product.id} className="rounded-2xl border bg-card p-5">
            <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">{product.product_type === "song" ? <Music2 className="h-5 w-5 text-primary" /> : <ShoppingBag className="h-5 w-5 text-primary" />}</span><Badge variant="outline">{product.product_type === "song" ? "Song" : `Edition ${product.edition_number}`}</Badge></div>
            <h3 className="mt-4 text-lg font-semibold">{product.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description || (product.fulfillment === "stream" ? "Listen in your VYBE purchase library." : "Includes authorized digital access.")}</p>
            <div className="mt-5 flex items-center justify-between gap-3"><span className="text-lg font-semibold">${(product.price_cents / 100).toFixed(2)}</span><Button disabled={!settings?.checkout_enabled}>{settings?.checkout_enabled ? "Buy" : <><LockKeyhole className="mr-2 h-4 w-4" />Sales opening soon</>}</Button></div>
          </article>
        ))}
      </div>
    </section>
  );
}
