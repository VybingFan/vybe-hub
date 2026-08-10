import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, Check, Loader2, Music2, ListMusic } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceSection } from "@/components/workspace/WorkspaceSection";
import { useUser } from "@/hooks/useUser";
import { useCreatorTracks } from "@/hooks/useMusic";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useMembershipAdjustment } from "@/hooks/useMembershipAdjustment";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/content-continuity")({ component: Page });
type Choice={entity_type:string;entity_id:string;keep_public:boolean};
function Page(){return <RoleGuard allow={["creator","admin"]}><Content /></RoleGuard>}
function Content(){
 const {user}=useUser();
 const {data:adjustment,isLoading}=useMembershipAdjustment();
 const {data:tracks=[]}=useCreatorTracks(user?.id);
 const {data:playlists=[]}=usePlaylists(user?.id);
 const [choices,setChoices]=useState<Choice[]>([]); const [saving,setSaving]=useState("");
 useEffect(()=>{if(!user||!adjustment)return; void supabase.from("creator_content_continuity_choices" as any).select("entity_type,entity_id,keep_public").eq("user_id",user.id).eq("adjustment_id",adjustment.id).then(({data})=>setChoices((data??[]) as unknown as Choice[]));},[user,adjustment]);
 const map=useMemo(()=>new Map(choices.map(x=>[`${x.entity_type}:${x.entity_id}`,x.keep_public])),[choices]);
 const setChoice=async(type:string,id:string,keep:boolean)=>{if(!adjustment)return;setSaving(`${type}:${id}`);const {error}=await (supabase.rpc as any)("set_my_content_continuity_choice",{p_adjustment_id:adjustment.id,p_entity_type:type,p_entity_id:id,p_keep_public:keep});setSaving("");if(error)return toast.error(error.message);setChoices(c=>[...c.filter(x=>x.entity_type!==type||x.entity_id!==id),{entity_type:type,entity_id:id,keep_public:keep}]);toast.success(keep?"Selected to remain public":"Selected for private retention");};
 if(isLoading)return <Loader2 className="m-8 animate-spin"/>;
 if(!adjustment||adjustment.status==="restored")return <div className="mx-auto max-w-4xl space-y-5"><WorkspacePageHeader title="Content continuity" description="There is no active membership adjustment requiring content organization."/><Button asChild variant="outline"><Link to="/settings">Return to Membership settings</Link></Button></div>;
 const Row=({type,id,title,meta}:{type:string;id:string;title:string;meta:string})=>{const key=`${type}:${id}`,value=map.get(key);return <div className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="truncate font-medium">{title}</p><p className="truncate text-xs text-muted-foreground">{meta}</p></div><Badge variant={value===false?"outline":"secondary"}>{value===false?"Retain privately":"Remain public"}</Badge><div className="flex gap-2"><Button size="sm" variant={value!==false?"default":"outline"} disabled={saving===key} onClick={()=>setChoice(type,id,true)}><Check className="mr-1 h-3.5 w-3.5"/>Public</Button><Button size="sm" variant={value===false?"default":"outline"} disabled={saving===key} onClick={()=>setChoice(type,id,false)}><Archive className="mr-1 h-3.5 w-3.5"/>Private</Button></div></div>};
 return <div className="mx-auto max-w-5xl space-y-5"><WorkspacePageHeader title="Choose what remains public" description="Your work is never deleted. Choose public highlights; retain everything else privately for later restoration."/><div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">Changes affect public visibility only after the adjustment period ends. Your private workspace keeps every item.</div><WorkspaceSection title="Public music" description={`${tracks.length} songs in your library`} action={<Music2 className="h-5 w-5 text-primary"/>}><div className="space-y-2 p-3">{tracks.map(t=><Row key={t.id} type="track" id={t.id} title={t.title} meta={`${t.genre||"No genre"} · ${t.status} · ${t.visibility}`}/>)}</div></WorkspaceSection><WorkspaceSection title="Public playlists" description={`${playlists.length} playlists in your workspace`} action={<ListMusic className="h-5 w-5 text-primary"/>}><div className="space-y-2 p-3">{playlists.map(p=><Row key={p.id} type="playlist" id={p.id} title={p.title} meta={`${p.is_published?"Published":"Draft"} · ${p.access_mode}`}/>)}</div></WorkspaceSection></div>;
}
