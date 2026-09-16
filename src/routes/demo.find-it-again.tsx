import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Sparkles, ArrowUpRight, Instagram, Youtube, X } from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo/find-it-again")({
  head: () => ({ meta: [{ title: "Find It Again — VYBE Concept" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: FindItAgainDemo,
});

type Memory = { creator:string; handle:string; title:string; date:string; platform:string; description:string; tags:string[]; href:string; sauce?:boolean; accent:string };
const memories: Memory[] = [
  { creator:"Sauce Walka", handle:"@saucewalka", title:"THC Club — South Florida creator invite", date:"Sept. 14, 2026", platform:"Instagram", description:"South Florida THC Club update inviting creators to use the facility for drops, releases and entertainment needs, plus a call for graphic designers, photographers, painters and mural artists.", tags:["South Florida","Miami","Hollywood","THC Club","mural artist","photographer","graphic designer","creator opportunity","business","store"], href:"https://www.instagram.com/reel/DdQChtBNFRp/?stkn=ZXo3Z2JhYXdmOXAx", sauce:true, accent:"from-fuchsia-500/25 to-amber-400/10" },
  { creator:"Sauce Walka", handle:"@saucewalka", title:"THC Club — Houston creator invite", date:"May 29, 2026", platform:"Instagram", description:"Houston Broadway THC Club post connecting the store to Sauce's creator and business world.", tags:["Houston","Broadway","THC Club","creator opportunity","business","store"], href:"https://www.instagram.com/reel/DY7_UuhpotV/?stkn=MXN4eDJrNTV4OHIxOA==", sauce:true, accent:"from-cyan-500/20 to-fuchsia-500/10" },
  { creator:"Sauce Walka", handle:"@saucewalka", title:"THC Club — state-to-state store update", date:"Aug. 14", platform:"Instagram", description:"A live store update responding to questions about Sauce's THC stores and highlighting the state-to-state business presence.", tags:["THC Club","store update","business","state to state","Houston","retail"], href:"https://www.instagram.com/reel/DcCoLIAtdkp/?stkn=cXJ2cmNreTZ5djh4", sauce:true, accent:"from-emerald-500/20 to-fuchsia-500/10" },
  { creator:"Nova Rey", handle:"@novarey", title:"Red jacket rooftop performance", date:"Aug. 21, 2026", platform:"Instagram", description:"A sunset rooftop performance supporters kept asking about after seeing the red jacket clip.", tags:["red jacket","performance","rooftop","live music","sunset"], href:"#", accent:"from-red-500/20 to-orange-400/10" },
  { creator:"KJ Frame", handle:"@kjframe", title:"Behind the scenes — downtown film set", date:"July 9, 2026", platform:"YouTube", description:"Behind-the-scenes footage from a downtown night shoot with the cast and camera team.", tags:["film set","behind the scenes","downtown","camera","cast"], href:"#", accent:"from-indigo-500/20 to-cyan-400/10" },
  { creator:"Maya Verse", handle:"@mayaverse", title:"New poetry collection announcement", date:"June 18, 2026", platform:"Instagram", description:"The announcement supporters remember as the bookstore post with the yellow notebook.", tags:["poetry","bookstore","yellow notebook","book release","announcement"], href:"#", accent:"from-yellow-400/15 to-fuchsia-500/10" },
  { creator:"The Jettsons", handle:"@thejettsons", title:"Houston pop-up + merch drop", date:"May 31, 2026", platform:"Instagram", description:"Houston pop-up announcement with limited merch and an in-store meet-up.", tags:["Houston","pop up","merch","store","meet up"], href:"#", accent:"from-violet-500/20 to-cyan-500/10" },
];
const creatorFilters = ["All creators","Sauce Walka","Nova Rey","KJ Frame","Maya Verse","The Jettsons"];
const memoryPrompts = ["Houston store","mural artist","red jacket performance","yellow notebook","film set","merch pop-up"];

function FindItAgainDemo() {
  const initialQuery = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") ?? "" : "";
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [creator, setCreator] = useState("All creators");
  const normalized = query.trim().toLowerCase();
  const exactResults = useMemo(() => memories.filter((m) => {
    const haystack = `${m.creator} ${m.handle} ${m.title} ${m.date} ${m.platform} ${m.description} ${m.tags.join(" ")}`.toLowerCase();
    const matchesCreator = creator === "All creators" || m.creator === creator;
    const matchesQuery = !normalized || normalized.split(/\s+/).every((term) => haystack.includes(term));
    return matchesCreator && matchesQuery;
  }), [normalized, creator]);
  const results = useMemo(() => {
    if (exactResults.length || !normalized) return exactResults;
    const creatorPool = creator === "All creators" ? memories : memories.filter(m => m.creator === creator);
    const fallback = creatorPool.slice(0, 3);
    const sauce = memories.find(m => m.sauce && !fallback.includes(m));
    return sauce && creator === "All creators" ? [...fallback, sauce] : fallback;
  }, [exactResults, normalized, creator]);
  const isSuggested = normalized && exactResults.length === 0;

  return <div className="min-h-screen bg-background"><MarketingNav />
    <main>
      <section className="border-b border-border bg-gradient-to-br from-fuchsia-500/10 via-background to-cyan-500/10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16"><Badge className="mb-4">Supporter view • Find It Again</Badge><h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Tell VYBE what you remember.</h1><p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">You do not need the creator, date, caption or even the app. Search the detail you remember and VYBE surfaces creator-selected possibilities that can take you back to the original post.</p></div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-3xl border border-fuchsia-400/25 bg-card p-5 shadow-sm sm:p-6"><form onSubmit={(e) => { e.preventDefault(); setQuery(queryInput); }} className="flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-300" /><input aria-label="Find It Again search" value={queryInput} onChange={e => setQueryInput(e.target.value)} placeholder="Try: that Houston store post, mural artist, red jacket performance..." className="w-full rounded-2xl border border-border bg-background py-4 pl-12 pr-12 text-sm outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/20 sm:text-base" />{queryInput && <button type="button" aria-label="Clear search" onClick={() => { setQueryInput(""); setQuery(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground hover:bg-card hover:text-foreground"><X className="h-4 w-4" /></button>}</div><Button type="submit" className="h-auto rounded-2xl px-6 py-4 font-bold sm:self-stretch"><Search className="mr-2 h-4 w-4" />Search</Button></form>
        <div className="mt-4 flex flex-wrap gap-2">{memoryPrompts.map(p => <button key={p} onClick={() => { setQueryInput(p); setQuery(p); }} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-fuchsia-400/60 hover:text-foreground">{p}</button>)}</div>
        <div className="mt-5 border-t border-border pt-5"><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-muted-foreground">Narrow by creator</p><div className="flex flex-wrap gap-2">{creatorFilters.map(c => <button key={c} onClick={() => setCreator(c)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${creator===c ? "border-cyan-400 bg-cyan-500/10 text-cyan-200" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>{c}</button>)}</div></div></div>
        <div className="mt-7 flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-fuchsia-300">{creator === "All creators" ? "Possible matches" : `${creator} matches`}</p><h2 className="mt-1 text-2xl font-black">{isSuggested ? "Nothing exact — here are likely places to look" : `${results.length} memory ${results.length === 1 ? "match" : "matches"}`}</h2></div>{creator === "Sauce Walka" && <Button asChild variant="outline" className="hidden rounded-full sm:inline-flex"><a href="/demo/sauce-walka/find-it-again">Open Sauce's full archive</a></Button>}</div>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{results.map((m) => <article key={`${m.creator}-${m.title}`} className="overflow-hidden rounded-3xl border border-border bg-card"><div className={`h-24 bg-gradient-to-br ${m.accent} p-5`}><div className="flex items-center justify-between"><Badge variant="outline" className="bg-background/70">{m.platform}</Badge>{m.sauce && <Badge className="bg-fuchsia-500/80">Sauce Walka</Badge>}</div></div><div className="p-5"><p className="text-xs font-semibold text-muted-foreground">{m.creator} • {m.date}</p><h3 className="mt-2 text-xl font-black">{m.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{m.description}</p><div className="mt-4 flex flex-wrap gap-2">{m.tags.slice(0,4).map(t => <Badge key={t} variant="outline">{t}</Badge>)}</div>{m.sauce ? <Button asChild className="mt-5 w-full rounded-full"><a href={m.href} target="_blank" rel="noreferrer">View original post <ArrowUpRight className="ml-2 h-4 w-4" /></a></Button> : <Button onClick={() => setQuery(m.tags[0])} variant="outline" className="mt-5 w-full rounded-full">See related memories</Button>}</div></article>)}</div>
        {creator === "Sauce Walka" && <div className="mt-6 text-center sm:hidden"><Button asChild variant="outline" className="rounded-full"><a href="/demo/sauce-walka/find-it-again">Open Sauce's full archive</a></Button></div>}

        <div className="mt-10 rounded-3xl border border-border bg-background p-5 sm:p-6"><div className="flex items-center gap-3"><Sparkles className="h-6 w-6 text-fuchsia-300" /><h2 className="text-xl font-black">How supporter search feels</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-bold text-fuchsia-300">01</p><p className="mt-2 font-semibold">Remember a detail</p><p className="mt-1 text-sm text-muted-foreground">A place, outfit, business, phrase, event or visual clue.</p></div><div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-bold text-fuchsia-300">02</p><p className="mt-2 font-semibold">See likely matches</p><p className="mt-1 text-sm text-muted-foreground">Across creators, or narrowed to one creator you follow.</p></div><div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-bold text-fuchsia-300">03</p><p className="mt-2 font-semibold">Return to the source</p><p className="mt-1 text-sm text-muted-foreground">VYBE points you back to the original creator post.</p></div></div></div>
      </section>
    </main><Footer /></div>;
}
