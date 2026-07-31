import { supabase } from "@/integrations/supabase/client";

export type BusinessSummary = {
  generated_at: string;
  businesses: {
    total: number;
    pending: number;
    verified: number;
    preview: number;
    annual: number;
  };
  campaigns: {
    total: number;
    review: number;
    approved: number;
    active: number;
  };
  operations: {
    active_offers: number;
    scheduled_placements: number;
    documents_missing_path: number;
    valid_events: number;
  };
};

export type BusinessRecord = {
  id: string;
  public_name: string;
  slug: string;
  category: string;
  contact_name: string | null;
  contact_email: string;
  website_url: string | null;
  verification_status: string;
  partner_status: string;
  package_code: string | null;
  founding_partner: boolean;
  package_ends_at: string | null;
  created_at: string;
};

export type CampaignRecord = {
  id: string;
  business_id: string;
  name: string;
  objective: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  business_profiles: { public_name: string } | null;
};

type NewBusiness = {
  publicName: string;
  slug: string;
  category: string;
  contactName?: string;
  contactEmail: string;
  websiteUrl?: string;
  packageCode: "founding_preview" | "founding_partner" | "custom_campaign";
};

type NewCampaign = {
  businessId: string;
  name: string;
  objective: string;
};

export const businessAdminService = {
  async getSummary(): Promise<BusinessSummary> {
    // Types are regenerated after this migration reaches the remote project.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("get_admin_business_summary");
    if (error) throw error;
    return data as BusinessSummary;
  },

  async listBusinesses(): Promise<BusinessRecord[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("business_profiles")
      .select(
        "id,public_name,slug,category,contact_name,contact_email,website_url,verification_status,partner_status,package_code,founding_partner,package_ends_at,created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as BusinessRecord[];
  },

  async listCampaigns(): Promise<CampaignRecord[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("business_campaigns")
      .select(
        "id,business_id,name,objective,status,starts_at,ends_at,created_at,business_profiles(public_name)",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CampaignRecord[];
  },

  async createBusiness(input: NewBusiness): Promise<void> {
    const now = new Date();
    const duration =
      input.packageCode === "founding_preview"
        ? 60
        : input.packageCode === "founding_partner"
          ? 365
          : null;
    const endsAt = duration ? new Date(now.getTime() + duration * 86_400_000).toISOString() : null;
    const partnerStatus =
      input.packageCode === "founding_preview"
        ? "preview"
        : input.packageCode === "founding_partner"
          ? "annual"
          : "custom";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("business_profiles")
      .insert({
        public_name: input.publicName.trim(),
        slug: input.slug.trim().toLowerCase(),
        category: input.category.trim(),
        contact_name: input.contactName?.trim() || null,
        contact_email: input.contactEmail.trim().toLowerCase(),
        website_url: input.websiteUrl?.trim() || null,
        package_code: input.packageCode,
        package_started_at: now.toISOString(),
        package_ends_at: endsAt,
        partner_status: partnerStatus,
        founding_partner: input.packageCode === "founding_partner",
      })
      .select("id")
      .single();
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("business_audit_log").insert({
      business_id: data.id,
      action: "business_created",
      entity_type: "business_profile",
      entity_id: data.id,
      details: { package_code: input.packageCode },
    });
  },

  async verifyBusiness(businessId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("business_profiles")
      .update({ verification_status: "verified", updated_at: new Date().toISOString() })
      .eq("id", businessId);
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("business_audit_log").insert({
      business_id: businessId,
      action: "business_verified",
      entity_type: "business_profile",
      entity_id: businessId,
    });
  },

  async createCampaign(input: NewCampaign): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: business, error: businessError } = await (supabase as any)
      .from("business_profiles")
      .select("package_code")
      .eq("id", input.businessId)
      .single();
    if (businessError) throw businessError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("business_campaigns")
      .insert({
        business_id: input.businessId,
        package_code: business.package_code,
        name: input.name.trim(),
        objective: input.objective.trim(),
      })
      .select("id")
      .single();
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("business_audit_log").insert({
      business_id: input.businessId,
      campaign_id: data.id,
      action: "campaign_created",
      entity_type: "business_campaign",
      entity_id: data.id,
    });
  },
};
