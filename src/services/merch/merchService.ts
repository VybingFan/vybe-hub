import { supabase } from "@/integrations/supabase/client";
import type { MerchProduct } from "@/features/merch/schema";

export const merchService = {
  async list(creatorId: string): Promise<MerchProduct[]> {
    const { data, error } = await supabase
      .from("merch_products")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  async create(
    creatorId: string,
    input: Omit<MerchProduct, "id" | "creator_id" | "created_at" | "updated_at">,
  ) {
    const { data, error } = await supabase
      .from("merch_products")
      .insert({ creator_id: creatorId, ...input })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },
  async remove(id: string) {
    const { error } = await supabase.from("merch_products").delete().eq("id", id);
    if (error) throw error;
  },
};
