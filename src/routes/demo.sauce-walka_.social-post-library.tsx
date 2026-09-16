import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Link2, Save, Send, Sparkles } from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo/sauce-walka_/social-post-library")({
  head: () => ({ meta: [{ title: "Sauce Walka — Social Post Library Demo" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: SocialPostLibraryDemo,
});

const known: Record<string,{date:string; title:string; tags:string[]; related:string}> = {
  "DdQChtBNFRp": { date:"2026-09-14", title:"Miami THC Store", tags:["THC Club","South Florida","Creator opportunity","Business"], related:"Business" },
  "DY7_UuhpotV": { date:"2026-05-29", title:"Houston THC Store", tags:["THC Club","Houston","Creator opportunity","Business"], related:"Business" },
  "DcCoLIAtdkp": { date:"2026-08-14", title:"Store Update", tags:["THC Club","Store update","Business","State to state"], related:"Business" },
};

function detectPlatform(url:string) {
  if (url.includes("instagram.com")) return "Instagram";
  if (url.includes("tiktok.com")) return "TikTok";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";
  if (url.includes("facebook.com")) return "Facebook";
  if (url.includes("x.com") || url.includes("twitter.com")) return "X";
  return url ? "Other" : "Waiting for link";
}function SocialPostLibraryDemo() {
  const [url,setUrl] = useState("");
  const match = useMemo(() => Object.entries(known).find(([key]) => url.includes(key))?.[1], [url]);
  const [title,setTitle] = useState("");
  const [date,setDate] = useState("");
  const [visibility,setVisibility] = useState("Public");
  const [related,setRelated] = useState("None");
  const [selectedTags,setSelectedTags] = useState<string[]>([]);
  const [status,setStatus] = useState<string | null>(null);
  const platform = detectPlatform(url);
  const effectiveTitle = title || match?.title || "";
  const effectiveDate = date || match?.date || "";
  const suggestions = match?.tags ?? ["Music","Business","Event","Behind the scenes"];
  const toggleTag = (tag:string) => setSelectedTags(v => v.includes(tag) ? v.filter(x=>x!==tag) : [...v,tag]);
  const save = (publish:boolean) => {
    if (!url.trim() || !effectiveTitle.trim() || !effectiveDate) return setStatus("Add the link, a short memory title, and the post date first.");
    setStatus(publish ? "Published to Find It Again — supporter view updated in this demo." : "Saved as draft in Sauce’s Social Post Library.");
  };

  return <div className="min-h-screen bg-background"><MarketingNav />
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <a href="/demo/sauce-walka/find-it-again" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to supporter Find It Again</a>
      <p className="mt-7 text-xs font-bold uppercase tracking-[.22em] text-fuchsia-300">Creator view • Social Post Library</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Save an important social post in seconds.</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">This is the Creator HQ side of Find It Again. Sauce can see what he has already saved, then add another social link in a few quick steps.</p>

      <section className="mt-8 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">Creator HQ • Find It Again library</p><h2 className="mt-2 text-2xl font-black">3 saved social moments</h2><p className="mt-2 text-sm text-muted-foreground">These are organized for supporters to discover through search — not displayed as a public wall of links.</p></div><Button asChild variant="outline" className="rounded-full"><a href="/demo/sauce-walka/find-it-again">Preview supporter search</a></Button></div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Miami THC Store","Sept. 14, 2026","Instagram Reel","THC Club • South Florida • Creator opportunity"],
            ["Houston THC Store","May 29, 2026","Instagram Reel","THC Club • Houston • Business"],
            ["Store Update","Aug. 14","Instagram Reel","THC Club • Store update • State to state"],
          ].map(([t,d,f,m]) => <div key={t} className="rounded-2xl border border-border bg-background p-4"><div className="flex items-center justify-between gap-3"><Badge variant="outline">Published</Badge><span className="text-xs text-muted-foreground">{f}</span></div><h3 className="mt-4 font-black">{t}</h3><p className="mt-1 text-xs text-muted-foreground">{d}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{m}</p></div>)}
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center gap-3"><Link2 className="h-6 w-6 text-cyan-300" /><h2 className="text-xl font-black">1. Paste the post link</h2></div>
        <input value={url} onChange={e=>{setUrl(e.target.value);setStatus(null);}} placeholder="https://www.instagram.com/reel/..." className="mt-4 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-fuchsia-400 sm:text-base" />
        <div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline">{platform}</Badge>{match && <Badge className="bg-cyan-500/15 text-cyan-200">VYBE recognized this demo post</Badge>}</div>
      </section>
      <section className="mt-5 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center gap-3"><Sparkles className="h-6 w-6 text-fuchsia-300" /><h2 className="text-xl font-black">2. Give supporters a memory clue</h2></div>
        <p className="mt-2 text-sm text-muted-foreground">Keep it short — usually 2–3 words.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Memory title<input value={effectiveTitle} onChange={e=>setTitle(e.target.value)} placeholder="Houston THC Store" className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 font-normal outline-none focus:border-fuchsia-400" /></label>
          <label className="text-sm font-semibold">Post date<input type="date" value={effectiveDate} onChange={e=>setDate(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 font-normal outline-none focus:border-fuchsia-400" /></label>
        </div>
        <div className="mt-5"><p className="text-sm font-semibold">Suggested tags</p><div className="mt-3 flex flex-wrap gap-2">{suggestions.map(tag => <button key={tag} onClick={()=>toggleTag(tag)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${selectedTags.includes(tag) ? "border-fuchsia-400 bg-fuchsia-500/15 text-fuchsia-200" : "border-border text-muted-foreground"}`}>{tag}</button>)}</div></div>
      </section>

      <section className="mt-5 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <h2 className="text-xl font-black">3. Decide where it belongs</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Related to<select value={related === "None" && match ? match.related : related} onChange={e=>setRelated(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 font-normal"><option>None</option><option>Music</option><option>Business</option><option>Event</option><option>Merch</option><option>Video</option><option>Playlist</option><option>Project</option></select></label>
          <label className="text-sm font-semibold">Visibility<select value={visibility} onChange={e=>setVisibility(e.target.value)} className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 font-normal"><option>Public</option><option>Supporters</option><option>Selected</option><option>Private / Draft</option></select></label>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button onClick={()=>save(false)} variant="outline" className="rounded-full"><Save className="mr-2 h-4 w-4" />Save draft</Button><Button onClick={()=>save(true)} className="rounded-full"><Send className="mr-2 h-4 w-4" />Publish to Find It Again</Button></div>
        {status && <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">{status}</div>}
      </section>

      <div className="mt-8 rounded-3xl border border-dashed border-border p-5 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">What VYBE handles behind the scenes:</strong> platform detection, social format/media type where available, original URL, creator/account association, draft state and search metadata. The creator only needs to give the post a useful memory name, confirm the date, and make a few quick choices.</div>
    </main><Footer /></div>;
}
