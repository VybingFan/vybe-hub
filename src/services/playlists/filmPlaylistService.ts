import { supabase } from "@/integrations/supabase/client";
import type { CreatorVideo } from "@/features/video/schema";
import type { PlaylistAccessMode } from "@/features/playlists/schema";
import type { PlaylistItemInput } from "@/features/playlists/mixedMedia";

const db = supabase as any;

export interface FilmPlaylistWorkspaceRecord {
  id: string;
  title: string;
  description: string;
  occasion: string;
  slug: string;
  is_published: boolean;
  access_mode: PlaylistAccessMode;
  presentation_type: "film" | "mixed";
  workspace_category: string;
  created_at: string;
  playlist_items: Array<{
    id: string;
    item_kind: string;
    position: number;
    video_id: string | null;
    external_url: string | null;
    external_label: string | null;
    title_override: string | null;
    creator_note: string;
  }>;
}

export interface FilmDisciplineAllowance {
  public_identity_label: string;
  project_limit: number;
  published_project_limit: number;
  external_media_link_limit: number;
  hosted_media_minutes: number;
  private_review_playlist_limit: number;
  private_screener_limit: number;
  team_seat_limit: number;
  private_media_enabled: boolean;
  commercial_distribution_enabled: boolean;
}

function slugFor(title: string) {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) || "film-playlist";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export const filmPlaylistService = {
  async getSetup(creatorId: string) {
    const [{ data: profile, error: profileError }, { data: membership, error: membershipError }] =
      await Promise.all([
        db
          .from("creator_profiles")
          .select("primary_creator_discipline")
          .eq("user_id", creatorId)
          .maybeSingle(),
        db.rpc("get_my_creator_membership"),
      ]);

    if (profileError) throw profileError;
    if (membershipError) throw membershipError;

    const rawPlan = String(membership?.plan_code || "creator_free");
    const planCode = rawPlan === "founding_beta" ? "founding_beta" : rawPlan;
    const { data: allowance, error: allowanceError } = await db
      .from("creator_plan_discipline_allowances")
      .select("*")
      .eq("plan_code", planCode)
      .eq("discipline", "film")
      .maybeSingle();

    if (allowanceError) throw allowanceError;

    return {
      discipline: String(profile?.primary_creator_discipline || "music"),
      planCode: rawPlan,
      planName: String(membership?.public_name || "Creator Free"),
      allowance: allowance as FilmDisciplineAllowance | null,
    };
  },

  async listVideos(creatorId: string): Promise<CreatorVideo[]> {
    const { data, error } = await db
      .from("creator_videos")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CreatorVideo[];
  },

  async list(creatorId: string): Promise<FilmPlaylistWorkspaceRecord[]> {
    const { data, error } = await db
      .from("playlists")
      .select("*, playlist_items(*)")
      .eq("creator_id", creatorId)
      .in("presentation_type", ["film", "mixed"])
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((playlist: any) => ({
      ...playlist,
      playlist_items: [...(playlist.playlist_items ?? [])].sort(
        (a: any, b: any) => a.position - b.position,
      ),
    }));
  },

  async create(
    creatorId: string,
    input: {
      title: string;
      description: string;
      purpose: string;
      accessMode: PlaylistAccessMode;
      workspaceCategory: string;
      items: PlaylistItemInput[];
    },
  ) {
    if (!input.items.length) throw new Error("Add at least one trailer, scene, or Watch link.");

    const { data: membership, error: membershipError } = await db.rpc(
      "get_my_creator_membership",
    );
    if (membershipError) throw membershipError;
    const rawPlan = String(membership?.plan_code || "creator_free");
    const effectivePlan = rawPlan === "founding_beta" ? "creator_pro" : rawPlan;
    const passwordDays =
      effectivePlan === "creator_studio"
        ? 365
        : effectivePlan === "creator_pro"
          ? 90
          : effectivePlan === "creator_plus"
            ? 7
            : 0;
    if (input.accessMode === "password" && !passwordDays) {
      throw new Error("Password-protected playlists require Creator Plus.");
    }
    if (
      input.accessMode === "approved_listeners" &&
      effectivePlan !== "creator_pro" &&
      effectivePlan !== "creator_studio"
    ) {
      throw new Error("Approved viewers require Creator Pro.");
    }

    const { data: playlist, error } = await db
      .from("playlists")
      .insert({
        creator_id: creatorId,
        title: input.title.trim(),
        description: input.description.trim(),
        occasion: input.purpose,
        slug: slugFor(input.title),
        is_published: false,
        access_mode: input.accessMode,
        workspace_category: input.workspaceCategory,
        presentation_type: "film",
        access_expires_at:
          input.accessMode === "password"
            ? new Date(Date.now() + passwordDays * 86_400_000).toISOString()
            : null,
        require_sign_in:
          input.accessMode === "approved_listeners" || input.accessMode === "membership_only",
      })
      .select("id, slug")
      .single();
    if (error) throw error;

    const { error: itemError } = await db.rpc("replace_playlist_items", {
      _playlist_id: playlist.id,
      _items: input.items,
    });

    if (itemError) {
      await db.from("playlists").delete().eq("id", playlist.id).eq("creator_id", creatorId);
      throw itemError;
    }

    return playlist as { id: string; slug: string };
  },

  async remove(creatorId: string, playlistId: string) {
    const { error } = await db
      .from("playlists")
      .delete()
      .eq("id", playlistId)
      .eq("creator_id", creatorId)
      .in("presentation_type", ["film", "mixed"]);
    if (error) throw error;
  },
};
