import { supabase } from "@/integrations/supabase/client";

export type AdminPartnerProfile = {
  id:string; owner_user_id:string; display_name:string; slug:string; partner_type:string;
  organization_name:string|null; headline:string|null; description:string|null; website_url:string|null;
  contact_email:string; service_area:string|null; opportunity_types:string[]; creator_interests:string[];
  verification_status:"pending"|"verified"|"rejected"|"suspended";
  founding_partner:boolean; created_at:string; updated_at:string;
};

export const partnerAdminService = {
  async list():Promise<AdminPartnerProfile[]>{
    const {data,error}=await (supabase.from("partner_profiles") as any)
      .select("id,owner_user_id,display_name,slug,partner_type,organization_name,headline,description,website_url,contact_email,service_area,opportunity_types,creator_interests,verification_status,founding_partner,created_at,updated_at")
      .order("created_at",{ascending:false});
    if(error) throw error; return (data??[]) as AdminPartnerProfile[];
  },
  async review(partnerId:string,status:AdminPartnerProfile["verification_status"],foundingPartner=false):Promise<AdminPartnerProfile>{
    const {data,error}=await (supabase.rpc as any)("review_partner_application",{
      p_partner_id:partnerId,p_status:status,p_founding_partner:foundingPartner,
    });
    if(error) throw new Error(error.message); return data as AdminPartnerProfile;
  },
};