import { FormEvent, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LockKeyhole, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { useCreatorTracks } from "@/hooks/useMusic";
import { useMyPlaylists } from "@/hooks/usePlaylists";
import { useUser } from "@/hooks/useUser";
import { useMembership } from "@/hooks/useMembership";
import { hasCreatorFeature } from "@/features/membership/entitlements";
import { commerceService, type CommerceProductType } from "@/services/commerce/commerceService";
import { ProductRightsDeclaration } from "@/components/commerce/ProductRightsDeclaration";
import { StripeSellerReadinessCard } from "@/components/commerce/StripeSellerReadinessCard";
import { LockedFeatureCard } from "@/components/membership/LockedFeatureCard";

export const Route = createFileRoute("/_authenticated/commerce")({ component: () => <RoleGuard allow={["creator", "admin"]}><CommerceStudio /></RoleGuard> });

function CommerceStudio() {
  const { user } = useUser();
  const creatorId = user?.id;
  const { data: membership } = useMembership();
  const canPrepareCommerce = hasCreatorFeature(membership?.plan_code, "commerce.prepare");
  const canPublishCommerce = hasCreatorFeature(membership?.plan_code, "commerce.publish");
  const client = useQueryClient();
  const { data: tracks = [] } = useCreatorTracks(canPrepareCommerce ? creatorId : undefined);
  const { data: playlists = [] } = useMyPlaylists(canPrepareCommerce ? creatorId : undefined);
  const { data: products = [] } = useQuery({ queryKey: ["commerce-products", creatorId], queryFn: () => commerceService.creatorProducts(creatorId!), enabled: !!creatorId && canPrepareCommerce });
  const { data: settings } = useQuery({ queryKey: ["commerce-settings"], queryFn: commerceService.settings, enabled: canPrepareCommerce });
  const publishedTracks = useMemo(() => tracks.filter((track) => track.status === "published"), [tracks]);
  const create = useMutation({ mutationFn: commerceService.createProduct, onSuccess: async () => { await client.invalidateQueries({ queryKey: ["commerce-products", creatorId] }); toast.success("Sales listing prepared."); } });
  const changeStatus = useMutation({ mutationFn: ({ id, status }: { id: string; status: "active" | "retired" }) => commerceService.setStatus(id, creatorId!, status), onSuccess: () => client.invalidateQueries({ queryKey: ["commerce-products", creatorId] }) });

  if (!canPrepareCommerce) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <WorkspacePageHeader
          eyebrow="Creator commerce"
          title="Music sales"
          description="Music Sales is available with Creator Plus and higher. Upgrade when you are ready to prepare songs and permanent collections for sale."
          status={<Badge variant="outline">Upgrade available</Badge>}
        />
        <LockedFeatureCard
          title="Prepare music sales listings"
          description="Creator Plus unlocks seller setup and product preparation. Creator Pro adds publishing controls when VYBE checkout is active."
          requiredPlan="creator_plus"
          educationKey="commerce_prepare"
        />
      </div>
    );
  }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!creatorId) return;
    if (!canPrepareCommerce) return toast.error("Preparing sales listings requires Creator Plus or higher.");
    const form = event.currentTarget;
    const data = new FormData(form);
    const type = String(data.get("product_type")) as CommerceProductType;
    const sourceId = String(data.get("source_id"));
    const playlist = playlists.find((item) => item.id === sourceId);
    const track = tracks.find((item) => item.id === sourceId);
    const price = Math.round(Number(data.get("price")) * 100);
    if (!Number.isFinite(price) || price <= 0) return toast.error("Enter a valid price.");
    const minimum = type === "song" ? 99 : 299;
    if (price < minimum) return toast.error(`Minimum price is $${(minimum / 100).toFixed(2)}.`);
    if (!sourceId) return toast.error("Choose a song or playlist.");
    if (type === "song" && !track) return toast.error("Choose an individual song.");
    if (type === "collection" && !playlist) return toast.error("Choose a playlist for this collection.");
    await create.mutateAsync({ creator_id: creatorId, product_type: type, track_id: type === "song" ? sourceId : null, source_playlist_id: type === "collection" ? sourceId : null, title: String(data.get("title") || (type === "song" ? track?.title : playlist?.title) || "Untitled product"), description: String(data.get("description") || ""), price_cents: price, fulfillment: String(data.get("fulfillment")) as never, preview_mode: "preview", status: "draft", trackIds: type === "collection" ? (playlist?.trackIds ?? []) : [], trackSnapshots: tracks.map((item) => ({ id: item.id, title: item.title, artist: item.primary_artist_name || "", duration: item.duration_sec ?? null })) });
    form.reset();
  };
  return <div className="mx-auto max-w-6xl space-y-5 min-[900px]:space-y-4">
    <WorkspacePageHeader eyebrow="Creator commerce" title="Music sales" description="Prepare songs and permanent collections for sale. Checkout stays disabled until VYBE activates a verified payment and payout provider." status={<Badge variant="outline">Foundation</Badge>} />
    <StripeSellerReadinessCard />
    {!settings?.checkout_enabled ? <Card className="border-amber-500/30"><CardContent className="flex gap-3 p-5 min-[900px]:p-4"><LockKeyhole className="h-5 w-5 text-amber-500" /><div><p className="font-medium">Live checkout is not active</p><p className="text-sm text-muted-foreground">You can prepare listings safely. Customers will see “Sales opening soon” until activation.</p></div></CardContent></Card> : null}
    {!canPrepareCommerce ? <LockedFeatureCard title="Prepare music sales listings" description="See how VYBE turns published songs and permanent collections into structured, rights-aware products before checkout goes live." requiredPlan="creator_plus" educationKey="commerce_prepare" compact /> : !canPublishCommerce ? <LockedFeatureCard title="Publish prepared sales listings" description="Your current plan can prepare products. Publishing controls add the final creator-side launch step after rights and seller readiness." requiredPlan="creator_pro" educationKey="commerce_publish" compact /> : null}
    <div className="space-y-5 min-[900px]:space-y-4">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-5 min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:gap-3 min-[900px]:space-y-0 min-[900px]:p-4">
        <h2 className="text-xl font-semibold min-[900px]:col-span-2">Prepare a product</h2>
        <div><Label>Product type</Label><Select name="product_type" defaultValue="song"><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="song">Individual song</SelectItem><SelectItem value="collection">Permanent playlist / album</SelectItem></SelectContent></Select></div>
        <div><Label>Song or playlist</Label><Select name="source_id"><SelectTrigger className="mt-2"><SelectValue placeholder="Choose content" /></SelectTrigger><SelectContent>{publishedTracks.map((track) => <SelectItem key={track.id} value={track.id}>Song · {track.title}</SelectItem>)}{playlists.map((playlist) => <SelectItem key={playlist.id} value={playlist.id}>Playlist · {playlist.title}</SelectItem>)}</SelectContent></Select></div>
        <div className="min-[900px]:col-span-2"><Label>Sales title</Label><Input className="mt-2" name="title" placeholder="Leave blank to use the song or playlist title" /></div>
        <div className="min-[900px]:col-span-2"><Label>Description</Label><Textarea className="mt-2 min-[900px]:min-h-20" name="description" /></div>
        <div className="grid grid-cols-2 gap-3 min-[900px]:col-span-2"><div><Label>Price</Label><Input className="mt-2" name="price" type="number" min="0.99" step="0.01" required /></div><div><Label>Buyer receives</Label><Select name="fulfillment" defaultValue="stream"><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="stream">Streaming</SelectItem><SelectItem value="download">Download</SelectItem><SelectItem value="stream_and_download">Streaming + download</SelectItem></SelectContent></Select></div></div>
        <Button className="w-full min-[900px]:col-span-2 min-[900px]:ml-auto min-[900px]:w-auto" disabled={create.isPending || !canPrepareCommerce}><ShoppingBag className="mr-2 h-4 w-4" />{canPrepareCommerce ? "Prepare sales listing" : "Creator Plus required"}</Button>
      </form>
      <section className="space-y-3 min-w-0"><h2 className="text-xl font-semibold">Prepared products</h2>{products.length ? products.map((product) => <Card key={product.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 min-[900px]:p-3"><div><p className="font-medium">{product.title}</p><p className="text-sm text-muted-foreground">{product.product_type} · ${(product.price_cents / 100).toFixed(2)} · {product.fulfillment}</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant={product.status === "active" ? "default" : "outline"}>{product.status}</Badge><Badge variant="outline">Rights: {(product as any).rights_status || "incomplete"}</Badge><ProductRightsDeclaration productId={product.id} rightsStatus={(product as any).rights_status} />{product.status === "draft" ? <Button size="sm" disabled={!canPublishCommerce} title={!canPublishCommerce ? "Creator Pro or Studio required" : undefined} onClick={() => changeStatus.mutate({ id: product.id, status: "active" })}>{canPublishCommerce ? "Publish listing" : "Upgrade to publish"}</Button> : product.status === "active" ? <Button size="sm" variant="outline" onClick={() => changeStatus.mutate({ id: product.id, status: "retired" })}>Remove from sale</Button> : null}</div></CardContent></Card>) : <Card><CardContent className="p-6 text-sm text-muted-foreground min-[900px]:p-5">No sales listings prepared yet.</CardContent></Card>}</section>
    </div>
  </div>;
}
