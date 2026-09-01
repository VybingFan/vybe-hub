import { supabase } from "@/integrations/supabase/client";

export interface SocialDiscoverySearchPost {
  id: string;
  creator_id: string;
  platform: string;
  original_url: string;
  title: string;
  description: string | null;
  keywords: string[];
  content_type: string;
  focus_code: string | null;
  related_vybe_url: string | null;
  original_published_at: string | null;
  discovery_order: number;
  creator_username: string;
  creator_artist_name: string;
  creator_display_name: string;
  creator_avatar_url: string | null;
  creator_avatar_path: string | null;
  search_event_id: string;
}

export interface SocialDiscoverySearchOptions {
  limit?: number;
}

const client = supabase as any;

function storageObjectPath(bucket: string, value: string | null) {
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) return value.split("?")[0].replace(/^\/+/, "");
  try {
    const url = new URL(value);
    const markers = [
      `/storage/v1/object/sign/${bucket}/`,
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/authenticated/${bucket}/`,
    ];
    const marker = markers.find((candidate) => url.pathname.includes(candidate));
    if (!marker) return null;
    return decodeURIComponent(url.pathname.slice(url.pathname.indexOf(marker) + marker.length));
  } catch {
    return null;
  }
}

async function signedAvatar(path: string | null, fallback: string | null) {
  const objectPath = storageObjectPath("avatars", path);
  if (!objectPath) return fallback;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(objectPath, 60 * 60);
  return data?.signedUrl ?? fallback;
}

function normalizeSearch(rawQuery: string) {
  return rawQuery
    .trim()
    .replace(/[(),.%*]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

export const socialDiscoverySearchService = {
  async search(rawQuery: string, options: SocialDiscoverySearchOptions = {}) {
    const query = normalizeSearch(rawQuery);
    if (!query) return [] as SocialDiscoverySearchPost[];

    const limit = Math.max(1, Math.min(options.limit ?? 40, 60));
    const { data, error } = await client.rpc("search_social_discovery_posts_v24_72c", {
      _query: query,
      _limit: limit,
    });
    if (error) throw error;

    return Promise.all(
      ((data ?? []) as SocialDiscoverySearchPost[]).map(async (post) => ({
        ...post,
        creator_avatar_url: await signedAvatar(post.creator_avatar_path, post.creator_avatar_url),
      })),
    );
  },

  async recordOutboundClick(searchEventId: string, postId: string) {
    if (!searchEventId || !postId) return;
    const { error } = await client.rpc("record_social_discovery_outbound_click", {
      _search_event_id: searchEventId,
      _post_id: postId,
    });
    if (error) console.warn("Social Discovery outbound analytics could not be recorded.", error);
  },
};
