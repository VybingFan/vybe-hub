import { createFileRoute,Link } from "@tanstack/react-router";
import { useCallback,useEffect,useMemo,useState } from "react";
import { ArrowLeft,CheckCircle2,Handshake,RefreshCw,ShieldCheck,XCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { partnerAdminService,type AdminPartnerProfile } from "@/services/partner/partnerAdminService";

export const Route=createFileRoute("/_authenticated/admin_/founding-partners")({component:FoundingPartnersRoute});
function FoundingPartnersRoute(){return <AdminPermissionGuard anyOf={["admin.creator.read","admin.business.read"]}><FoundingPartners/></AdminPermissionGuard>}

function FoundingPartners(){
 const[partners,setPartners]=useState<AdminPartnerProfile[]>([]);const[loading,setLoading]=useState(true);const[working,setWorking]=useState<string|null>(null);
 const load=useCallback(async()=>{setLoading(true);try{setPartners(await partnerAdminService.list())}catch(e){toast.error(e instanceof Error?e.message:"Could not load Founding Partners")}finally{setLoading(false)}},[]);
 useEffect(()=>void load(),[load]);
 const counts=useMemo(()=>({pending:partners.filter(x=>x.verification_status==="pending").length,verified:partners.filter(x=>x.verification_status==="verified").length,founding:partners.filter(x=>x.founding_partner).length}),[partners]);
 async function review(partner:AdminPartnerProfile,status:AdminPartnerProfile["verification_status"],founding=false){setWorking(partner.id);try{await partnerAdminService.review(partner.id,status,founding);toast.success(status==="verified"?`${partner.display_name} approved`: `${partner.display_name} marked ${status}`);await load()}catch(e){toast.error(e instanceof Error?e.message:"Could not review partner")}finally{setWorking(null)}}
 return <div className="mx-auto max-w-7xl space-y-7">
  <header><Button variant="ghost" size="sm" asChild><Link to="/admin"><ArrowLeft className="mr-1 h-4 w-4"/>Back to Back Office</Link></Button>
   <div className="mt-3 flex items-center gap-2 text-primary"><Handshake className="h-5 w-5"/>Creator opportunity partners</div>
   <div className="mt-2 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-semibold tracking-tight">Founding Partners</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Review people and organizations that can create opportunities for VYBE creators. This is separate from the Business advertising Partner Center.</p></div><Button variant="outline" size="icon" onClick={()=>void load()} aria-label="Refresh"><RefreshCw className="h-4 w-4"/></Button></div>
  </header>
  <div className="grid gap-4 sm:grid-cols-3"><Summary label="Pending Review" value={counts.pending}/><Summary label="Verified Partners" value={counts.verified}/><Summary label="Founding Partners" value={counts.founding}/></div>
  <section className="space-y-4">{loading?<Card><CardContent className="p-6 text-sm text-muted-foreground">Loading partner applications…</CardContent></Card>:partners.length?partners.map(p=><PartnerCard key={p.id} partner={p} busy={working===p.id} onReview={review}/>):<Card><CardContent className="p-6 text-sm text-muted-foreground">No Founding Partner applications yet.</CardContent></Card>}</section>
 </div>;
}

function PartnerCard({partner,busy,onReview}:{partner:AdminPartnerProfile;busy:boolean;onReview:(partner:AdminPartnerProfile,status:AdminPartnerProfile["verification_status"],founding?:boolean)=>Promise<void>}){
 return <Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{partner.display_name}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{partner.organization_name||partner.headline||partner.partner_type}</p></div><div className="flex gap-2"><Badge variant="outline" className="capitalize">{partner.verification_status}</Badge>{partner.founding_partner?<Badge>Founding Partner</Badge>:null}</div></div></CardHeader><CardContent className="space-y-4">
  <div className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-4"><Fact label="Type" value={partner.partner_type}/><Fact label="Market" value={partner.service_area||"Not provided"}/><Fact label="Contact" value={partner.contact_email}/><Fact label="Website" value={partner.website_url||"Not provided"}/></div>
  {partner.description?<p className="rounded-2xl bg-muted/40 p-4 text-sm leading-6">{partner.description}</p>:null}
  <div className="grid gap-4 md:grid-cols-2"><TagList label="Opportunity types" items={partner.opportunity_types}/><TagList label="Creator interests" items={partner.creator_interests}/></div>
  <div className="flex flex-wrap gap-2 border-t pt-4">
   {partner.verification_status!=="verified"?<><Button disabled={busy} onClick={()=>void onReview(partner,"verified",true)} className="rounded-full"><ShieldCheck className="mr-2 h-4 w-4"/>Approve as Founding Partner</Button><Button disabled={busy} variant="outline" onClick={()=>void onReview(partner,"verified",false)} className="rounded-full"><CheckCircle2 className="mr-2 h-4 w-4"/>Approve Partner</Button></>:null}
   {partner.verification_status!=="rejected"?<Button disabled={busy} variant="outline" onClick={()=>void onReview(partner,"rejected",false)} className="rounded-full"><XCircle className="mr-2 h-4 w-4"/>Reject</Button>:null}
   {partner.verification_status==="verified"?<Button disabled={busy} variant="destructive" onClick={()=>void onReview(partner,"suspended",false)} className="rounded-full">Suspend</Button>:null}
  </div>
 </CardContent></Card>;
}
function Summary({label,value}:{label:string;value:number}){return <Card><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></CardContent></Card>}
function Fact({label,value}:{label:string;value:string}){return <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 break-words capitalize">{value}</p></div>}
function TagList({label,items}:{label:string;items:string[]}){return <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><div className="mt-2 flex flex-wrap gap-2">{items.length?items.map(item=><Badge key={item} variant="secondary">{item}</Badge>):<span className="text-sm text-muted-foreground">None listed</span>}</div></div>}
