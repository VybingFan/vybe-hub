export const MERCH_CATEGORIES = [
  "Music",
  "Art & prints",
  "Collectibles",
  "Accessories",
  "Apparel",
  "Books & zines",
  "Experiences",
  "Digital",
  "Other",
] as const;

export interface MerchProduct {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  price_cents: number | null;
  currency: string;
  purchase_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
