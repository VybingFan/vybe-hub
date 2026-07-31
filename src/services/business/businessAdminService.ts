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
  conversion_tracking_status?: "not_connected" | "testing" | "connected";
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

export type PartnerDocumentRecord = {
  id: string;
  business_id: string;
  campaign_id: string | null;
  document_type: string;
  title: string;
  storage_path: string | null;
  external_url: string | null;
  version_label: string | null;
  visibility: "internal" | "partner";
  status: "draft" | "requested" | "received" | "approved" | "signed" | "expired" | "archived";
  effective_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  business_profiles: { public_name: string } | null;
  business_campaigns: { name: string } | null;
};

export type CampaignAnalytics = {
  generated_at: string;
  campaign_id: string;
  campaign_name: string;
  business_id: string;
  business_name: string;
  range_start: string;
  range_end: string;
  conversion_tracking_status: "not_connected" | "testing" | "connected";
  metrics: {
    impressions: number;
    clicks: number;
    click_through_rate: number;
    offer_claims: number;
    redemptions: number;
    conversions: number;
  };
  quality: {
    events_total: number;
    events_valid: number;
    events_internal: number;
    events_invalid: number;
  };
  invalid_reasons: Record<string, number>;
  daily: Array<{
    date: string;
    impressions: number;
    clicks: number;
    offer_claims: number;
    redemptions: number;
    conversions: number;
  }>;
};

export type CampaignEventRecord = {
  id: number;
  event_type: string;
  session_id: string;
  referrer_path: string | null;
  device_category: string | null;
  is_internal: boolean;
  is_valid: boolean;
  invalid_reason: string | null;
  occurred_at: string;
};

export type CampaignReportRecord = {
  id: string;
  range_start: string;
  range_end: string;
  metrics: CampaignAnalytics["metrics"];
  methodology: Record<string, unknown>;
  status: "draft" | "released" | "superseded";
  released_at: string | null;
  created_at: string;
};

export type AdminCampaignReportRecord = CampaignReportRecord & {
  campaign_id: string;
  business_campaigns: {
    name: string;
    business_profiles: { public_name: string } | null;
  } | null;
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
    const { data, error } = await supabase.rpc("get_admin_business_summary");
    if (error) throw error;
    return data as BusinessSummary;
  },

  async listBusinesses(): Promise<BusinessRecord[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from("business_campaigns")
      .select(
        "id,business_id,name,objective,status,starts_at,ends_at,created_at,conversion_tracking_status,business_profiles(public_name)",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CampaignRecord[];
  },

  async listPartnerDocuments(): Promise<PartnerDocumentRecord[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("business_partner_documents")
      .select(
        "id,business_id,campaign_id,document_type,title,storage_path,external_url,version_label,visibility,status,effective_at,expires_at,created_at,updated_at,business_profiles(public_name),business_campaigns(name)",
      )
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as PartnerDocumentRecord[];
  },

  async createPartnerDocument(input: {
    businessId: string;
    campaignId?: string;
    documentType: string;
    title: string;
    externalUrl?: string;
    versionLabel?: string;
    visibility: "internal" | "partner";
    status: PartnerDocumentRecord["status"];
    effectiveAt?: string;
    expiresAt?: string;
  }): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase;
    const { data, error } = await client
      .from("business_partner_documents")
      .insert({
        business_id: input.businessId,
        campaign_id: input.campaignId || null,
        document_type: input.documentType,
        title: input.title.trim(),
        external_url: input.externalUrl?.trim() || null,
        version_label: input.versionLabel?.trim() || null,
        visibility: input.visibility,
        status: input.status,
        effective_at: input.effectiveAt ? new Date(input.effectiveAt).toISOString() : null,
        expires_at: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
      })
      .select("id")
      .single();
    if (error) throw error;
    await client.from("business_audit_log").insert({
      business_id: input.businessId,
      campaign_id: input.campaignId || null,
      action: "partner_document_created",
      entity_type: "business_partner_document",
      entity_id: data.id,
      details: { document_type: input.documentType, status: input.status },
    });
  },

  async updatePartnerDocument(
    document: PartnerDocumentRecord,
    patch: Partial<
      Pick<
        PartnerDocumentRecord,
        "status" | "visibility" | "external_url" | "version_label" | "expires_at"
      >
    >,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase;
    const { error } = await client
      .from("business_partner_documents")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", document.id);
    if (error) throw error;
    await client.from("business_audit_log").insert({
      business_id: document.business_id,
      campaign_id: document.campaign_id,
      action: "partner_document_updated",
      entity_type: "business_partner_document",
      entity_id: document.id,
      details: patch,
    });
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
    const { data, error } = await supabase
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
    await supabase.from("business_audit_log").insert({
      business_id: data.id,
      action: "business_created",
      entity_type: "business_profile",
      entity_id: data.id,
      details: { package_code: input.packageCode },
    });
  },

  async verifyBusiness(businessId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
      .from("business_profiles")
      .update({ verification_status: "verified", updated_at: new Date().toISOString() })
      .eq("id", businessId);
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("business_audit_log").insert({
      business_id: businessId,
      action: "business_verified",
      entity_type: "business_profile",
      entity_id: businessId,
    });

    // Resolve the application alert after the administrator verifies the business.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase
      .from("admin_notifications")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("category", "business_application")
      .eq("entity_id", businessId)
      .in("status", ["unread", "read"]);
  },

  async assignBusinessPackage(
    business: BusinessRecord,
    packageCode: "founding_preview" | "founding_partner" | "custom_campaign" | "",
  ): Promise<void> {
    if (business.verification_status !== "verified") {
      throw new Error("Verify the business before assigning a partner package.");
    }
    const now = new Date();
    const durationDays =
      packageCode === "founding_preview" ? 60 : packageCode === "founding_partner" ? 365 : null;
    const packageEndsAt = durationDays
      ? new Date(now.getTime() + durationDays * 86_400_000).toISOString()
      : null;
    const partnerStatus =
      packageCode === "founding_preview"
        ? "preview"
        : packageCode === "founding_partner"
          ? "annual"
          : packageCode === "custom_campaign"
            ? "custom"
            : "prospect";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase;
    const { error } = await client
      .from("business_profiles")
      .update({
        package_code: packageCode || null,
        partner_status: partnerStatus,
        package_started_at: packageCode ? now.toISOString() : null,
        package_ends_at: packageEndsAt,
        founding_partner: packageCode === "founding_partner",
        updated_at: now.toISOString(),
      })
      .eq("id", business.id);
    if (error) throw error;
    await client.from("business_audit_log").insert({
      business_id: business.id,
      action: packageCode ? "business_package_assigned" : "business_package_removed",
      entity_type: "business_profile",
      entity_id: business.id,
      details: {
        previous_package_code: business.package_code,
        package_code: packageCode || null,
        partner_status: partnerStatus,
        package_ends_at: packageEndsAt,
      },
    });
  },

  async createCampaign(input: NewCampaign): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: business, error: businessError } = await supabase
      .from("business_profiles")
      .select("package_code")
      .eq("id", input.businessId)
      .single();
    if (businessError) throw businessError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
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
    await supabase.from("business_audit_log").insert({
      business_id: input.businessId,
      campaign_id: data.id,
      action: "campaign_created",
      entity_type: "business_campaign",
      entity_id: data.id,
    });
  },

  async getCampaignWorkspace(campaignId: string): Promise<CampaignWorkspace> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase;
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
    if (!campaignResult.data) {
      throw new Error("Campaign workspace was not found.");
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
    const { error } = await supabase
      .from("business_campaigns")
      .update({
        status,
        approved_at: status === "approved" ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId);
    if (error) throw error;
  },

  async getCampaignAnalytics(
    campaignId: string,
    rangeStart: string,
    rangeEnd: string,
  ): Promise<CampaignAnalytics> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc("get_admin_campaign_analytics", {
      requested_campaign_id: campaignId,
      requested_start: rangeStart,
      requested_end: rangeEnd,
    });
    if (error) throw error;
    return data as CampaignAnalytics;
  },

  async listCampaignEvents(campaignId: string): Promise<CampaignEventRecord[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("business_campaign_events")
      .select(
        "id,event_type,session_id,referrer_path,device_category,is_internal,is_valid,invalid_reason,occurred_at",
      )
      .eq("campaign_id", campaignId)
      .order("occurred_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []) as CampaignEventRecord[];
  },

  async setEventValidity(eventId: number, isValid: boolean, invalidReason?: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase;
    const { data: event, error: eventError } = await client
      .from("business_campaign_events")
      .select("campaign_id,business_id,is_valid,invalid_reason")
      .eq("id", eventId)
      .single();
    if (eventError) throw eventError;
    const { error } = await client
      .from("business_campaign_events")
      .update({
        is_valid: isValid,
        invalid_reason: isValid ? null : invalidReason?.trim() || "admin_excluded",
      })
      .eq("id", eventId);
    if (error) throw error;
    await client.from("business_audit_log").insert({
      business_id: event.business_id,
      campaign_id: event.campaign_id,
      action: isValid ? "campaign_event_restored" : "campaign_event_excluded",
      entity_type: "business_campaign_event",
      entity_id: String(eventId),
      details: {
        previous_is_valid: event.is_valid,
        previous_invalid_reason: event.invalid_reason,
        is_valid: isValid,
        invalid_reason: isValid ? null : invalidReason?.trim() || "admin_excluded",
      },
    });
  },

  async setConversionTrackingStatus(
    campaignId: string,
    status: "not_connected" | "testing" | "connected",
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase;
    const { data: campaign, error: campaignError } = await client
      .from("business_campaigns")
      .select("business_id,conversion_tracking_status")
      .eq("id", campaignId)
      .single();
    if (campaignError) throw campaignError;
    const { error } = await client
      .from("business_campaigns")
      .update({ conversion_tracking_status: status, updated_at: new Date().toISOString() })
      .eq("id", campaignId);
    if (error) throw error;
    await client.from("business_audit_log").insert({
      business_id: campaign.business_id,
      campaign_id: campaignId,
      action: "conversion_tracking_status_changed",
      entity_type: "business_campaign",
      entity_id: campaignId,
      details: {
        previous_status: campaign.conversion_tracking_status,
        status,
      },
    });
  },

  async listCampaignReports(campaignId: string): Promise<CampaignReportRecord[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("business_campaign_reports")
      .select("id,range_start,range_end,metrics,methodology,status,released_at,created_at")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CampaignReportRecord[];
  },

  async listAllCampaignReports(): Promise<AdminCampaignReportRecord[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("business_campaign_reports")
      .select(
        "id,campaign_id,range_start,range_end,metrics,methodology,status,released_at,created_at,business_campaigns(name,business_profiles(public_name))",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AdminCampaignReportRecord[];
  },

  async releaseCampaignReport(analytics: CampaignAnalytics): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase;
    const releasedAt = new Date().toISOString();
    const { data, error } = await client
      .from("business_campaign_reports")
      .insert({
        campaign_id: analytics.campaign_id,
        business_id: analytics.business_id,
        range_start: analytics.range_start,
        range_end: analytics.range_end,
        metrics: analytics.metrics,
        methodology: {
          generated_at: analytics.generated_at,
          quality: analytics.quality,
          invalid_reasons: analytics.invalid_reasons,
          conversion_tracking_status: analytics.conversion_tracking_status,
          source: "valid_non_internal_vybe_events",
        },
        status: "released",
        released_at: releasedAt,
      })
      .select("id")
      .single();
    if (error) throw error;
    await client.from("business_audit_log").insert({
      business_id: analytics.business_id,
      campaign_id: analytics.campaign_id,
      action: "campaign_report_released",
      entity_type: "business_campaign_report",
      entity_id: data.id,
      details: {
        range_start: analytics.range_start,
        range_end: analytics.range_end,
        metrics: analytics.metrics,
      },
    });
  },

  async approveCreative(creativeId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
      .from("business_campaign_creatives")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", creativeId);
    if (error) throw error;
  },

  async approveOffer(offerId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
      .from("business_offers")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", offerId);
    if (error) throw error;
  },

  async approvePlacement(placementId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
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
    const client = supabase;
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
    const { error } = await supabase.from("business_campaign_creatives").insert({
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
    const { error } = await supabase.from("business_partner_documents").insert({
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
    const { error } = await supabase.from("business_campaign_placements").insert({
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
