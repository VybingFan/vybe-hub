import { supabase } from "@/integrations/supabase/client";
import type { BillingInterval } from "@/integrations/stripe/server";

export type SocialPlatform = "instagram" | "tiktok" | "youtube" | "facebook" | "x" | "threads" | "other";
export type SocialContentType = "post" | "video" | "reel" | "short" | "photo" | "article" | "live" | "other";

export interface SocialDiscoveryPost {
  id: string;
  creator_id: string;
  platform: SocialPlatform;
  original_url: string;
  title: string;
  description: string | null;
  keywords: string[];
  content_type: SocialContentType;
  focus_code: string | null;
  related_vybe_url: string | null;
  original_published_at: string | null;
  is_active: boolean;
  discovery_order: number;
  created_at: string;
  updated_at: string;
}

export interface SocialDiscoverySummary {
  subscription: null | {
    id: string;
    add_on_code: "social_discovery";
    status: string;
    billing_interval: BillingInterval | null;
    billing_provider: "stripe" | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  };
  entitled: boolean;
  active_post_limit: number;
  active_post_count: number;
}

export interface SocialDiscoverySearchAnalytics {
  days: number;
  searches_appeared_in: number;
  result_impressions: number;
  outbound_clicks: number;
  unique_searchers: number;
  outbound_rate: number;
}

export interface SaveSocialPostInput {
  original_url: string;
  title: string;
  description?: string | null;
  keywords?: string[];
  content_type?: SocialContentType;
  focus_code?: string | null;
  related_vybe_url?: string | null;
  original_published_at?: string | null;
  is_active?: boolean;
  discovery_order?: number;
}

const client = supabase as any;

function parsePublicUrl(value: string) {
  const trimmed = value.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Enter a valid public http or https social-post URL.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Social-post URLs must use http or https.");
  }
  return parsed;
}

export function detectSocialPlatform(value: string): SocialPlatform {
  const parsed = parsePublicUrl(value);
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram";
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") return "youtube";
  if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.watch") return "facebook";
  if (host === "x.com" || host.endsWith(".x.com") || host === "twitter.com" || host.endsWith(".twitter.com")) return "x";
  if (host === "threads.net" || host.endsWith(".threads.net")) return "threads";
  return "other";
}

export function normalizeSocialPostUrl(value: string) {
  const parsed = parsePublicUrl(value);
  parsed.hash = "";
  ["fbclid", "gclid", "igshid", "si", "feature"].forEach((key) => parsed.searchParams.delete(key));
  return parsed.toString();
}

async function getSignedInUserId() {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Sign in as a creator to manage Social Discovery.");
  return userId;
}

async function findMineByNormalizedUrl(userId: string, originalUrl: string): Promise<SocialDiscoveryPost | null> {
  const { data, error } = await client
    .from("creator_social_posts")
    .select("*")
    .eq("creator_id", userId)
    .eq("original_url", originalUrl)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data || null) as SocialDiscoveryPost | null;
}

export const socialDiscoveryService = {
  async getSummary(): Promise<SocialDiscoverySummary> {
    const { data, error } = await client.rpc("get_my_social_discovery_summary");
    if (error) throw error;
    return data as SocialDiscoverySummary;
  },

  async getSearchAnalytics(days = 30): Promise<SocialDiscoverySearchAnalytics> {
    const { data, error } = await client.rpc("get_my_social_discovery_search_analytics", {
      _days: Math.max(1, Math.min(days, 365)),
    });
    if (error) throw error;
    return data as SocialDiscoverySearchAnalytics;
  },

  async listMine(): Promise<SocialDiscoveryPost[]> {
    const { data, error } = await client
      .from("creator_social_posts")
      .select("*")
      .order("is_active", { ascending: false })
      .order("discovery_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as SocialDiscoveryPost[];
  },

  async findMineByUrl(value: string): Promise<SocialDiscoveryPost | null> {
    const userId = await getSignedInUserId();
    const originalUrl = normalizeSocialPostUrl(value);
    return findMineByNormalizedUrl(userId, originalUrl);
  },

  async create(input: SaveSocialPostInput): Promise<SocialDiscoveryPost> {
    const userId = await getSignedInUserId();
    const originalUrl = normalizeSocialPostUrl(input.original_url);
    const existing = await findMineByNormalizedUrl(userId, originalUrl);
    if (existing) throw new Error(`This social post is already in your library as "${existing.title}".`);
    const platform = detectSocialPlatform(originalUrl);
    const { data, error } = await client.from("creator_social_posts").insert({
      creator_id: userId,
      platform,
      original_url: originalUrl,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      keywords: (input.keywords || []).map((value) => value.trim()).filter(Boolean).slice(0, 20),
      content_type: input.content_type || "post",
      focus_code: input.focus_code || null,
      related_vybe_url: input.related_vybe_url?.trim() || null,
      original_published_at: input.original_published_at || null,
      is_active: Boolean(input.is_active),
      discovery_order: input.discovery_order || 0,
    }).select("*").single();
    if (error) throw error;
    return data as SocialDiscoveryPost;
  },

  async update(id: string, input: SaveSocialPostInput): Promise<SocialDiscoveryPost> {
    const originalUrl = normalizeSocialPostUrl(input.original_url);
    const platform = detectSocialPlatform(originalUrl);
    const { data, error } = await client.from("creator_social_posts").update({
      platform,
      original_url: originalUrl,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      keywords: (input.keywords || []).map((value) => value.trim()).filter(Boolean).slice(0, 20),
      content_type: input.content_type || "post",
      focus_code: input.focus_code || null,
      related_vybe_url: input.related_vybe_url?.trim() || null,
      original_published_at: input.original_published_at || null,
      is_active: Boolean(input.is_active),
      discovery_order: input.discovery_order || 0,
    }).eq("id", id).select("*").single();
    if (error) throw error;
    return data as SocialDiscoveryPost;
  },

  async setActive(id: string, isActive: boolean) {
    const { error } = await client.from("creator_social_posts").update({ is_active: isActive }).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string) {
    const { error } = await client.from("creator_social_posts").delete().eq("id", id);
    if (error) throw error;
  },

  async startCheckout(interval: BillingInterval) {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) throw new Error("Sign in as a creator to subscribe to Social Discovery.");
    const response = await fetch("/api/stripe/social-discovery-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ interval }),
    });
    const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!response.ok || !body.url) throw new Error(body.error || "Social Discovery checkout could not be started.");
    return body.url;
  },
};
