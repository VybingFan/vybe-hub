import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { CreatorFocusGuard } from "@/components/membership/CreatorFocusGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/hooks/useUser";
import { writingService } from "@/services/writing/writingService";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/writing-collections")({ component: Page });

function Page() {
  return <RoleGuard allow={["creator","admin"]}><CreatorFocusGuard focus="writing" title="Writing Collections require the Writing focus" description="Activate Writing, Poetry & Storytelling to create spoken-word and reading collections."><Collections/></CreatorFocusGuard></RoleGuard>;
}

function Collections() {
  const { user } = useUser();
  const qc = useQueryClient();
  const [t,setT] = useState("");
  const [d,setD] = useState("");
  const [selected,setSelected] = useState<Record<string,string>>({});
  const [busy,setBusy] = useState<string|null>(null);
  const cols = useQuery({queryKey:["writing-collections",user?.id],queryFn:()=>writingService.listCollections(user!.id),enabled:!!user});
  const works = useQuery({queryKey:["writing-works",user?.id],queryFn:()=>writingService.listMine(user!.id),enabled:!!user});
  const create = async()=>{if(!t.trim()||!user)return;try{setBusy("create");await writingService.createCollection(user.id,t,d);setT("");setD("");await cols.refetch();toast.success("Collection created")}catch(e){toast.error(e instanceof Error?e.message:"Could not create collection")}finally{setBusy(null)}};
  const copy = async(slug:string)=>{try{await navigator.clipboard.writeText(`${window.location.origin}/reading/${slug}`);toast.success("Collection link copied")}catch{toast.error("Could not copy collection link")}};
  return <div className="mx-auto max-w-6xl space-y-6">
    <Button asChild variant="ghost"><Link to="/writing-studio"><ArrowLeft className="mr-2 h-4 w-4"/>Works Library</Link></Button>
    <div><p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Writers & Poets</p><h1 className="text-3xl font-bold">Reading & Spoken-Word Collections</h1><p className="mt-2 text-muted-foreground">Sequence poems, spoken-word pieces and book excerpts into shareable collections.</p></div>
    <div className="rounded-2xl border bg-card p-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]"><Input value={t} onChange={e=>setT(e.target.value)} placeholder="Collection title"/><Textarea value={d} onChange={e=>setD(e.target.value)} placeholder="Description" rows={1}/><Button onClick={create} disabled={busy==="create"||!t.trim()}><Plus className="mr-2 h-4 w-4"/>Create</Button></div>
    <div className="space-y-4">{cols.data?.map(c=><div key={c.id} className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">{c.title}</h2><p className="text-sm text-muted-foreground">{c.description||"Build a reading or spoken-word sequence."}</p><p className="mt-2 text-xs">{c.status} · {c.visibility}</p></div>
      <div className="flex flex-wrap gap-2">{c.status==="published"&&<><Button asChild variant="ghost"><a href={`/reading/${c.slug}`} target="_blank" rel="noreferrer">View</a></Button><Button variant="ghost" onClick={()=>void copy(c.slug)}>Copy link</Button></>}<Button variant="outline" disabled={busy===`publish:${c.id}`} onClick={async()=>{try{setBusy(`publish:${c.id}`);await writingService.setCollectionPublished(c.id,user!.id,c.status!=="published");await cols.refetch()}catch(e){toast.error(e instanceof Error?e.message:"Could not update publishing")}finally{setBusy(null)}}}>{c.status==="published"?"Move to Draft":"Publish"}</Button></div></div>
      <CollectionItems collectionId={c.id} creatorId={user!.id}/>
      <div className="mt-4 flex gap-2"><Select value={selected[c.id]||""} onValueChange={v=>setSelected({...selected,[c.id]:v})}><SelectTrigger><SelectValue placeholder="Choose a work to add"/></SelectTrigger><SelectContent>{works.data?.filter(w=>w.status==="published").map(w=><SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>)}</SelectContent></Select>
      <Button variant="secondary" disabled={!selected[c.id]||busy===`add:${c.id}`} onClick={async()=>{try{setBusy(`add:${c.id}`);await writingService.addCollectionItem(c.id,selected[c.id],null,user!.id);setSelected(x=>({...x,[c.id]:""}));await qc.invalidateQueries({queryKey:["writing-collection-items",c.id]});toast.success("Work added to collection")}catch(e){toast.error(e instanceof Error?e.message:"Could not add work")}finally{setBusy(null)}}}>Add</Button></div>
    </div>)}</div>
  </div>;
}

function CollectionItems({collectionId,creatorId}:{collectionId:string;creatorId:string}) {
  const qc=useQueryClient(); const [busy,setBusy]=useState<string|null>(null);
  const items=useQuery({queryKey:["writing-collection-items",collectionId],queryFn:()=>writingService.listCollectionItems(collectionId)});
  if(items.isLoading)return <p className="mt-4 text-sm text-muted-foreground">Loading collection items…</p>;
  if(!items.data?.length)return <p className="mt-4 text-sm text-muted-foreground">No works have been added yet.</p>;
  return <div className="mt-4 space-y-2"><p className="text-sm font-medium">Collection sequence</p>{items.data.map((item:any,index:number)=><div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-medium">{index+1}. {item.work?.title||"Untitled work"}</p><p className="text-xs text-muted-foreground">{item.media?.media_type?`Preferred media: ${item.media.media_type}`:"Uses the work’s first spoken audio when available"}</p></div><Button size="sm" variant="ghost" disabled={busy===item.id} onClick={async()=>{try{setBusy(item.id);await writingService.removeCollectionItem(item.id,creatorId);await qc.invalidateQueries({queryKey:["writing-collection-items",collectionId]});toast.success("Work removed from collection")}catch(e){toast.error(e instanceof Error?e.message:"Could not remove work")}finally{setBusy(null)}}}>Remove</Button></div>)}</div>;
}
