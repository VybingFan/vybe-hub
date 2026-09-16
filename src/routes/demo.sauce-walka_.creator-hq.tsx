import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity, BarChart3, Bell, BookOpenText, BriefcaseBusiness, CalendarDays, Clapperboard,
  Compass, ContactRound, CreditCard, Eye, FileText, GraduationCap, Heart, LayoutDashboard,
  LibraryBig, Link2, ListMusic, LockKeyhole, Menu, MessageCircle, Music2, Search, Settings,
  ShoppingBag, Upload, User, UsersRound, Workflow, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo/sauce-walka_/creator-hq")({
  head: () => ({ meta: [{ title: "Sauce Walka — Creator HQ Demo" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: SauceCreatorHQ,
});

type Item = { title:string; icon:any; href?:string; badge?:string };
type DemoPanel = { intro:string; features:string[]; example:string; status?:string };

const demoPanels: Record<string, DemoPanel> = {
  "Create & Manage": { intro:"One place to create, organize, schedule, edit and retire the content that appears across Sauce’s VYBE.", features:["Manage releases, videos, updates and creator posts","Set public, supporter, selected or private visibility","Schedule releases and feature what matters now","Keep drafts separate from published content"], example:"Sauce could prepare a new single, an Only Hands update and a THC Club announcement from one workspace.", status:"Production workspace" },
  "Events & Updates": { intro:"Publish appearances, pop-ups, community activity and creator updates without forcing supporters to search multiple social feeds.", features:["Create event and update cards","Add dates, cities, locations and ticket links","Choose who can see each update","Feature urgent or current announcements"], example:"A Houston appearance or THC Club creator event could be posted here and surfaced immediately on Sauce’s public VYBE.", status:"Production workspace" },
  "Upload Music": { intro:"Add music to VYBE and decide how supporters can hear, preview, buy or access each release.", features:["Upload audio and artwork","Add song and release metadata","Choose preview, full-listen or private access","Attach songs to playlists and sales"], example:"A new Sauce release could be uploaded once, then placed into the public catalog, a supporter playlist and a private early-listen room.", status:"Music workspace" },
  "Insights": { intro:"See how supporters are actually using the creator account—not just follower totals.", features:["Profile opens and traffic sources","Qualified song and playlist plays","Repeat listeners and completion behavior","Find It Again searches, saves and supporter actions"], example:"Sauce could see that supporters searched ‘THC store,’ opened saved posts, then returned to THE SAUCE STARTER PACK.", status:"Analytics preview" },
  "Connections": { intro:"Manage the people who intentionally connect with Sauce on VYBE and understand how that audience is growing.", features:["View new and returning connections","See supporter interests and engagement","Organize approved or closer-access groups","Identify high-engagement supporters without exposing private data"], example:"Sauce could distinguish casual profile visitors from supporters who repeatedly listen, save and return.", status:"Audience workspace" },
  "Creator Messages": { intro:"Keep creator-to-supporter and professional conversations organized inside the creator account.", features:["Supporter messages and replies","Professional and booking inquiries","Conversation filtering and priority","Creator-controlled response access"], example:"The 3-message badge could contain a supporter question, a brand inquiry and an appearance request in separate lanes.", status:"Messaging workspace" },
  "Social Discovery": { intro:"Understand how creator activity outside VYBE can bring people back into the creator’s organized home.", features:["Track approved social destinations","Connect discovery traffic to creator content","Support Find It Again indexing","See which external posts create return visits"], example:"An Instagram THC Club post could lead someone into Sauce’s Find It Again results and then into his business or music sections.", status:"Discovery workspace" },
  "Creator Academy": { intro:"Guidance that helps creators use VYBE effectively without needing to understand every feature on day one.", features:["Short setup and growth lessons","Feature-specific walkthroughs","Release and profile checklists","Membership-aware recommendations"], example:"Sauce’s team could open a short guide on setting up private listening or improving the media kit / EPK before sharing it.", status:"Learning center" },
  "Music Sales": { intro:"Control what music or bundles are offered for direct purchase while keeping streaming destinations connected.", features:["Create purchasable songs and playlists","Set pricing and availability","Track purchases and buyer access","Keep permanent purchased access intact"], example:"A supporter edition could combine selected tracks and creator commentary while the standard catalog still links to Apple Music.", status:"Commerce workspace" },
  "Copyright Center": { intro:"Organize creator rights information and VYBE protection tools in one place.", features:["Fingerprinting and ownership records","DMCA assistance and upload-conflict review","Copyright registration guidance","Priority lists for works the creator wants registered"], example:"Sauce’s team could see which recordings have VYBE fingerprint protection and which songs are waiting for copyright-registration review.", status:"Rights workspace" },
  "Creator Focuses": { intro:"Manage the different creator lanes that make up Sauce’s world without forcing everything into one category.", features:["Music focus","Business and entrepreneurship lanes","Video, media or project focuses","Control which focus appears most prominently"], example:"Music could remain Sauce’s primary focus while business, Only Hands and other projects receive their own organized spaces.", status:"Creator structure" },
  "Creator Settings": { intro:"Control the account, presentation, access rules and creator preferences behind the public experience.", features:["Profile and display preferences","Notifications and communication settings","Membership and access controls","Security, connected services and account preferences"], example:"Sauce’s team could decide who receives alerts, which public modules appear, and how private-access requests are handled.", status:"Account settings" },
};
const hq: Item[] = [
  { title:"Creator Dashboard", icon:LayoutDashboard, href:"/demo/sauce-walka/creator-hq" },
  { title:"Create & Manage", icon:LibraryBig }, { title:"Events & Updates", icon:CalendarDays },
  { title:"Music Library", icon:Music2, href:"/demo/sauce-walka#music" }, { title:"Playlists", icon:ListMusic, href:"/demo/sauce-walka#playlists" },
  { title:"Upload Music", icon:Upload }, { title:"Video Library", icon:Clapperboard, href:"/demo/sauce-walka#video" },
];
const audience: Item[] = [
  { title:"Insights", icon:BarChart3 }, { title:"Connections", icon:ContactRound },
  { title:"Creator Messages", icon:MessageCircle, badge:"3" }, { title:"Social Discovery", icon:Compass },
];const growth: Item[] = [
  { title:"Creator Academy", icon:GraduationCap }, { title:"Public Profile & Discovery", icon:User, href:"/demo/sauce-walka" },
  { title:"Merchandise", icon:ShoppingBag, href:"/demo/sauce-walka#shop" }, { title:"Music Sales", icon:CreditCard },
  { title:"Copyright Center", icon:CreditCard }, { title:"Media Kit / EPK", icon:BriefcaseBusiness, href:"/demo/sauce-walka#epk" },
  { title:"Creator Focuses", icon:Workflow }, { title:"Creator Settings", icon:Settings },
  { title:"Find It Again", icon:Link2, href:"/demo/sauce-walka/social-post-library" },
];

function SidebarGroup({label, items, onDemo}:{label:string;items:Item[];onDemo?:(title:string)=>void}) {
  return <div className="py-2"><p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">{label}</p><div className="space-y-1">{items.map(({title,icon:Icon,href,badge}) => {
    const body = <><Icon className="h-4 w-4 shrink-0"/><span className="truncate">{title}</span>{badge ? <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{badge}</span> : null}</>;
    return href ? <a key={title} href={href} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">{body}</a> : <button key={title} onClick={()=>onDemo?.(title)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground">{body}</button>;
  })}</div></div>;
}

function CreatorDemoPanel({title, panel, onClose}:{title:string;panel:DemoPanel;onClose:()=>void}) {
  return <div className="fixed inset-0 z-[80] flex justify-end bg-black/55 backdrop-blur-[1px]" onMouseDown={onClose}>
    <aside className="h-full w-full overflow-y-auto border-l border-border bg-background shadow-2xl sm:w-[88%] md:w-[58%] lg:w-[44%] xl:w-[38%]" onMouseDown={(e)=>e.stopPropagation()}>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-background/95 px-5 py-5 backdrop-blur sm:px-6"><div><Badge variant="outline" className="mb-3">{panel.status ?? "Creator HQ feature"}</Badge><p className="text-xs font-bold uppercase tracking-[.2em] text-primary">Creator HQ demo</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">{title}</h2></div><button onClick={onClose} aria-label="Close feature panel" className="rounded-full border border-border p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="h-5 w-5"/></button></div>
      <div className="space-y-6 p-5 sm:p-6"><p className="text-base leading-7 text-muted-foreground">{panel.intro}</p><div><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">What can be done here</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{panel.features.map((feature,i)=><div key={feature} className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-black text-primary">0{i+1}</p><p className="mt-2 text-sm font-semibold leading-5">{feature}</p></div>)}</div></div><div className="rounded-3xl border border-fuchsia-400/25 bg-gradient-to-br from-fuchsia-500/10 via-card to-cyan-500/10 p-5"><p className="text-xs font-bold uppercase tracking-[.18em] text-fuchsia-300">Sauce Walka example</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{panel.example}</p></div><div className="rounded-2xl border border-dashed border-border p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demo note</p><p className="mt-2 text-sm leading-6 text-muted-foreground">This panel explains the intended production workspace without pretending the full workflow is already built inside this concept demo.</p></div><Button onClick={onClose} className="w-full rounded-full">Back to Creator HQ</Button></div>
    </aside>
  </div>;
}

function SauceCreatorHQ() {
  const [mobileOpen,setMobileOpen] = useState(false);
  const [searchQuery,setSearchQuery] = useState("");
  const [notice,setNotice] = useState<string | null>(null);
  const [activePanel,setActivePanel] = useState<string | null>(null);
  const demoAction = (title:string) => { if (demoPanels[title]) { setMobileOpen(false); setActivePanel(title); } else setNotice(`${title}: this Creator HQ area is represented in the concept demo.`); };
  return <div className="min-h-screen bg-background text-foreground">
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <aside className={`${mobileOpen?"fixed inset-y-0 left-0 z-50 flex":"hidden"} w-64 shrink-0 flex-col border-r border-border bg-background md:flex`}>
        <div className="flex h-14 items-center gap-3 border-b border-border px-4"><div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-400 font-black">V</div><div><p className="text-sm font-black">VYBE</p><p className="text-[10px] text-muted-foreground">Creator HQ</p></div><button onClick={()=>setMobileOpen(false)} className="ml-auto md:hidden"><X className="h-5 w-5"/></button></div>
        <div className="flex-1 overflow-y-auto px-2 py-2"><SidebarGroup label="Creator HQ" items={hq} onDemo={demoAction}/><SidebarGroup label="Audience" items={audience} onDemo={demoAction}/><SidebarGroup label="Profile & Growth" items={growth} onDemo={demoAction}/><SidebarGroup label="Browse VYBE" items={[{title:"Explore the VYBE app",icon:Compass,href:"/demo/sauce-walka"}]} onDemo={demoAction}/></div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/90 px-3 backdrop-blur-xl">
          <button onClick={()=>setMobileOpen(true)} className="rounded-md p-2 hover:bg-accent md:hidden"><Menu className="h-5 w-5"/></button>
          <form onSubmit={(e)=>{e.preventDefault(); const q=searchQuery.trim(); if(q) window.location.href=`/explore?q=${encodeURIComponent(q)}`;}} className="relative hidden max-w-md flex-1 md:flex md:items-center md:gap-2"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input aria-label="Search VYBE" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Search artists, songs, cities, genres…" className="h-9 w-full rounded-full border border-border/60 bg-muted/40 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"/></div><Button type="submit" size="sm" className="rounded-full px-4">Search</Button></form>
          <div className="ml-auto flex items-center gap-2"><Button asChild size="sm" variant="outline" className="rounded-full"><a href="/demo/sauce-walka"><Eye className="mr-2 h-4 w-4"/>Supporter view</a></Button><Button onClick={()=>setNotice("Notifications: 3 creator updates are waiting in this concept demo.")} size="icon" variant="ghost" className="relative rounded-full" aria-label="Creator notifications"><Bell className="h-4 w-4"/><span className="absolute right-0 top-0 h-4 min-w-4 rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">3</span></Button><img src="/images/demo/sauce-walka/profile.png" alt="Sauce Walka" className="h-8 w-8 rounded-full border border-border object-cover"/></div>
        </header>
        <div className="border-b border-amber-400/20 bg-amber-400/10 px-4 py-2 text-center text-xs text-amber-100"><strong>Creator HQ concept:</strong> mirrors VYBE’s actual creator workspace structure and is populated with Sauce demo content.</div>

        <main className="flex-1 px-4 pb-24 pt-5 sm:px-5 md:px-8 md:py-8 lg:px-10">
          <div className="mx-auto max-w-7xl space-y-6">
            <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Creator HQ</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">Sauce Walka Studio</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">See what needs attention, create quickly, and follow supporter activity across the creator account.</p></div><div className="flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><a href="/demo/sauce-walka">View public page</a></Button><Button asChild size="sm"><a href="/demo/sauce-walka/social-post-library">Manage Find It Again</a></Button></div></section>

            <section className="overflow-hidden rounded-3xl border border-border bg-card"><div className="grid gap-0 lg:grid-cols-[240px_1fr]"><div className="relative min-h-52"><img src="/images/demo/sauce-walka/profile.png" alt="" className="absolute inset-0 h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/><div className="absolute bottom-4 left-4"><Badge>Creator Studio • Preview</Badge><p className="mt-2 text-xl font-black text-white">SAUCE WALKA</p></div></div><div className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">Your public VYBE</p><h2 className="mt-2 text-2xl font-black">Everything supporters need, managed from here.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Music, playlists, video, Find It Again, business, EPK, private access and opportunity settings all connect back to the supporter-facing account.</p><div className="mt-5 flex flex-wrap gap-2"><Badge variant="outline">6 releases</Badge><Badge variant="outline">6 playlists</Badge><Badge variant="outline">1 native video</Badge><Badge variant="outline">3 saved social moments</Badge><Badge variant="outline">EPK ready</Badge></div></div></div></section>

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[ [Eye,"128","Profile opens"],[Music2,"846","Track plays"],[UsersRound,"39","New connections"],[Activity,"3","Find It Again posts"] ].map(([Icon,value,label]:any)=><div key={label} className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4"/><span className="text-xs">{label}</span></div><p className="mt-3 text-2xl font-black">{value}</p></div>)}
            </section>
            <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">Quick create</h2></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <a href="/demo/sauce-walka#music" className="rounded-2xl border border-border bg-card p-4 hover:border-primary/50"><Music2 className="h-5 w-5 text-primary"/><p className="mt-3 font-semibold">Upload music</p><p className="mt-1 text-xs text-muted-foreground">Add or manage a release</p></a>
              <a href="/demo/sauce-walka#playlists" className="rounded-2xl border border-border bg-card p-4 hover:border-primary/50"><ListMusic className="h-5 w-5 text-primary"/><p className="mt-3 font-semibold">Create playlist</p><p className="mt-1 text-xs text-muted-foreground">Public, supporter or private</p></a>
              <a href="/demo/sauce-walka/social-post-library" className="rounded-2xl border border-border bg-card p-4 hover:border-primary/50"><Link2 className="h-5 w-5 text-primary"/><p className="mt-3 font-semibold">Add social post</p><p className="mt-1 text-xs text-muted-foreground">Save to Find It Again</p></a>
              <a href="/demo/sauce-walka#shop" className="rounded-2xl border border-border bg-card p-4 hover:border-primary/50"><ShoppingBag className="h-5 w-5 text-primary"/><p className="mt-3 font-semibold">Update merch</p><p className="mt-1 text-xs text-muted-foreground">Route to existing stores</p></a>
            </div></section>

            <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-3xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-4"><h2 className="font-semibold">Recent activity</h2><button onClick={()=>setNotice("Recent activity: the full activity feed would open here in the production Creator HQ.")} className="text-xs text-primary">View all</button></div><div className="divide-y divide-border">{[
              ["Find It Again search","Supporters searched ‘THC store’ and opened saved results","Today"],
              ["Track play","Thuggin' received a full-listen start","Today"],
              ["Playlist opened","THE SAUCE STARTER PACK","Yesterday"],
              ["Connection","New supporter connection","Yesterday"],
            ].map(([t,d,m])=><div key={`${t}-${d}`} className="flex items-start justify-between gap-4 p-4"><div><p className="text-sm font-semibold">{t}</p><p className="mt-1 text-xs text-muted-foreground">{d}</p></div><span className="shrink-0 text-[11px] text-muted-foreground">{m}</span></div>)}</div></div>
              <div className="space-y-4"><div className="rounded-3xl border border-border bg-card p-5"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Needs attention</p><h3 className="mt-2 text-lg font-semibold">3 items</h3><div className="mt-4 space-y-3 text-sm"><a href="/demo/sauce-walka/social-post-library" className="block rounded-xl border border-border p-3 hover:border-primary/50">Review saved social posts</a><a href="/demo/sauce-walka#epk" className="block rounded-xl border border-border p-3 hover:border-primary/50">Review Media Kit / EPK / press pack</a><a href="/demo/sauce-walka#private" className="block rounded-xl border border-border p-3 hover:border-primary/50">Review private access</a></div></div><div className="rounded-3xl border border-border bg-card p-5"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Top shared experience</p><h3 className="mt-2 text-lg font-semibold">THE SAUCE STARTER PACK</h3><p className="mt-1 text-sm text-muted-foreground">Most active demo playlist</p><Button asChild variant="outline" size="sm" className="mt-4"><a href="/demo/sauce-walka#playlists">Manage playlists</a></Button></div></div>
            </section>
          </div>
        </main>
      </div>
    </div>
    {activePanel && demoPanels[activePanel] && <CreatorDemoPanel title={activePanel} panel={demoPanels[activePanel]} onClose={()=>setActivePanel(null)}/>}
    {notice && <div className="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-xl rounded-2xl border border-primary/40 bg-background/95 p-4 shadow-2xl backdrop-blur sm:left-auto sm:right-6 sm:w-[28rem]"><div className="flex items-start gap-3"><p className="flex-1 text-sm leading-6">{notice}</p><button onClick={()=>setNotice(null)} aria-label="Close Creator HQ message" className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4"/></button></div></div>}
  </div>;
}
