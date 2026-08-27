import { supabase } from "@/integrations/supabase/client";

export type SupporterCreatorNotification = {
  id: string;
  notification_type: string;
  entity_type: string | null;
  entity_id: string | null;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
  creator_user_id: string | null;
  creator_display_name: string;
  creator_username: string | null;
  creator_avatar_path: string | null;
  signed_avatar_url?: string | null;
};

export type FollowedCreator = {
  creator_user_id: string;
  creator_display_name: string;
  creator_username: string | null;
  creator_avatar_path: string | null;
  followed_at: string;
  signed_avatar_url?: string | null;
};

async function signAvatar<T extends { creator_avatar_path: string | null }>(item: T): Promise<T & { signed_avatar_url?: string | null }> {
  if (!item.creator_avatar_path) return { ...item, signed_avatar_url: null };
  const { data } = await supabase.storage.from("avatars").createSignedUrl(item.creator_avatar_path, 60 * 60 * 6);
  return { ...item, signed_avatar_url: data?.signedUrl || null };
}

export const supporterNotificationService = {
  async list(limit = 50): Promise<SupporterCreatorNotification[]> {
    const { data, error } = await (supabase.rpc as any)("get_my_supporter_creator_feed_v24_62a2", { p_limit: limit });
    if (error) throw error;
    return Promise.all(((data || []) as SupporterCreatorNotification[]).map(signAvatar));
  },
  async listNotifications(limit = 50): Promise<SupporterCreatorNotification[]> {
    const { data, error } = await (supabase.rpc as any)("get_my_supporter_notifications", { p_limit: limit });
    if (error) throw error;
    return Promise.all(((data || []) as SupporterCreatorNotification[]).map(signAvatar));
  },
  async listFollowing(): Promise<FollowedCreator[]> {
    const { data, error } = await (supabase.rpc as any)("get_my_followed_creators_v24_62a2");
    if (error) throw error;
    return Promise.all(((data || []) as FollowedCreator[]).map(signAvatar));
  },
  async markRead() {
    const { error } = await (supabase.rpc as any)("mark_my_supporter_notifications_read");
    if (error) throw error;
  },
};
