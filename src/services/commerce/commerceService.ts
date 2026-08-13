import { supabase } from "@/integrations/supabase/client";

export type CommerceProductType = "song" | "collection" | "bundle";
export type CommerceFulfillment = "stream" | "download" | "stream_and_download";
export type CommerceProductStatus = "draft" | "active" | "retired";

export interface CommerceProduct {
  id: string;
  creator_id: string;
  product_type: CommerceProductType;
  track_id: string | null;
  source_playlist_id: string | null;
  title: string;
  description: string;
  price_cents: number;
  currency: "USD";
  fulfillment: CommerceFulfillment;
  preview_mode: "none" | "preview" | "full";
  status: CommerceProductStatus;
  edition_number: number;
  first_sold_at: string | null;
  created_at: string;
  updated_at: string;
}

const db = supabase as unknown as {
  from: (table: string) => any;
};

export const commerceService = {
  async creatorProducts(creatorId: string): Promise<CommerceProduct[]> {
    const { data, error } = await db.from("commerce_products").select("*").eq("creator_id", creatorId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as CommerceProduct[];
  },

  async publicProducts(creatorId: string): Promise<CommerceProduct[]> {
    const { data, error } = await db.from("commerce_products").select("*").eq("creator_id", creatorId).eq("status", "active").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as CommerceProduct[];
  },

  async settings() {
    const { data, error } = await db.from("commerce_settings").select("*").eq("id", true).maybeSingle();
    if (error) throw new Error(error.message);
    return data as { checkout_enabled: boolean; minimum_checkout_cents: number } | null;
  },

  async createProduct(input: Omit<CommerceProduct, "id" | "currency" | "edition_number" | "first_sold_at" | "created_at" | "updated_at"> & { trackIds?: string[]; trackSnapshots?: Array<{ id: string; title: string; artist: string; duration: number | null }> }) {
    const { trackIds = [], trackSnapshots = [], ...product } = input;
    const { data, error } = await db.from("commerce_products").insert({ ...product, currency: "USD" }).select("*").single();
    if (error) throw new Error(error.message);
    if (product.product_type !== "song" && trackIds.length) {
      const rows = trackIds.map((trackId, index) => {
        const snapshot = trackSnapshots.find((item) => item.id === trackId);
        return { product_id: data.id, track_id: trackId, position: index + 1, snapshot_title: snapshot?.title ?? "Song", snapshot_artist: snapshot?.artist ?? "", snapshot_duration_seconds: snapshot?.duration ?? null };
      });
      const itemResult = await db.from("commerce_product_items").insert(rows);
      if (itemResult.error) {
        await db.from("commerce_products").delete().eq("id", data.id);
        throw new Error(itemResult.error.message);
      }
    }
    return data as CommerceProduct;
  },

  async setStatus(productId: string, creatorId: string, status: CommerceProductStatus) {
    const { error } = await db.from("commerce_products").update({ status }).eq("id", productId).eq("creator_id", creatorId);
    if (error) throw new Error(error.message);
  },
};
