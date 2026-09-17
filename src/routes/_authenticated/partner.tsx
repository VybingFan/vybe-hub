import { createFileRoute } from "@tanstack/react-router";
import { useCallback,useEffect,useState } from "react";
import { BarChart3,Handshake,Inbox,MessageSquare,Search,Settings,Star,UsersRound } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { partnerStudioService,type PartnerProfile } from "@/services/partner/partnerStudioService";

export const Route=createFileRoute("/_authenticated/partner")({component:PartnerStudioPage});

const tools=[
  [Search,"Discover Talent","Search creators who choose to be professionally discoverable."],
  [Star,"Saved Creators","Organize private talent lists, notes and shortlists."],
  [Handshake,"Opportunities","Create clear opportunities with requirements and compensation details."],
  [Inbox,"Invitations","Invite selected creators and track professional responses."],
  [MessageSquare,"Messages","Keep professional conversations connected to creators and opportunities."],
  [UsersRound,"Team","Add authorized partner team members and permissions."],
  [BarChart3,"Analytics","Measure invitations, responses, selections and completed opportunities."],
  [Settings,"Settings","Manage partner profile, privacy, notifications and access."],
] as const;

function PartnerStudioPage(){
  const[profile,setProfile]=useState<PartnerProfile|null>(null);const[loading,setLoading]=useState(true);const[opportunities,setOpportunities]=useState<any[]>([]);
  const load=useCallback(async()=>{setLoading(true);try{const p=await partnerStudioService.getMine();setProfile(p);setOpportunities(p?await partnerStudioService.listOpportunities(p.id):[])}catch(e){toast.error(e instanceof Error?e.message:"Could not load Partner Studio")}finally{setLoading(false)}},[]);
  useEffect(()=>void load(),[load]);
  async function apply(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();const form=new FormData(event.currentTarget);
    try{await partnerStudioService.apply({
      displayName:String(form.get("displayName")),slug:String(form.get("slug")),partnerType:String(form.get("partnerType")),
      organizationName:String(form.get("organizationName")||""),headline:String(form.get("headline")||""),description:String(form.get("description")||""),
      websiteUrl:String(form.get("websiteUrl")||""),contactEmail:String(form.get("contactEmail")),serviceArea:String(form.get("serviceArea")||""),
      opportunityTypes:String(form.get("opportunityTypes")||"").split(",").map(x=>x.trim()).filter(Boolean),
      creatorInterests:String(form.get("creatorInterests")||"").split(",").map(x=>x.trim()).filter(Boolean),
    });toast.success("Founding Partner application submitted for VYBE review");await load()}catch(e){toast.error(e instanceof Error?e.message:"Could not submit application")}
  }
  return <RoleGuard allow={["supporter","creator","business","partner","admin"]}>
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="rounded-3xl border bg-card/70 p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">Professional opportunity workspace</Badge><Badge variant="secondary">Partner Studio</Badge><Badge variant="outline">Founding Access: first year complimentary</Badge></div>
        <div className="mt-4 flex items-center gap-2 text-primary"><Handshake className="h-5 w-5"/>VYBE Founding Opportunity Network</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Partner Studio</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">Founding Partners are early ecosystem builders helping VYBE shape better professional pathways for creators. Partners can discover talent, collaborate, offer opportunities when appropriate, and provide feedback while creators remain in control of what they share.</p>
      </header>
      {!profile&&!loading?<PartnerApplication onSubmit={apply}/>:null}
      {profile?<PartnerWorkspace profile={profile} opportunities={opportunities}/>:null}
    </div>
  </RoleGuard>;
}
function PartnerApplication({onSubmit}:{onSubmit:(event:React.FormEvent<HTMLFormElement>)=>Promise<void>}){
 return <Card><CardHeader><CardTitle>Founding Partner application / invite setup</CardTitle></CardHeader><CardContent>
  <p className="mb-5 text-sm leading-6 text-muted-foreground">Complete this profile so VYBE can review who you are, how you would like to participate in the Founding Opportunity Network, and what kinds of creators or professional pathways interest you. Founding Partners are not required to guarantee jobs, referrals, promotions or placements.</p>
  <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
   <Field name="displayName" label="Public partner name" required/><Field name="slug" label="Partner URL name" required/>
   <div className="space-y-2"><Label htmlFor="partnerType">Partner type</Label><select id="partnerType" name="partnerType" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" defaultValue="creator"><option value="creator">Established creator / artist</option><option value="individual">Individual professional</option><option value="business">Business</option><option value="organization">Organization</option><option value="other">Other</option></select></div>
   <Field name="organizationName" label="Organization / company"/><Field name="headline" label="Professional headline"/><Field name="websiteUrl" label="Official website" type="url"/>
   <Field name="contactEmail" label="Professional contact email" type="email" required/><Field name="serviceArea" label="Markets / service area"/>
   <Field name="opportunityTypes" label="Ways you would like to participate" placeholder="discover talent, collaborate, mentor, events, media, sponsor, feedback"/>
   <Field name="creatorInterests" label="Creator interests" placeholder="music, film, Houston creators"/>
   <div className="space-y-2 md:col-span-2"><Label htmlFor="description">About you and how you would like to contribute to the VYBE ecosystem</Label><Textarea id="description" name="description" rows={5}/></div>
   <div className="md:col-span-2"><Button type="submit" className="rounded-full bg-gradient-brand">Submit for VYBE review</Button></div>
  </form>
 </CardContent></Card>;
}

function Field({name,label,type="text",required=false,placeholder}:{name:string;label:string;type?:string;required?:boolean;placeholder?:string}){
 return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} required={required} placeholder={placeholder}/></div>;
}
function PartnerWorkspace({profile,opportunities}:{profile:PartnerProfile;opportunities:any[]}){
 const verified=profile.verification_status==="verified";
 return <>
  <div className="grid gap-4 sm:grid-cols-4">
   <Summary label="Verification" value={profile.verification_status}/><Summary label="Founding Partner" value={profile.founding_partner?"yes":"pending"}/><Summary label="Opportunities" value={String(opportunities.length)}/><Summary label="Markets" value={profile.service_area||"Not set"}/>
  </div>
  <Card><CardHeader><CardTitle className="flex items-center gap-2"><Handshake className="h-5 w-5 text-primary"/>{profile.display_name}</CardTitle></CardHeader><CardContent>
   <div className="flex flex-wrap gap-2"><Badge>{profile.verification_status}</Badge>{profile.founding_partner?<Badge variant="secondary">Founding Partner</Badge>:null}<Badge variant="outline">{profile.partner_type}</Badge></div>
   <p className="mt-4 text-sm leading-6 text-muted-foreground">{verified?"Your Partner profile is verified. Partner Studio tools unlock according to your approved permissions and VYBE opportunity standards.":"VYBE is reviewing your Founding Partner profile. Discovery, invitation and opportunity publishing tools remain locked until verification."}</p>
  </CardContent></Card>
  <section><h2 className="mb-4 text-2xl font-semibold">Partner tools</h2><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{tools.map(([Icon,title,description])=><Card key={title} className={!verified?"opacity-70":""}><CardContent className="p-5"><Icon className="h-5 w-5 text-primary"/><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p><Badge variant="outline" className="mt-4">{verified?"Foundation ready":"Verification required"}</Badge></CardContent></Card>)}</div></section>
  {verified?<Card><CardHeader><CardTitle>Opportunity workspace</CardTitle></CardHeader><CardContent>{opportunities.length?opportunities.map((o:any)=><div key={o.id} className="mb-3 rounded-2xl border p-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{o.title}</p><Badge variant="outline">{o.status}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{o.summary}</p></div>):<p className="text-sm text-muted-foreground">No opportunities yet. Opportunity creation is the next production workflow to connect.</p>}</CardContent></Card>:null}
 </>;
}
function Summary({label,value}:{label:string;value:string}){return <Card><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 truncate text-xl font-semibold capitalize">{value}</p></CardContent></Card>}
