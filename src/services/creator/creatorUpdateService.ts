import { supabase } from "@/integrations/supabase/client";
import type { CreatorUpdate, CreatorUpdateInput } from "@/features/creatorUpdates/schema";

const BUCKET = "creator-updates";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function asIso(value?: string) {
  const clean = value?.trim();
  if (!clean) return null;
  const date = new Date(clean);
  if (Number.isNaN(date.getTime())) throw new Error("Use a valid date and time.");
  return date.toISOString();
}
function hydrate(row: any): CreatorUpdate {
  return { ...row, image_url: row.image_path ? supabase.storage.from(BUCKET).getPublicUrl(row.image_path).data.publicUrl : null } as CreatorUpdate;
}
async function uploadImage(creatorId: string, file: File) {
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Flyer or image must be 5MB or smaller.");
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Choose a JPG, PNG, or WebP image.");
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `${creatorId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, cacheControl: "3600" });
  if (error) throw error;
  return path;
}

export const creatorUpdateService = {
  async listMine(creatorId: string) {
    const { data, error } = await (supabase.from("creator_updates") as any).select("*").eq("creator_id", creatorId).order("starts_at", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(hydrate);
  },
  async listPublished(creatorId: string) {
    const { data, error } = await (supabase.from("creator_updates") as any).select("*").eq("creator_id", creatorId).eq("status", "published").order("starts_at", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(hydrate);
  },
  async create(creatorId: string, input: CreatorUpdateInput, image?: File | null) {
    let imagePath: string | null = null;
    if (image) imagePath = await uploadImage(creatorId, image);
    try {
      const { data, error } = await (supabase.from("creator_updates") as any).insert({
        creator_id: creatorId,
        kind: input.kind,
        title: input.title.trim(),
        description: input.description.trim(),
        starts_at: asIso(input.startsAt),
        ends_at: asIso(input.endsAt),
        location_name: input.locationName?.trim() || "",
        location_address: input.locationAddress?.trim() || "",
        image_path: imagePath,
        destination_url: input.destinationUrl?.trim() || null,
        cta_label: input.ctaLabel?.trim() || "Learn More",
        status: input.publishNow ? "published" : "draft",
      }).select("*").single();
      if (error) throw error;
      return hydrate(data);
    } catch (error) {
      if (imagePath) await supabase.storage.from(BUCKET).remove([imagePath]);
      throw error;
    }
  },
  async setPublished(id: string, creatorId: string, published: boolean) {
    const { error } = await (supabase.from("creator_updates") as any).update({ status: published ? "published" : "draft" }).eq("id", id).eq("creator_id", creatorId);
    if (error) throw error;
  },
  async remove(item: CreatorUpdate, creatorId: string) {
    const { error } = await (supabase.from("creator_updates") as any).delete().eq("id", item.id).eq("creator_id", creatorId);
    if (error) throw error;
    if (item.image_path) await supabase.storage.from(BUCKET).remove([item.image_path]);
  },
};
