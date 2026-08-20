import { supabase } from "@/integrations/supabase/client";
import type { CreatorProfile, CreatorProfileInput, PersonalLink } from "@/features/profile/schema";
import { membershipService } from "@/services/membership/membershipService";
import { hasCreatorCapability } from "@/features/membership/access";

type Row = Omit<CreatorProfile, "personal_links"> & { personal_links: unknown };

function normalize(row: Row): CreatorProfile {
  const links = Array.isArray(row.personal_links) ? (row.personal_links as PersonalLink[]) : [];
  return { ...row, personal_links: links };
}

async function hydrate(row: Row): Promise<CreatorProfile> {
  const profile = normalize(row);
  const [avatar, cover, background] = await Promise.all([
    profile.avatar_path
      ? supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 60 * 60 * 6)
      : null,
    profile.cover_path
      ? supabase.storage.from("avatars").createSignedUrl(profile.cover_path, 60 * 60 * 6)
      : null,
    profile.profile_background_path
      ? supabase.storage.from("avatars").createSignedUrl(profile.profile_background_path, 60 * 60 * 6)
      : null,
  ]);
  return {
    ...profile,
    avatar_url: avatar?.data?.signedUrl || profile.avatar_url,
    cover_url: cover?.data?.signedUrl || profile.cover_url,
    profile_background_url: background?.data?.signedUrl || profile.profile_background_url,
  };
}

export const creatorProfileService = {
  async uploadImage(userId: string, kind: "avatar" | "cover" | "background", file: File) {
    if (kind === "cover") {
      const membership = await membershipService.getMine();
      if (!hasCreatorCapability(membership.plan_code, "profile.custom_cover")) throw new Error("Custom profile covers require Creator Plus or higher.");
    }
    if (kind === "background") {
      const membership = await membershipService.getMine();
      if (!hasCreatorCapability(membership.plan_code, "profile.custom_background")) throw new Error("Full-page profile backgrounds require Creator Pro or higher.");
    }
    if (file.size > 8 * 1024 * 1024) throw new Error("Image must be 8MB or smaller");
    if (!file.type.startsWith("image/")) throw new Error("Choose an image file");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/profile/${kind}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type });
    if (error) throw error;
    const { data, error: signedError } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60 * 6);
    if (signedError) throw signedError;
    return { path, url: data.signedUrl };
  },
  async fetch(userId: string): Promise<CreatorProfile | null> {
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ? hydrate(data as unknown as Row) : null;
  },

  async upsert(userId: string, input: CreatorProfileInput): Promise<CreatorProfile> {
    const membership = await membershipService.getMine();
    const canBackground = hasCreatorCapability(membership.plan_code, "profile.custom_background");
    const payload = {
      user_id: userId,
      ...input,
      genre: input.genres[0] ?? "",
      avatar_url: input.avatar_path ? null : input.avatar_url,
      cover_url: input.cover_path ? null : input.cover_url,
      profile_theme: canBackground ? input.profile_theme : "vybe",
      profile_background_path: canBackground ? input.profile_background_path : null,
      profile_background_url: canBackground && !input.profile_background_path ? input.profile_background_url : null,
      personal_links: input.personal_links ?? [],
    };
    const { data, error } = await supabase
      .from("creator_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) throw error;
    return hydrate(data as unknown as Row);
  },
};
