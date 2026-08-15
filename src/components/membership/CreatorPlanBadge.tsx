import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export function CreatorPlanBadge({ userId }: { userId: string }) {
  const [plan, setPlan] = useState("");
  useEffect(() => {
    void (async () => {
      const { data } = await (supabase.rpc as any)("get_public_creator_plan", { p_user_id: userId });
      setPlan(data || "");
    })();
  }, [userId]);
  if (plan === "founding_beta") return <Badge className="mt-2">Founding Creator</Badge>;
  if (plan === "creator_plus") return <Badge className="mt-2 bg-gradient-brand text-white">Creator Plus</Badge>;
  if (plan === "creator_pro") return <Badge className="mt-2 bg-gradient-brand text-white">Creator Pro</Badge>;
  if (plan === "creator_studio") return <Badge className="mt-2 bg-gradient-brand text-white">Creator Studio</Badge>;
  return null;
}

