import { supabase } from "@/integrations/supabase/client";
import type { MerchProduct } from "@/features/merch/schema";

const BUCKET = "music-covers";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

async function hydrate(product: MerchProduct): Promise<MerchProduct> {
  if (!product.image_path) return product;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(product.image_path, 60 * 60 * 6);
  return { ...product, image_url: data?.signedUrl || product.image_url };
}

export const merchService = {
  async list(creatorId: string): Promise<MerchProduct[]> {
    const { data, error } = await supabase
      .from("merch_products")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Promise.all(((data ?? []) as MerchProduct[]).map(hydrate));
  },
  async create(
    creatorId: string,
    input: Omit<MerchProduct, "id" | "creator_id" | "created_at" | "updated_at">,
    image?: File | null,
  ) {
    let imagePath: string | null = null;
    if (image) {
      if (image.size > MAX_IMAGE_BYTES) throw new Error("Image must be 2MB or smaller");
      if (!image.type.startsWith("image/")) throw new Error("Choose a JPG, PNG, or WebP image");
      const safeName = image.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      imagePath = `${creatorId}/merch/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(imagePath, image, { contentType: image.type, cacheControl: "3600" });
      if (uploadError) throw uploadError;
    }
    const { data, error } = await supabase
      .from("merch_products")
      .insert({ creator_id: creatorId, ...input, image_path: imagePath })
      .select("*")
      .single();
    if (error) {
      if (imagePath) await supabase.storage.from(BUCKET).remove([imagePath]);
      throw error;
    }
    return hydrate(data as MerchProduct);
  },
  async remove(id: string) {
    const { error } = await supabase.from("merch_products").delete().eq("id", id);
    if (error) throw error;
  },
};
