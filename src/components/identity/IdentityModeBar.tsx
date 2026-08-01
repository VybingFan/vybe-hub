import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Identity = { id: string; identity_type: "supporter"|"creator"|"business"; display_name: string };
export const ACTIVE_IDENTITY_KEY = "vybe:active-identity";
export function getActiveIdentity(): Identity | null { try { return JSON.parse(localStorage.getItem(ACTIVE_IDENTITY_KEY)||"null"); } catch { return null; } }

export function IdentityModeBar() {
 const [items,setItems]=useState<Identity[]>([]); const [active,setActive]=useState<Identity|null>(null);
 useEffect(()=>{ void (async()=>{ const {data,error}=await (supabase.rpc as any)("ensure_my_identities"); if(!error&&data){setItems(data); const saved=getActiveIdentity(); setActive(data.find((x:Identity)=>x.id===saved?.id)||data[0]||null);} })(); },[]);
 const choose=async(item:Identity)=>{ await (supabase.rpc as any)("set_my_active_identity",{p_identity_id:item.id}); localStorage.setItem(ACTIVE_IDENTITY_KEY,JSON.stringify(item)); setActive(item); window.dispatchEvent(new CustomEvent("vybe:identity-changed",{detail:item})); };
 if(!active) return null;
 return <div className="border-b border-primary/20 bg-primary/5"><div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2 text-sm"><span>You are interacting as <strong>{active.display_name}</strong></span><Badge variant="outline" className="capitalize">{active.identity_type}</Badge>{items.filter(x=>x.id!==active.id).map(x=><Button key={x.id} size="sm" variant="ghost" onClick={()=>choose(x)}>Switch to {x.identity_type==="supporter"?"Supporter Mode":x.display_name}</Button>)}</div></div>;
}

