import { supabase } from "@/integrations/supabase/client";
import type { MerchProduct } from "@/features/merch/schema";

export interface PublicMerchItem extends MerchProduct {
  creator_username: string;
  creator_name: string;
}

async function signedUrl(path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from("music-covers").createSignedUrl(path, 60 * 60 * 6);
  return data?.signedUrl ?? null;
}

export const publicMerchService = {
  async listActive(): Promise<PublicMerchItem[]> {
    const { data: products, error } = await supabase
      .from("merch_products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const merch = (products ?? []) as MerchProduct[];
    if (!merch.length) return [];

    const creatorIds = [...new Set(merch.map((product) => product.creator_id))];

    const { data: profiles, error: profileError } = await supabase
      .from("creator_profiles")
      .select("user_id, username, display_name, artist_name")
      .in("user_id", creatorIds);

    if (profileError) throw profileError;

    const profileMap = new Map(
      (profiles ?? []).map((profile) => [
        profile.user_id,
        {
          username: profile.username ?? "",
          name: profile.display_name || profile.artist_name || profile.username || "VYBE creator",
        },
      ]),
    );

    return Promise.all(
      merch.map(async (product) => {
        const creator = profileMap.get(product.creator_id);
        return {
          ...product,
          image_url:
            (await signedUrl(product.image_path)) ||
            product.image_url ||
            null,
          creator_username: creator?.username ?? "",
          creator_name: creator?.name ?? "VYBE creator",
        };
      }),
    );
  },
};
