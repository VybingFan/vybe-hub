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

export type BusinessSubmissionType =
  | "campaign_proposal"
  | "offer_proposal"
  | "sponsorship_placement"
  | "creative_brief";

export type BusinessSubmissionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "declined"
  | "withdrawn";

export type BusinessSubmission = {
  id: string;
  business_id: string;
  request_type: BusinessSubmissionType;
  title: string;
  summary: string;
  request_payload: Record<string, unknown>;
  status: BusinessSubmissionStatus;
  created_by: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  business_response: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessSubmissionInput = {
  requestType: BusinessSubmissionType;
  title: string;
  summary: string;
  objective?: string;
  targetAudience?: string;
  requestedTiming?: string;
  budgetRange?: string;
  destinationUrl?: string;
  additionalDetails?: string;
};

function submissionPayload(input: BusinessSubmissionInput) {
  return {
    objective: input.objective?.trim() || null,
    target_audience: input.targetAudience?.trim() || null,
    requested_timing: input.requestedTiming?.trim() || null,
    budget_range: input.budgetRange?.trim() || null,
    destination_url: input.destinationUrl?.trim() || null,
    additional_details: input.additionalDetails?.trim() || null,
  };
}

export const businessStudioService = {
  async getMine(): Promise<MyBusiness | null> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Sign in required");
    const { data, error } = await supabase
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
    const { error } = await supabase.from("business_profiles").insert({
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
    const { data, error } = await supabase
      .from("business_campaigns")
      .select("id,name,objective,status,starts_at,ends_at,created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async listSubmissions(businessId: string): Promise<BusinessSubmission[]> {
    const { data, error } = await (supabase.from("business_submissions") as any)
      .select(
        "id,business_id,request_type,title,summary,request_payload,status,created_by,submitted_at,reviewed_at,business_response,created_at,updated_at",
      )
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as BusinessSubmission[];
  },

  async createSubmission(
    businessId: string,
    input: BusinessSubmissionInput,
  ): Promise<BusinessSubmission> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Sign in required");
    const { data, error } = await (supabase.from("business_submissions") as any)
      .insert({
        business_id: businessId,
        request_type: input.requestType,
        title: input.title.trim(),
        summary: input.summary.trim(),
        request_payload: submissionPayload(input),
        status: "draft",
        created_by: auth.user.id,
      })
      .select(
        "id,business_id,request_type,title,summary,request_payload,status,created_by,submitted_at,reviewed_at,business_response,created_at,updated_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return data as BusinessSubmission;
  },

  async updateDraft(
    businessId: string,
    submissionId: string,
    input: BusinessSubmissionInput,
  ): Promise<BusinessSubmission> {
    const { data, error } = await (supabase.from("business_submissions") as any)
      .update({
        request_type: input.requestType,
        title: input.title.trim(),
        summary: input.summary.trim(),
        request_payload: submissionPayload(input),
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .eq("business_id", businessId)
      .eq("status", "draft")
      .select(
        "id,business_id,request_type,title,summary,request_payload,status,created_by,submitted_at,reviewed_at,business_response,created_at,updated_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return data as BusinessSubmission;
  },

  async deleteDraft(businessId: string, submissionId: string): Promise<void> {
    const { error } = await (supabase.from("business_submissions") as any)
      .delete()
      .eq("id", submissionId)
      .eq("business_id", businessId)
      .eq("status", "draft");
    if (error) throw new Error(error.message);
  },

  async submitDraft(submissionId: string): Promise<BusinessSubmission> {
    const { data, error } = await (supabase.rpc as any)(
      "submit_my_business_submission",
      { p_submission_id: submissionId },
    );
    if (error) throw new Error(error.message);
    return data as BusinessSubmission;
  },
};
