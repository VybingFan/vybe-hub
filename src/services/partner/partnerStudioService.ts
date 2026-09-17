import { supabase } from "@/integrations/supabase/client";

export type PartnerProfile = {
  id:string; owner_user_id:string; display_name:string; slug:string; partner_type:string;
  organization_name:string|null; headline:string|null; description:string|null; website_url:string|null;
  contact_email:string; service_area:string|null; opportunity_types:string[]; creator_interests:string[];
  verification_status:string; founding_partner:boolean;
};

export const partnerStudioService = {
  async getMine():Promise<PartnerProfile|null>{
    const {data:auth}=await supabase.auth.getUser(); if(!auth.user) throw new Error("Sign in required");
    const {data,error}=await (supabase.from("partner_profiles") as any).select("*").eq("owner_user_id",auth.user.id).maybeSingle();
    if(error) throw error; return data as PartnerProfile|null;
  },
  async apply(input:{displayName:string;slug:string;partnerType:string;organizationName?:string;headline?:string;description?:string;websiteUrl?:string;contactEmail:string;serviceArea?:string;opportunityTypes?:string[];creatorInterests?:string[]}){
    const {data:auth}=await supabase.auth.getUser(); if(!auth.user) throw new Error("Sign in required");
    const {error}=await (supabase.from("partner_profiles") as any).insert({owner_user_id:auth.user.id,display_name:input.displayName.trim(),slug:input.slug.trim().toLowerCase(),partner_type:input.partnerType,organization_name:input.organizationName?.trim()||null,headline:input.headline?.trim()||null,description:input.description?.trim()||null,website_url:input.websiteUrl?.trim()||null,contact_email:input.contactEmail.trim().toLowerCase(),service_area:input.serviceArea?.trim()||null,opportunity_types:input.opportunityTypes??[],creator_interests:input.creatorInterests??[],verification_status:"pending",founding_partner:false});
    if(error) throw new Error(error.message);
  },
  async listOpportunities(partnerId:string){
    const {data,error}=await (supabase.from("partner_opportunities") as any).select("*").eq("partner_id",partnerId).order("created_at",{ascending:false});
    if(error) throw error; return data??[];
  }
};