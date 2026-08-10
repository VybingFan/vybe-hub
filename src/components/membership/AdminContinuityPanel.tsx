import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type Row={adjustment_id:string;user_id:string;previous_plan_code:string;target_plan_code:string;adjustment_status:string;started_at:string;ends_at:string;days_remaining:number;public_choice_count:number;private_retention_count:number};
export function AdminContinuityPanel(){
 const[rows,setRows]=useState<Row[]>([]);const[error,setError]=useState("");
 useEffect(()=>{void (supabase.rpc as any)("get_admin_membership_continuity_summary").then(({data,error}:{data:Row[]|null;error:{message:string}|null})=>{if(error)setError(error.message);else setRows(data??[])});},[]);
 const counts=useMemo(()=>({active:rows.filter(x=>x.adjustment_status==="active").length,expired:rows.filter(x=>x.adjustment_status==="expired").length,restored:rows.filter(x=>x.adjustment_status==="restored").length}),[rows]);
 return <section className="space-y-3"><div><h2 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="h-5 w-5"/>Membership continuity</h2><p className="mt-1 text-sm text-muted-foreground">Lifecycle status and aggregate selections only. Private creator content is not displayed.</p></div><div className="grid gap-3 sm:grid-cols-3"><Metric label="Active" value={counts.active}/><Metric label="Expired" value={counts.expired}/><Metric label="Restored" value={counts.restored}/></div>{error?<Card><CardContent className="p-5 text-sm text-destructive">{error}</CardContent></Card>:<Card><CardContent className="divide-y p-0">{rows.length?rows.map(x=><div key={x.adjustment_id} className="grid gap-2 p-4 text-sm md:grid-cols-[1fr_auto_auto]"><div><div className="flex flex-wrap items-center gap-2"><Badge variant={x.adjustment_status==="active"?"default":"outline"}>{x.adjustment_status}</Badge><span className="capitalize">{x.previous_plan_code.replaceAll("_"," ")} → {x.target_plan_code.replaceAll("_"," ")}</span></div><p className="mt-1 text-xs text-muted-foreground">Account {x.user_id.slice(0,8)}… · ends {new Date(x.ends_at).toLocaleDateString()}</p></div><span>{x.public_choice_count} public choices</span><span>{x.private_retention_count} retained privately</span></div>):<p className="p-5 text-sm text-muted-foreground">No membership adjustment records.</p>}</CardContent></Card>}</section>;
}
function Metric({label,value}:{label:string;value:number}){return <Card><CardContent className="p-4"><p className="text-2xl font-semibold">{value}</p><p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5"/>{label}</p></CardContent></Card>}
