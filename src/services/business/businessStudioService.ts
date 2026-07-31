import { supabase } from "@/integrations/supabase/client";

export type MyBusiness = {
  id: string;
  public_name: string;
  slug: string;
  category: string;
  description: string | null;
  website_url: string | null;
  contact_name: string | null;
  contact_email: string;
  service_area: string | null;
  target_audience: string | null;
  verification_status: string;
  partner_status: string;
  package_code: string | null;
  package_ends_at: string | null;
};

export const businessStudioService = {
  async getMine(): Promise<MyBusiness | null> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Sign in required");
    // Types are regenerated after the migration reaches the remote project.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("business_profiles")
      .select(
        "id,public_name,slug,category,description,website_url,contact_name,contact_email,service_area,target_audience,verification_status,partner_status,package_code,package_ends_at",
      )
      .eq("owner_user_id", auth.user.id)
      .maybeSingle();
    if (error) throw error;
    return data as MyBusiness | null;
  },

  async apply(input: {
    publicName: string;
    slug: string;
    category: string;
    description?: string;
    websiteUrl?: string;
    contactName?: string;
    contactEmail: string;
    serviceArea?: string;
    targetAudience?: string;
  }): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Sign in required");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("business_profiles").insert({
      owner_user_id: auth.user.id,
      created_by: auth.user.id,
      public_name: input.publicName.trim(),
      slug: input.slug.trim().toLowerCase(),
      category: input.category.trim(),
      description: input.description?.trim() || null,
      website_url: input.websiteUrl?.trim() || null,
      contact_name: input.contactName?.trim() || null,
      contact_email: input.contactEmail.trim().toLowerCase(),
      service_area: input.serviceArea?.trim() || null,
      target_audience: input.targetAudience?.trim() || null,
      verification_status: "pending",
      partner_status: "prospect",
    });
    if (error) throw new Error(error.message);
  },

  async listCampaigns(businessId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("business_campaigns")
      .select("id,name,objective,status,starts_at,ends_at,created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};
