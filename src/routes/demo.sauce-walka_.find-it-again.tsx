import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, Instagram, ArrowUpRight, Tag, X } from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo/sauce-walka_/find-it-again")({
  head: () => ({ meta: [{ title: "Sauce Walka — Find It Again" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: SauceFindItAgain,
});

const posts = [
  { label: "THC Club — South Florida creator invite", href: "https://www.instagram.com/reel/DdQChtBNFRp/?stkn=ZXo3Z2JhYXdmOXAx", note: "Sept. 14, 2026 • Hollywood / Miami area", description: "Sauce promotes his THC Club store in South Florida and invites creators to use the facility for entertainment needs, drops, releases and other creative activity. He also calls for local graphic designers, photographers, painters and mural artists.", tags: ["Instagram", "THC Club", "Store", "South Florida", "Creator opportunity", "Business"] },
  { label: "THC Club — Houston creator invite", href: "https://www.instagram.com/reel/DY7_UuhpotV/?stkn=MXN4eDJrNTV4OHIxOA==", note: "May 29, 2026 • Houston", description: "Sauce highlights the THC Club store on Broadway in Houston and uses the post to connect the store with his creator and business world.", tags: ["Instagram", "THC Club", "Store", "Houston", "Creator opportunity", "Business"] },
  { label: "THC Club — state-to-state store update", href: "https://www.instagram.com/reel/DcCoLIAtdkp/?stkn=cXJ2cmNreTZ5djh4", note: "Aug. 14 • Instagram capture", description: "Sauce gives a live update after getting questions about his stores, highlighting the THC Club business presence from state to state.", tags: ["Instagram", "THC Club", "Store", "Store update", "Business", "State to state"] },
];

function SauceFindItAgain() {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const filters = ["All","Instagram","THC Club","Houston","South Florida","Creator opportunity","Business"];
  const results = useMemo(() => {
    if (!query.trim() && filter === "All") return [];
    return posts.filter((p) => {
      const haystack = `${p.label} ${p.note} ${p.description} ${p.tags.join(" ")}`.toLowerCase();
      const matchesQuery = !query.trim() || query.toLowerCase().split(/\s+/).every((term) => haystack.includes(term));
      const matchesFilter = filter === "All" || p.tags.includes(filter) || p.note.includes(filter);
      return matchesQuery && matchesFilter;
    });
  }, [query, filter]);
  return <div className="min-h-screen bg-background"><MarketingNav />
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <img src="/images/demo/sauce-walka/banner.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14"><a href="/demo/sauce-walka" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to Sauce Walka</a><p className="mt-7 text-xs font-bold uppercase tracking-[.22em] text-fuchsia-300">Sauce Walka • Find It Again</p><h1 className="mt-2 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">The posts worth remembering, organized around Sauce.</h1><p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">This is not another feed. It is Sauce’s creator-selected archive of moments supporters may want to find again, with every result pointing back to the original source.</p></div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-3xl border border-fuchsia-400/25 bg-gradient-to-br from-fuchsia-500/10 via-card to-cyan-500/10 p-5 sm:p-6">
          <div className="flex items-center gap-3"><Search className="h-6 w-6 text-cyan-300" /><h2 className="text-xl font-black">Search Sauce’s memory</h2></div>
          <form onSubmit={(e)=>{e.preventDefault();setQuery(queryInput);}} className="mt-5 flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="Search Sauce memory" value={queryInput} onChange={(e) => setQueryInput(e.target.value)} placeholder="Try: Houston, THC Club, mural artist, photographer..." className="w-full rounded-2xl border border-border bg-background py-3 pl-11 pr-11 text-sm outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 sm:text-base" />{queryInput && <button type="button" aria-label="Clear search" onClick={() => { setQueryInput(""); setQuery(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground hover:bg-card hover:text-foreground"><X className="h-4 w-4" /></button>}</div><Button type="submit" className="rounded-2xl px-6">Search</Button></form>
          <div className="mt-4 flex flex-wrap gap-2">{filters.map((x) => <button key={x} onClick={() => setFilter(x)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filter === x ? "border-fuchsia-400 bg-fuchsia-500/15 text-fuchsia-200" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>{x}</button>)}</div>
          <div className="mt-4 flex flex-wrap items-center gap-3"><Button onClick={() => { setQueryInput("THC store"); setQuery("THC store"); setFilter("All"); }} variant="outline" className="rounded-full">Try demo search: THC store</Button><p className="text-xs text-muted-foreground">{query.trim() || filter !== "All" ? `Showing ${results.length} matching saved moments.` : "Search first — saved links are not displayed by default."}</p></div>
        </div>

        {!query.trim() && filter === "All" ? <div className="mt-8 rounded-3xl border border-dashed border-border bg-card/30 p-8 text-center"><Search className="mx-auto h-8 w-8 text-cyan-300" /><h3 className="mt-4 text-xl font-black">Search to reveal Sauce’s saved moments.</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Supporters are not shown every saved link. Search a memory such as “THC store,” “Houston,” or “mural artist,” and only matching creator-approved results appear.</p><Button onClick={() => { setQueryInput("THC store"); setQuery("THC store"); }} className="mt-5 rounded-full">Show THC store example</Button></div> : results.length > 0 ? <div className="mt-8 grid gap-5 md:grid-cols-2">{results.map(p => <article key={p.href} className="rounded-3xl border border-border bg-card p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-fuchsia-500/15"><Instagram className="h-5 w-5 text-fuchsia-300" /></div><Badge variant="outline">Original stays on Instagram</Badge></div><h3 className="mt-5 text-2xl font-black">{p.label}</h3><p className="mt-2 text-sm text-muted-foreground">{p.note}</p><div className="mt-4 flex flex-wrap gap-2">{p.tags.map(t => <Badge key={t} variant="outline"><Tag className="mr-1 h-3 w-3" />{t}</Badge>)}</div><p className="mt-5 text-sm leading-6 text-muted-foreground">{p.description}</p><p className="mt-4 text-xs leading-5 text-muted-foreground">This VYBE entry keeps the original Instagram post as the source while making the moment easier to search by location, business, creator opportunity and creative discipline.</p><Button asChild className="mt-6 w-full rounded-full"><a href={p.href} target="_blank" rel="noreferrer">View original Instagram post <ArrowUpRight className="ml-2 h-4 w-4" /></a></Button></article>)}</div> : <div className="mt-8 rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center"><Search className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-4 text-xl font-black">No saved moment matches that yet.</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Try another memory, location, business name or creative need.</p><Button onClick={() => { setQueryInput(""); setQuery(""); setFilter("All"); }} variant="outline" className="mt-5 rounded-full">Clear search</Button></div>}

        <div className="mt-8 rounded-3xl border border-border bg-background p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-black">How this got here</h2><p className="mt-2 text-sm text-muted-foreground">See the same feature from the creator side.</p></div><Button asChild className="rounded-full"><a href="/demo/sauce-walka/social-post-library">Try creator capture demo</a></Button></div><div className="mt-5 grid gap-3 sm:grid-cols-4">{["Captured","Draft","Creator review","Published"].map((x,i) => <div key={x} className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-bold text-fuchsia-300">0{i+1}</p><p className="mt-2 font-semibold">{x}</p></div>)}</div><p className="mt-5 text-sm leading-6 text-muted-foreground">Nothing has to appear publicly until the creator chooses it. That keeps Find It Again curated instead of becoming an automatic copy of every social post.</p></div>
        <div className="mt-8 text-center"><Button asChild variant="outline" className="rounded-full"><a href="/demo/find-it-again">Browse Find It Again across creators</a></Button></div>
      </section>
    </main><Footer /></div>;
}
