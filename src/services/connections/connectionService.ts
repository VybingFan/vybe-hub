import { supabase } from "@/integrations/supabase/client";

export interface ListenerConnection {
  id: string;
  playlist_id: string;
  display_name: string | null;
  email: string;
  social_handle: string | null;
  message: string | null;
  consent_updates: boolean;
  status: "new" | "contacted" | "archived";
  created_at: string;
  playlists: { title: string } | null;
}

export interface ConnectionInput {
  displayName: string;
  email: string;
  socialHandle: string;
  message: string;
  consentShare: boolean;
  consentUpdates: boolean;
}

export const connectionService = {
  async submit(slug: string, input: ConnectionInput) {
    const { data, error } = await (supabase.rpc as any)("submit_listener_connection", {
      p_slug: slug,
      p_email: input.email,
      p_display_name: input.displayName || null,
      p_social_handle: input.socialHandle || null,
      p_message: input.message || null,
      p_consent_share: input.consentShare,
      p_consent_updates: input.consentUpdates,
    });
    if (error) throw error;
    if (!data) throw new Error("Check your email and consent selection.");
  },

  async listMine(creatorId: string): Promise<ListenerConnection[]> {
    const { data, error } = await (supabase as any)
      .from("listener_connections")
      .select("id,playlist_id,display_name,email,social_handle,message,consent_updates,status,created_at,playlists(title)")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async updateStatus(id: string, status: ListenerConnection["status"]) {
    const { error } = await (supabase as any).from("listener_connections").update({ status }).eq("id", id);
    if (error) throw error;
  },
};
