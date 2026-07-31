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

export type CampaignWorkspace = {
  campaign: CampaignRecord & {
    disclosure_text: string;
    business_profiles: { public_name: string; verification_status: string } | null;
  };
  offers: Array<{ id: string; title: string; status: string; offer_code: string | null }>;
  creatives: Array<{ id: string; headline: string; format: string; status: string }>;
  placements: Array<{
    id: string;
    surface: string;
    slot_key: string;
    starts_at: string;
    ends_at: string;
    status: string;
  }>;
  documents: Array<{ id: string; title: string; document_type: string; status: string }>;
  events: Record<string, number>;
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

  async getCampaignWorkspace(campaignId: string): Promise<CampaignWorkspace> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase as any;
    const [
      campaignResult,
      offersResult,
      creativesResult,
      placementsResult,
      documentsResult,
      eventsResult,
    ] = await Promise.all([
      client
        .from("business_campaigns")
        .select(
          "id,business_id,name,objective,status,starts_at,ends_at,created_at,disclosure_text,business_profiles(public_name,verification_status)",
        )
        .eq("id", campaignId)
        .single(),
      client
        .from("business_offers")
        .select("id,title,status,offer_code")
        .eq(
          "business_id",
          (
            await client
              .from("business_campaigns")
              .select("business_id")
              .eq("id", campaignId)
              .single()
          ).data?.business_id ?? "",
        ),
      client
        .from("business_campaign_creatives")
        .select("id,headline,format,status")
        .eq("campaign_id", campaignId)
        .order("created_at"),
      client
        .from("business_campaign_placements")
        .select("id,surface,slot_key,starts_at,ends_at,status")
        .eq("campaign_id", campaignId)
        .order("starts_at"),
      client
        .from("business_partner_documents")
        .select("id,title,document_type,status")
        .eq("campaign_id", campaignId)
        .order("created_at"),
      client
        .from("business_campaign_events")
        .select("event_type")
        .eq("campaign_id", campaignId)
        .eq("is_valid", true)
        .eq("is_internal", false),
    ]);
    for (const result of [
      campaignResult,
      offersResult,
      creativesResult,
      placementsResult,
      documentsResult,
      eventsResult,
    ]) {
      if (result.error) throw result.error;
    }
    const events = (eventsResult.data ?? []).reduce(
      (totals: Record<string, number>, event: { event_type: string }) => {
        totals[event.event_type] = (totals[event.event_type] ?? 0) + 1;
        return totals;
      },
      {},
    );
    return {
      campaign: campaignResult.data,
      offers: offersResult.data ?? [],
      creatives: creativesResult.data ?? [],
      placements: placementsResult.data ?? [],
      documents: documentsResult.data ?? [],
      events,
    };
  },

  async setCampaignStatus(campaignId: string, status: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("business_campaigns")
      .update({
        status,
        approved_at: status === "approved" ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId);
    if (error) throw error;
  },

  async approveCreative(creativeId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("business_campaign_creatives")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", creativeId);
    if (error) throw error;
  },

  async approveOffer(offerId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("business_offers")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", offerId);
    if (error) throw error;
  },

  async approvePlacement(placementId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("business_campaign_placements")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", placementId);
    if (error) throw error;
  },

  async createOffer(input: {
    campaignId: string;
    businessId: string;
    title: string;
    description: string;
    offerCode?: string;
  }): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase as any;
    const { data, error } = await client
      .from("business_offers")
      .insert({
        business_id: input.businessId,
        title: input.title.trim(),
        description: input.description.trim(),
        offer_code: input.offerCode?.trim() || null,
        status: "draft",
      })
      .select("id")
      .single();
    if (error) throw error;
    const { error: linkError } = await client
      .from("business_campaigns")
      .update({ offer_id: data.id, updated_at: new Date().toISOString() })
      .eq("id", input.campaignId);
    if (linkError) throw linkError;
  },

  async createCreative(input: {
    campaignId: string;
    format: string;
    headline: string;
    body: string;
    callToAction?: string;
    destinationUrl?: string;
  }): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("business_campaign_creatives").insert({
      campaign_id: input.campaignId,
      format: input.format,
      headline: input.headline.trim(),
      body: input.body.trim(),
      call_to_action: input.callToAction?.trim() || null,
      destination_url: input.destinationUrl?.trim() || null,
      status: "draft",
    });
    if (error) throw error;
  },

  async createDocument(input: {
    campaignId: string;
    businessId: string;
    documentType: string;
    title: string;
    externalUrl?: string;
  }): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("business_partner_documents").insert({
      campaign_id: input.campaignId,
      business_id: input.businessId,
      document_type: input.documentType,
      title: input.title.trim(),
      external_url: input.externalUrl?.trim() || null,
      status: input.externalUrl ? "received" : "requested",
    });
    if (error) throw error;
  },

  async createPlacement(input: {
    campaignId: string;
    creativeId: string;
    surface: string;
    slotKey: string;
    startsAt: string;
    endsAt: string;
  }): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("business_campaign_placements").insert({
      campaign_id: input.campaignId,
      creative_id: input.creativeId,
      surface: input.surface,
      slot_key: input.slotKey.trim(),
      starts_at: new Date(input.startsAt).toISOString(),
      ends_at: new Date(input.endsAt).toISOString(),
      status: "draft",
    });
    if (error) throw error;
  },
};
