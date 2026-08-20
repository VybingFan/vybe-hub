import { supabase } from "@/integrations/supabase/client";

export type CreatorEngagementKind = "followers" | "likes" | "saves" | "comments";

export type CreatorEngagementItem = {
  id: string;
  created_at: string;
  identity_id: string;
  display_name: string;
  username?: string | null;
  avatar_path?: string | null;
  avatar_url?: string | null;
  signed_avatar_url?: string | null;
  track_id?: string;
  track_title?: string;
  list_name?: string;
  body?: string;
};

export type CreatorEngagementDetails = Record<CreatorEngagementKind, CreatorEngagementItem[]>;

export type CreatorNotification = {
  id: string;
  notification_type: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
  actor_display_name: string;
  actor_username: string | null;
  actor_avatar_path: string | null;
  actor_avatar_url: string | null;
  signed_avatar_url?: string | null;
};

async function signAvatar<T extends { avatar_path?: string | null; avatar_url?: string | null; actor_avatar_path?: string | null; actor_avatar_url?: string | null }>(item: T): Promise<T & { signed_avatar_url?: string | null }> {
  const path = item.avatar_path || item.actor_avatar_path;
  const fallback = item.avatar_url || item.actor_avatar_url || null;
  if (!path) return { ...item, signed_avatar_url: fallback };
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 6);
  return { ...item, signed_avatar_url: data?.signedUrl || fallback };
}

export const creatorEngagementService = {
  async details(days: number): Promise<CreatorEngagementDetails> {
    const { data, error } = await (supabase.rpc as any)(
      "get_my_creator_engagement_details",
      { p_days: days },
    );
    if (error) throw error;
    const source = data || {};
    const hydrate = (items: CreatorEngagementItem[] = []) => Promise.all(items.map(signAvatar));
    const [followers, likes, saves, comments] = await Promise.all([
      hydrate(source.followers),
      hydrate(source.likes),
      hydrate(source.saves),
      hydrate(source.comments),
    ]);
    return { followers, likes, saves, comments };
  },

  async notifications(limit = 30): Promise<CreatorNotification[]> {
    const { data, error } = await (supabase.rpc as any)(
      "get_my_creator_notifications",
      { p_limit: limit },
    );
    if (error) throw error;
    return Promise.all((data || []).map(signAvatar));
  },

  async markNotificationsRead() {
    const { error } = await (supabase.rpc as any)("mark_my_creator_notifications_read");
    if (error) throw error;
  },
};
