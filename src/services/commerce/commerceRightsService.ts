import { supabase } from "@/integrations/supabase/client";

export const SELLER_AGREEMENT_VERSION = "VYBE-MUSIC-SELLER-2026-08-13";

const db = supabase as any;

export type RightsDecision = "approved" | "changes_requested" | "rejected" | "suspended";

export const commerceRightsService = {
  async submit(productId: string, values: Record<string, unknown>) {
    const { error } = await db.rpc("submit_commerce_rights_v24_41g2a", {
      _product_id: productId,
      _owns_master: values.ownsMaster,
      _owns_composition: values.ownsComposition,
      _collaborators: values.collaborators,
      _samples: values.samples,
      _beat_license: values.beatLicense,
      _artwork: values.artwork,
      _no_conflict: values.noConflict,
      _authority: values.authority,
      _cover: values.cover,
      _third_party: values.thirdParty,
      _contributors: values.contributors,
      _rights_notes: values.rightsNotes,
      _evidence_notes: values.evidenceNotes,
      _agreement_version: SELLER_AGREEMENT_VERSION,
    });
    if (error) throw new Error(error.message);
  },

  async reviewQueue() {
    const { data, error } = await db
      .from("commerce_products")
      .select("id,title,creator_id,product_type,status,rights_status,updated_at,commerce_rights_declarations(*)")
      .in("rights_status", ["submitted", "changes_requested", "suspended"])
      .order("updated_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async review(productId: string, decision: RightsDecision, notes: string) {
    const { error } = await db.rpc("review_commerce_rights_v24_41g2a", {
      _product_id: productId,
      _decision: decision,
      _notes: notes,
    });
    if (error) throw new Error(error.message);
  },
};
