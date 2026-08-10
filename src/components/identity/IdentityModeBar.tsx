import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Compass, LayoutDashboard, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMembership } from "@/hooks/useMembership";
import { hasCreatorFeature } from "@/features/membership/entitlements";

type Identity={id:string;identity_type:"supporter"|"creator"|"business";display_name:string};
export const ACTIVE_IDENTITY_KEY="vybe:active-identity";
export function getActiveIdentity():Identity|null{try{return JSON.parse(localStorage.getItem(ACTIVE_IDENTITY_KEY)||"null")}catch{return null}}

export function IdentityModeBar(){
  const[items,setItems]=useState<Identity[]>([]);const[active,setActive]=useState<Identity|null>(null);
  const navigate=useNavigate();
  const{data:membership}=useMembership(active?.identity_type==="creator");
  useEffect(()=>{void(async()=>{const{data,error}=await(supabase.rpc as any)("ensure_my_identities");if(!error&&data){setItems(data);const saved=getActiveIdentity();setActive(data.find((x:Identity)=>x.id===saved?.id)||data[0]||null)}})()},[]);
  const choose=async(id:string,goHome=false)=>{const item=items.find(x=>x.id===id);if(!item)return;await(supabase.rpc as any)("set_my_active_identity",{p_identity_id:item.id});localStorage.setItem(ACTIVE_IDENTITY_KEY,JSON.stringify(item));setActive(item);window.dispatchEvent(new CustomEvent("vybe:identity-changed",{detail:item}));if(goHome)navigate({to:"/home"})};
  if(!active)return null;
  const supporter=items.find(x=>x.identity_type==="supporter");
  const creatorCanBrowse=active.identity_type!=="creator"||hasCreatorFeature(membership?.plan_code,"creator_mode.browse");
  return <div className="border-b border-primary/15 bg-gradient-to-r from-primary/8 via-background to-violet-500/8"><div className="mx-auto flex min-h-12 max-w-7xl flex-wrap items-center gap-2 px-4 py-2"><div className="mr-auto flex min-w-0 items-center gap-2"><span className="truncate text-sm text-muted-foreground">Viewing as <strong className="text-foreground">{active.display_name}</strong></span><Badge variant="outline" className="capitalize">{active.identity_type}</Badge></div>{items.length>1&&<select aria-label="Choose active identity" value={active.id} onChange={e=>void choose(e.target.value)} className="h-9 max-w-48 rounded-full border border-border bg-background px-3 text-sm shadow-sm">{items.map(x=><option key={x.id} value={x.id}>{x.identity_type==="supporter"?"Supporter Mode":x.display_name}</option>)}</select>}{creatorCanBrowse?<Button asChild size="sm" variant="outline" className="rounded-full"><Link to="/home"><Compass className="mr-2 h-4 w-4"/>Explore VYBE</Link></Button>:supporter?<Button size="sm" variant="outline" className="rounded-full" onClick={()=>void choose(supporter.id,true)}><Users className="mr-2 h-4 w-4"/>View as Supporter</Button>:null}{active.identity_type==="creator"&&<Button asChild size="sm" className="rounded-full bg-gradient-brand text-white"><Link to="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4"/>Studio</Link></Button>}</div></div>}

