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

export const MERCH_AVAILABILITY = [
  { value: "coming_soon", label: "Coming soon" },
  { value: "available_externally", label: "Available externally" },
  { value: "unavailable", label: "Not currently available" },
  { value: "sold_out", label: "Sold out" },
] as const;

export type MerchAvailability = (typeof MERCH_AVAILABILITY)[number]["value"];

export interface MerchProduct {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  image_path: string | null;
  price_cents: number | null;
  currency: string;
  purchase_url: string | null;
  availability: MerchAvailability;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
