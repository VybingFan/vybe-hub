import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function EpkTierNotice() {
  const [full, setFull] = useState<boolean | null>(null);
  useEffect(() => {
    void supabase.rpc("get_my_epk_tier").then(({ data }) =>
      setFull(Boolean(data && typeof data === "object" && "full_epk" in data && data.full_epk)),
    );
  }, []);
  if (full !== false) return null;
  return <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div><p className="flex items-center gap-2 font-semibold"><LockKeyhole className="h-4 w-4 text-primary" />Creator Free EPK Starter</p>
      <p className="mt-1 text-sm text-muted-foreground">Includes a short bio, booking email, one press photo, two featured tracks, and private readiness. Plus adds full bios, contacts, brand files, credits, WAV masters, and press milestones.</p></div>
      <Button asChild><Link to="/creator-memberships">View Creator Plus</Link></Button>
    </div>
  </div>;
}
