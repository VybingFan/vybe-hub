import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BarChart3, BriefcaseBusiness, CheckCircle2, ChevronRight, Compass, FileText,
  Handshake, Inbox, MapPin, MessageSquare, Plus, Search, Settings, ShieldCheck,
  Sparkles, Star, Users, UsersRound, X,
} from "lucide-react";

export const Route = createFileRoute("/demo/sauce-walka_/founding-partner")({
  component: FoundingPartnerDemo,
});

type Creator = {
  id: string; name: string; focus: string; location: string; openTo: string[]; verified?: boolean;
};

type Opportunity = {
  title: string; type: string; location: string; compensation: string; status: string; invited: number; interested: number;
};

const creators: Creator[] = [
  { id: "nova", name: "Nova", focus: "Music • R&B / Soul", location: "Houston, TX", openTo: ["Collaborations", "Live events", "Media"], verified: true },
  { id: "jerzo", name: "Jerzo", focus: "Music • Hip-Hop", location: "Houston, TX", openTo: ["Features", "Shows", "Brand work"] },
  { id: "mane", name: "SoundWavemane", focus: "Music • Artist / Producer", location: "Houston, TX", openTo: ["Production", "Collaborations", "Private listening"], verified: true },
];

const seedOpportunities: Opportunity[] = [
  { title: "Houston Creator Spotlight", type: "Showcase / Media", location: "Houston, TX", compensation: "To be determined", status: "Concept draft", invited: 0, interested: 0 },
  { title: "Studio Collaboration Session", type: "Collaboration", location: "Houston, TX", compensation: "Negotiable", status: "Concept draft", invited: 0, interested: 0 },
];
const nav = [
  ["Overview", BriefcaseBusiness], ["Discover Talent", Search], ["Saved Creators", Star],
  ["Opportunities", Handshake], ["Invitations", Inbox], ["Messages", MessageSquare],
  ["Partner Profile", FileText], ["Team", UsersRound], ["Analytics", BarChart3], ["Settings", Settings],
] as const;

function FoundingPartnerDemo() {
  const [section, setSection] = useState("Overview");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>(["nova"]);
  const [opportunities, setOpportunities] = useState(seedOpportunities);
  const [notice, setNotice] = useState("");

  const filteredCreators = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return creators;
    return creators.filter((creator) =>
      [creator.name, creator.focus, creator.location, ...creator.openTo].join(" ").toLowerCase().includes(q),
    );
  }, [query]);

  function toggleSaved(id: string) {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function addConceptOpportunity() {
    setOpportunities((current) => [{
      title: "New Founding Partner Opportunity",
      type: "Creator opportunity", location: "Flexible", compensation: "To be determined",
      status: "Concept draft", invited: 0, interested: 0,
    }, ...current]);
    setNotice("Concept opportunity created. In production, the partner would complete details before inviting creators.");
  }
  return (
    <div className="min-h-screen bg-[#09070F] text-white">
      <header className="border-b border-white/10 bg-black/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
          <Link to="/demo/sauce-walka" className="text-sm font-semibold text-violet-300 hover:text-white">← Sauce Walka demo</Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">FOUNDING PARTNER CONCEPT</span>
            <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs text-violet-200">Not an official Sauce Walka account</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-5 rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-400/10 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20"><Handshake className="h-6 w-6 text-violet-200" /></div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[.18em] text-violet-300">Partner Studio</p>
            <h1 className="mt-1 text-xl font-bold">Sauce Walka</h1>
            <p className="mt-1 text-sm text-white/60">Founding Partner concept workspace</p>
          </div>
          <nav className="space-y-1">
            {nav.map(([label, Icon]) => (
              <button key={label} onClick={() => setSection(label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${section === label ? "bg-violet-500/20 text-violet-100" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
                <Icon className="h-4 w-4" /><span>{label}</span>{section === label ? <ChevronRight className="ml-auto h-4 w-4" /> : null}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/60 via-[#151020] to-[#0c1519] p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">Founding Partner Studio • Concept Demo</p>
                <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{section}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">A professional workspace for trusted people and organizations that can discover creators and create real opportunities while creators stay in control of what they share.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />Verified Partner</span>
                <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1.5 text-xs text-violet-200"><Sparkles className="mr-1 inline h-3.5 w-3.5" />Founding Partner</span>
              </div>
            </div>
          </section>

          {notice ? <div className="mt-4 flex items-start gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{notice}</span><button onClick={() => setNotice("")} className="ml-auto"><X className="h-4 w-4" /></button></div> : null}
          {section === "Overview" ? <Overview saved={saved.length} opportunities={opportunities.length} /> : null}
          {section === "Discover Talent" ? <Discover creators={filteredCreators} query={query} setQuery={setQuery} saved={saved} toggleSaved={toggleSaved} /> : null}
          {section === "Saved Creators" ? <Saved saved={saved} toggleSaved={toggleSaved} /> : null}
          {section === "Opportunities" ? <Opportunities rows={opportunities} onAdd={addConceptOpportunity} /> : null}
          {!["Overview","Discover Talent","Saved Creators","Opportunities"].includes(section) ? <Coming section={section} /> : null}
        </main>
      </div>
    </div>
  );
}

function Overview({ saved, opportunities }: { saved: number; opportunities: number }) {
  const cards = [
    ["Saved creators", String(saved), Star], ["Concept opportunities", String(opportunities), Handshake],
    ["Invitations", "0", Inbox], ["Creator responses", "0", MessageSquare],
  ] as const;
  return <div className="mt-5 space-y-5">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label,value,Icon]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><Icon className="h-5 w-5 text-violet-300"/><p className="mt-4 text-3xl font-bold">{value}</p><p className="mt-1 text-sm text-white/55">{label}</p></div>)}</div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="What a Founding Partner can do" icon={Compass} items={["Discover creators who opt into professional opportunities","Review creator-selected professional profiles and Media Kits / EPKs","Save talent into private lists and shortlists","Create clear, structured opportunities","Invite selected creators and track responses"]}/>
      <Panel title="Creator protections built in" icon={ShieldCheck} items={["Partner verification before broad outreach","Creator-controlled professional visibility","Clear compensation and opportunity details","Block/report controls and anti-spam limits","No private creator data exposed automatically"]}/>
    </div>
  </div>;
}

function Panel({ title, icon: Icon, items }: { title: string; icon: any; items: string[] }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><h3 className="flex items-center gap-2 font-semibold"><Icon className="h-5 w-5 text-cyan-300"/>{title}</h3><ul className="mt-4 space-y-3 text-sm text-white/65">{items.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300"/>{item}</li>)}</ul></div>;
}
function Discover({ creators: rows, query, setQuery, saved, toggleSaved }: { creators: Creator[]; query: string; setQuery: (value:string)=>void; saved:string[]; toggleSaved:(id:string)=>void }) {
  return <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">Professional discovery</p><h3 className="mt-1 text-2xl font-bold">Find creators who are open to opportunities</h3></div>
      <label className="relative block w-full max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-white/40"/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search name, location, skill, opportunity..." className="h-10 w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-3 text-sm outline-none focus:border-violet-400/50"/></label>
    </div>
    <div className="mt-5 grid gap-4 xl:grid-cols-3">{rows.map((creator) => <article key={creator.id} className="rounded-2xl border border-white/10 bg-black/20 p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h4 className="font-bold">{creator.name}</h4>{creator.verified ? <ShieldCheck className="h-4 w-4 text-cyan-300"/> : null}</div><p className="mt-1 text-sm text-white/60">{creator.focus}</p></div><button onClick={()=>toggleSaved(creator.id)} aria-label={`${saved.includes(creator.id)?"Remove":"Save"} ${creator.name}`} className="rounded-full border border-white/10 p-2"><Star className={`h-4 w-4 ${saved.includes(creator.id)?"fill-violet-300 text-violet-300":"text-white/50"}`}/></button></div><p className="mt-4 flex items-center gap-1 text-xs text-white/55"><MapPin className="h-3.5 w-3.5"/>{creator.location}</p><div className="mt-4 flex flex-wrap gap-2">{creator.openTo.map((item)=><span key={item} className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs text-violet-200">{item}</span>)}</div><button className="mt-5 w-full rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100">View professional profile</button></article>)}</div>
    {!rows.length ? <p className="mt-6 text-center text-sm text-white/50">No creators match that search.</p> : null}
  </section>;
}

function Saved({ saved, toggleSaved }: { saved:string[]; toggleSaved:(id:string)=>void }) {
  const rows = creators.filter((creator)=>saved.includes(creator.id));
  return <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">Private talent lists</p><h3 className="mt-1 text-2xl font-bold">Saved Creators</h3><p className="mt-2 text-sm text-white/60">Partners can organize talent privately before deciding whether to contact or invite anyone.</p><div className="mt-5 space-y-3">{rows.map((creator)=><div key={creator.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><div className="min-w-0 flex-1"><p className="font-semibold">{creator.name}</p><p className="text-sm text-white/55">{creator.focus} • {creator.location}</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">Houston prospects</span><button onClick={()=>toggleSaved(creator.id)} className="text-xs font-semibold text-rose-200">Remove</button></div>)}{!rows.length?<p className="text-sm text-white/50">No saved creators yet.</p>:null}</div></section>;
}
function Opportunities({ rows, onAdd }: { rows:Opportunity[]; onAdd:()=>void }) {
  return <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">Opportunity Builder</p><h3 className="mt-1 text-2xl font-bold">Create clear opportunities</h3><p className="mt-2 max-w-2xl text-sm text-white/60">Every opportunity should explain what it is, who it is for, location, requirements, deadline and compensation status before creators are invited.</p></div><button onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold"><Plus className="h-4 w-4"/>New concept opportunity</button></div><div className="mt-5 space-y-3">{rows.map((row,index)=><article key={`${row.title}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h4 className="font-bold">{row.title}</h4><span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs text-amber-200">{row.status}</span></div><p className="mt-2 text-sm text-white/55">{row.type} • {row.location}</p></div><button className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/70">Edit draft</button></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Stat label="Compensation" value={row.compensation}/><Stat label="Invited" value={String(row.invited)}/><Stat label="Interested" value={String(row.interested)}/></div><p className="mt-4 text-xs text-white/40">Concept only — this is not an actual Sauce Walka opportunity.</p></article>)}</div></section>;
}

function Stat({ label, value }: { label:string; value:string }) { return <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="text-xs text-white/45">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>; }

function Coming({ section }: { section:string }) {
  const details: Record<string,string[]> = {
    Invitations:["Track who was invited, viewed, interested, submitted, shortlisted, selected or declined.","Send private invitations without exposing creator contact information."],
    Messages:["Keep professional conversations tied to a creator or opportunity.","Separate partner communication from ordinary supporter messages."],
    "Partner Profile":["Show verified identity, organization, markets and opportunity interests.","Control which partner details are public to creators."],
    Team:["Add authorized managers, staff or collaborators.","Give team members role-based permissions without sharing passwords."],
    Analytics:["Measure opportunity views, invites, responses, shortlists and completed collaborations.","See which creator categories and markets generate meaningful engagement."],
    Settings:["Manage privacy, notifications, security and opportunity preferences.","Control who on the team can discover, invite, message or publish."],
  };
  return <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6"><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">Partner Studio tool</p><h3 className="mt-1 text-2xl font-bold">{section}</h3><p className="mt-3 text-sm text-white/60">This screen is represented as a concept in the first Founding Partner demo. Its production workflow will be finalized after Founding Creator and Founding Partner feedback.</p><ul className="mt-5 space-y-3">{(details[section]??[]).map((item)=><li key={item} className="flex gap-2 text-sm text-white/70"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300"/>{item}</li>)}</ul></section>;
}
