import { useEffect,useState } from "react";
import { useNavigate,useRouterState } from "@tanstack/react-router";
import { BriefcaseBusiness,Compass,LayoutDashboard,Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMembership } from "@/hooks/useMembership";
import { useUser } from "@/hooks/useUser";
import { hasCreatorFeature } from "@/features/membership/entitlements";

type Identity={id:string;identity_type:"supporter"|"creator"|"business";display_name:string};
type WorkspaceMode="back_office"|"creator_studio"|"business_studio"|"member";
export const ACTIVE_IDENTITY_KEY="vybe:active-identity";
export const ACTIVE_WORKSPACE_KEY="vybe:active-workspace";
export function getActiveIdentity():Identity|null{try{return JSON.parse(localStorage.getItem(ACTIVE_IDENTITY_KEY)||"null")}catch{return null}}

export function IdentityModeBar(){
 const[items,setItems]=useState<Identity[]>([]);const[active,setActive]=useState<Identity|null>(null);const navigate=useNavigate();const pathname=useRouterState({select:s=>s.location.pathname});const{hasRole}=useUser();
 const workspace:WorkspaceMode=pathname.startsWith("/admin")?"back_office":pathname.startsWith("/business")?"business_studio":["/dashboard","/content","/music","/playlists","/videos","/film-","/creator-","/connections","/merch","/commerce","/epk"].some(prefix=>pathname.startsWith(prefix))?"creator_studio":"member";
 const{data:membership}=useMembership(active?.identity_type==="creator"||workspace==="creator_studio");
 useEffect(()=>{window.sessionStorage.setItem(ACTIVE_WORKSPACE_KEY,workspace)},[workspace]);
 useEffect(()=>{void(async()=>{const{data,error}=await(supabase.rpc as any)("ensure_my_identities");if(!error&&data){setItems(data);const saved=getActiveIdentity();setActive(data.find((x:Identity)=>x.id===saved?.id)||data[0]||null)}})()},[]);
 const choose=async(id:string)=>{const item=items.find(x=>x.id===id);if(!item)return;await(supabase.rpc as any)("set_my_active_identity",{p_identity_id:item.id});localStorage.setItem(ACTIVE_IDENTITY_KEY,JSON.stringify(item));setActive(item);window.dispatchEvent(new CustomEvent("vybe:identity-changed",{detail:item}))};
 const openWorkspace=async(mode:Exclude<WorkspaceMode,"back_office">)=>{window.sessionStorage.setItem(ACTIVE_WORKSPACE_KEY,mode);if(mode==="creator_studio"){const creator=items.find(x=>x.identity_type==="creator");if(creator)await choose(creator.id);navigate({to:"/dashboard"});return}if(mode==="business_studio"){const business=items.find(x=>x.identity_type==="business");if(business)await choose(business.id);navigate({to:"/business"});return}const supporter=items.find(x=>x.identity_type==="supporter");if(supporter)await choose(supporter.id);navigate({to:"/home"})};
 if(!active)return null;const creatorCanBrowse=active.identity_type!=="creator"||hasCreatorFeature(membership?.plan_code,"creator_mode.browse");
 return <div className="border-b border-primary/15 bg-gradient-to-r from-primary/8 via-background to-violet-500/8"><div className="mx-auto flex min-h-12 max-w-7xl flex-wrap items-center gap-2 px-4 py-2"><div className="mr-auto flex min-w-0 items-center gap-2"><span className="truncate text-sm text-muted-foreground">Viewing as <strong className="text-foreground">{active.display_name}</strong></span><Badge variant="outline" className="capitalize">{active.identity_type}</Badge><Badge className="hidden capitalize sm:inline-flex">{workspace.replaceAll("_"," ")}</Badge></div>{items.length>1?<select aria-label="Choose active identity" value={active.id} onChange={e=>void choose(e.target.value)} className="h-9 max-w-48 rounded-full border border-border bg-background px-3 text-sm shadow-sm">{items.map(x=><option key={x.id} value={x.id}>{x.identity_type==="supporter"?"Supporter Mode":x.display_name}</option>)}</select>:null}{(hasRole("creator")||hasRole("admin"))&&workspace!=="creator_studio"?<Button size="sm" className="rounded-full bg-gradient-brand text-white" onClick={()=>void openWorkspace("creator_studio")}><LayoutDashboard className="mr-2 h-4 w-4"/>Creator Studio</Button>:null}{hasRole("business")&&workspace!=="business_studio"?<Button size="sm" variant="outline" className="rounded-full" onClick={()=>void openWorkspace("business_studio")}><BriefcaseBusiness className="mr-2 h-4 w-4"/>Business Studio</Button>:null}{workspace!=="member"&&creatorCanBrowse?<Button size="sm" variant="outline" className="rounded-full" onClick={()=>void openWorkspace("member")}><Compass className="mr-2 h-4 w-4"/>Explore VYBE</Button>:null}{workspace==="member"&&active.identity_type!=="supporter"?<Button size="sm" variant="outline" className="rounded-full" onClick={()=>void openWorkspace("member")}><Users className="mr-2 h-4 w-4"/>Supporter Mode</Button>:null}</div></div>;
}
