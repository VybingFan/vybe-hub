import { supabase } from "@/integrations/supabase/client";
import type { MerchProduct } from "@/features/merch/schema";

const BUCKET = "music-covers";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
type MerchUpdate = Pick<MerchProduct, "title" | "description" | "category" | "price_cents" | "currency" | "purchase_url" | "availability">;

async function hydrate(product: MerchProduct): Promise<MerchProduct> { if (!product.image_path) return product; const { data } = await supabase.storage.from(BUCKET).createSignedUrl(product.image_path, 60 * 60 * 6); return { ...product, image_url: data?.signedUrl || product.image_url }; }
async function uploadImage(creatorId: string, image: File) { if (image.size > MAX_IMAGE_BYTES) throw new Error("Image must be 2MB or smaller"); if (!image.type.startsWith("image/")) throw new Error("Choose a JPG, PNG, or WebP image"); const safeName = image.name.replace(/[^a-zA-Z0-9._-]+/g, "_"); const path = `${creatorId}/merch/${Date.now()}-${safeName}`; const { error } = await supabase.storage.from(BUCKET).upload(path, image, { contentType: image.type, cacheControl: "3600" }); if (error) throw error; return path; }

export const merchService = {
  async list(creatorId: string): Promise<MerchProduct[]> { const { data, error } = await supabase.from("merch_products").select("*").eq("creator_id", creatorId).order("created_at", { ascending: false }); if (error) throw error; return Promise.all(((data ?? []) as MerchProduct[]).map(hydrate)); },
  async create(creatorId: string, input: Omit<MerchProduct, "id" | "creator_id" | "created_at" | "updated_at">, image?: File | null) { const imagePath = image ? await uploadImage(creatorId, image) : null; const { data, error } = await supabase.from("merch_products").insert({ creator_id: creatorId, ...input, image_path: imagePath }).select("*").single(); if (error) { if (imagePath) await supabase.storage.from(BUCKET).remove([imagePath]); throw error; } return hydrate(data as MerchProduct); },
  async update(id: string, creatorId: string, input: MerchUpdate, image?: File | null) {
    const { data: current, error: readError } = await supabase.from("merch_products").select("image_path").eq("id", id).eq("creator_id", creatorId).single(); if (readError) throw readError;
    const nextPath = image ? await uploadImage(creatorId, image) : current.image_path;
    const { data, error } = await supabase.from("merch_products").update({ ...input, image_path: nextPath }).eq("id", id).eq("creator_id", creatorId).select("*").single();
    if (error) { if (image && nextPath) await supabase.storage.from(BUCKET).remove([nextPath]); throw error; }
    if (image && current.image_path && current.image_path !== nextPath) await supabase.storage.from(BUCKET).remove([current.image_path]);
    return hydrate(data as MerchProduct);
  },
  async setActive(id: string, active: boolean) { const { error } = await supabase.from("merch_products").update({ is_active: active }).eq("id", id); if (error) throw error; },
  async remove(id: string) { const { error } = await supabase.from("merch_products").delete().eq("id", id); if (error) throw error; },
};
