import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUpRight, BriefcaseBusiness, Building2, Eye, FileText, Globe2, Headphones,
  LockKeyhole, MapPin, Music2, Play, Search, Share2, ShoppingBag, Sparkles, Users, X,
} from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo/sauce-walka")({
  head: () => ({ meta: [
    { title: "Sauce Walka VYBE Concept Preview" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: SauceWalkaDemo,
});

type ArtKey = "starter" | "houston" | "drip" | "dayones" | "inner" | "lab" |
  "thuggin" | "program" | "kickn" | "brandy-lil-brother" | "block-party" | "baby-mama-drama" |
  "moves" | "business" | "opento";
const artPosition: Record<ArtKey, [number, number]> = {
  starter:[0,0], houston:[1,0], drip:[2,0], dayones:[3,0],
  inner:[0,1], lab:[1,1], thuggin:[2,1], program:[3,1],
  kickn:[0,2], "brandy-lil-brother":[1,2], "block-party":[2,2], "baby-mama-drama":[3,2],
  moves:[0,3], business:[1,3], opento:[2,3],
};
function Art({ art, className = "" }: { art: ArtKey; className?: string }) {
  return <img src={`/images/demo/sauce-walka/${art}.png`} alt="" aria-hidden className={`object-cover ${className}`} />;
}

const playlists: Array<[string,string,string,string,ArtKey]> = [
  ["THE SAUCE STARTER PACK","Public","New to the Sauce? Start here.","Ghetto Gospel • Playin with Fire • I Like Dat • Made It Home","starter"],
  ["HOUSTON GOT SAUCE","Public","Houston raised it. Sauce made it move.","Ghetto Gospel • Family • Bottom 2 Top • May 5th 2010","houston"],
  ["DRIP SERMONS","Supporters","Survival, hustle, family, growth and perspective.","Ghetto Gospel • Made It Home • Family • Bottom 2 Top","drip"],
  ["SAUCE FAM — DAY ONES","Supporters","Deeper cuts for the people who came past the singles.","Unfair • Family • Want It All • Made It Home","dayones"],
  ["THE INNER SAUCE","Approved","A smaller room for selected supporters.","Early listens • alternates • creator messages","inner"],
  ["THE SAUCE LAB","Private","Not released. Not permanent. Just testing the recipe.","Password • expiring link • feedback enabled","lab"],
];
const releases: Array<[string,string,string,ArtKey?]> = [
  ["Thuggin'","2026","Current release","thuggin"],
  ["Program","2026","Current release","program"],
  ["Kickn Flava","2026","Single","kickn"],
  ["Brandy Lil Brother","2026","Single","brandy-lil-brother"],
  ["Block Party","2026","Single","block-party"],
  ["Baby Mama Drama","2026","Single","baby-mama-drama"],
];
const navigation = [
  ["Home","top"],["Music","music"],["Playlists","playlists"],["Video","video"],
  ["Find It Again","find-it-again"],["Sauce Moves","moves"],["Business","business"],
  ["Media Kit / EPK","epk"],["Shop","shop"],["Private VYBEs","private"],["Open To","professional"],
];
function SectionTitle({ eyebrow, title, copy }: { eyebrow:string; title:string; copy:string }) {
  return <div className="mb-6 max-w-3xl sm:mb-7">
    <p className="text-[11px] font-bold uppercase tracking-[.22em] text-fuchsia-300 sm:text-xs">{eyebrow}</p>
    <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{title}</h2>
    <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">{copy}</p>
  </div>;
}
function SauceWalkaDemo() {
  const [note, setNote] = useState<string | null>(null);
  const demo = (message:string) => setNote(message);
  return <div id="top" className="min-h-screen overflow-x-hidden bg-background">
    <MarketingNav />
    <div className="border-b border-amber-400/20 bg-amber-400/10">
      <div className="mx-auto max-w-7xl px-4 py-2.5 text-center text-xs leading-5 text-amber-100 sm:px-6 sm:text-sm">
        <strong>Concept preview:</strong> built from public information to demonstrate how a Sauce Walka creator account could work on VYBE. Not an official artist account.
      </div>
    </div>

    <main>
      <section className="relative overflow-hidden border-b border-border">
        <img src="/images/demo/sauce-walka/banner.png" alt="" className="absolute inset-x-0 top-0 h-44 w-full object-cover object-center opacity-65 sm:inset-0 sm:h-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/55 to-background/25" />
        <div className="relative mx-auto max-w-7xl px-4 pb-5 pt-24 sm:px-6 sm:py-12 md:py-16">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[1.25rem] border-4 border-background bg-card shadow-2xl sm:h-36 sm:w-36 sm:rounded-[1.5rem] md:h-40 md:w-40">
                <img src="/images/demo/sauce-walka/profile.png" alt="Sauce Walka concept portrait" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-fuchsia-500/20 text-fuchsia-100 hover:bg-fuchsia-500/20">Creator Studio • Preview</Badge>
                  <Badge variant="outline"><MapPin className="mr-1 h-3 w-3" />Houston, Texas</Badge>
                </div>
                <h1 className="mt-3 break-words text-3xl font-black tracking-tight sm:text-5xl md:text-6xl">SAUCE WALKA</h1>
                <p className="mt-2 text-sm text-muted-foreground sm:text-lg">Independent Artist • Entrepreneur • Founder • Houston</p>
                <p className="mt-3 text-lg font-semibold text-white sm:text-xl">Music. Business. Houston. Sauce.</p>
                <p className="mt-3 hidden max-w-2xl text-xs leading-5 text-white/70 sm:block sm:text-sm">
                  Studio-level concept access is shown here because his creator world includes music, team workflows, business, media and private sharing. Creator Studio is still marked planned in the current VYBE catalog; Creator Pro is the closest production tier today.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button onClick={() => demo("Supporter view: Sauce's public VYBE is now your return point for new music, saved posts, business and access drops.")} className="rounded-full bg-gradient-brand"><Users className="mr-2 h-4 w-4" />Catch My VYBE</Button>
              <Button asChild variant="outline" className="rounded-full"><a href="/demo/sauce-walka/creator-hq"><BriefcaseBusiness className="mr-2 h-4 w-4" />Creator HQ</a></Button>
              <Button asChild variant="outline" className="rounded-full"><a href="/demo/founding-partner"><BriefcaseBusiness className="mr-2 h-4 w-4" />Founding Partner Demo</a></Button>
              <Button onClick={() => demo("Share flow: this creator home can be copied, texted, emailed or posted as one destination.")} variant="outline" className="col-span-2 rounded-full sm:col-span-1"><Share2 className="mr-2 h-4 w-4" />Share</Button>
            </div>
          </div>
        </div>
      </section>

      <nav className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 sm:py-3">
          {navigation.map(([label,id]) => <a key={id} href={`#${id}`} className="shrink-0 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary/60 hover:bg-primary/10 sm:px-4 sm:py-2 sm:text-sm">{label}</a>)}
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <SectionTitle eyebrow="What’s happening" title="One place to catch what matters now" copy="A creator-controlled front door for the release, event, business move, post or opportunity supporters should see first — without rebuilding the audience he already has." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Current music","Feature the newest 2026 release, then route supporters to VYBE previews, Apple Music, YouTube Music or the full catalog."],
            ["Sauce Moves","Music, business, Houston activity, interviews, Only Hands updates, products and other creator-world announcements."],
            ["Supporter return path","The follower count stays where it is. VYBE gives existing supporters somewhere dependable to return when they want to catch up."],
          ].map(([t,c]) => <button key={t} onClick={() => demo(`${t}: this card can open its full creator-controlled feed or destination.`)} className="rounded-3xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/60 sm:p-6"><h3 className="text-lg font-bold sm:text-xl">{t}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{c}</p></button>)}
        </div>
      </section>

      <section id="music" className="border-y border-border bg-card/35">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <SectionTitle eyebrow="Music" title="Listen here. Buy there. Keep the whole catalog connected." copy="Selected full songs and previews can live inside VYBE while the full catalog still points to the stores and streaming platforms he already uses." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {releases.map(([title,year,status,art],index) => <article key={title} className="overflow-hidden rounded-3xl border border-border bg-background">
              {art ? <Art art={art} className="aspect-square w-full" /> : <div className={`aspect-square w-full p-5 ${index===3?"bg-gradient-to-br from-pink-700 via-fuchsia-950 to-amber-500/50":index===4?"bg-gradient-to-br from-cyan-700 via-slate-950 to-violet-700":"bg-gradient-to-br from-violet-700 via-black to-rose-700"}`}><div className="flex h-full flex-col justify-between"><Music2 className="h-8 w-8"/><div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-200">{year} • {status}</p><h3 className="mt-2 text-2xl font-black">{title}</h3></div></div></div>}
              <div className="p-4"><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => demo(`${title}: ${index % 2 ? "preview" : "full-listen"} player opens inside VYBE.`)} className="rounded-full"><Play className="mr-2 h-3.5 w-3.5" />{index % 2 ? "Preview" : "Listen"}</Button><Button asChild size="sm" variant="outline" className="rounded-full"><a href="https://music.apple.com/us/artist/sauce-walka/911597254" target="_blank" rel="noreferrer">Open catalog</a></Button></div></div>
            </article>)}
          </div>
        </div>
      </section>
      <section id="playlists" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <SectionTitle eyebrow="Playlist workspace" title="The creator decides who hears what" copy="Public discovery, supporter-only listening, approved circles and temporary private links can all live in the same creator-controlled music workspace." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map(([title,access,copy,songs,art]) => <article key={title} className="overflow-hidden rounded-3xl border border-border bg-card">
            <Art art={art} className="aspect-square w-full" />
            <div className="p-5"><div className="flex items-center justify-between gap-3"><Headphones className="h-5 w-5 text-fuchsia-300" /><Badge variant={access==="Public"?"default":"outline"}>{access}</Badge></div><h3 className="mt-4 text-lg font-black sm:text-xl">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p><p className="mt-3 text-xs leading-5 text-muted-foreground">{songs}</p><Button onClick={() => demo(`${title}: ${access === "Public" ? "opens immediately" : access === "Supporters" ? "checks supporter access before playback" : access === "Approved" ? "shows request/approval access" : "opens a protected expiring listening link"}.`)} variant="outline" size="sm" className="mt-4 w-full rounded-full">Open playlist</Button></div>
          </article>)}
        </div>
      </section>

      <section id="video" className="border-y border-border bg-card/35">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <SectionTitle eyebrow="Creator video" title="A video drop can live inside his VYBE" copy="This demo now uses a native MP4 file, showing how a creator-uploaded video can play directly inside VYBE without sending supporters to another platform." />
          <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <div className="overflow-hidden rounded-3xl border border-border bg-black">
              <video
                src="/videos/demo/sauce-walka/creator-video.mp4"
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full bg-black object-contain"
              />
              <div className="border-t border-border bg-background p-4 sm:p-5"><Badge className="mb-2">Native VYBE upload</Badge><h3 className="text-xl font-black sm:text-2xl">Uploaded from Sauce’s library</h3><p className="mt-1 text-sm text-muted-foreground">Plays directly inside his creator account.</p></div>
            </div>
            <div className="rounded-3xl border border-border bg-background p-5 sm:p-6"><h3 className="text-xl font-black">Creator-controlled video</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">A native upload can be titled, featured, attached to a release or Sauce Move, and assigned the audience Sauce wants to reach.</p><p className="mt-4 text-sm leading-6 text-muted-foreground">For a production account, VYBE can later add thumbnail selection, visibility controls, comments, analytics, and storage or streaming rules based on membership.</p></div>
          </div>
        </div>
      </section>
      <section id="find-it-again" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <SectionTitle eyebrow="Find It Again" title="Search Sauce’s saved moments when you need them" copy="Supporters do not see a wall of saved links. They search what they remember, and VYBE shows matching creator-approved moments." />
        <div className="rounded-3xl border border-fuchsia-400/25 bg-gradient-to-br from-fuchsia-500/10 via-background to-cyan-500/10 p-5 sm:p-7">
          <div className="flex items-center gap-3"><Search className="h-6 w-6 text-cyan-300" /><h3 className="text-lg font-black sm:text-xl">What do you remember?</h3></div>
          <div className="mt-5 rounded-2xl border border-border bg-card px-4 py-4 text-sm text-muted-foreground sm:text-base">Try: “THC store” • “Houston post” • “mural artists” • “Miami creator space”</div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">Nothing is shown until the supporter searches or chooses a category. The original post remains on Instagram; VYBE only helps them find it again.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Button asChild className="rounded-full"><a href="/demo/sauce-walka/find-it-again">Search Sauce’s Find It Again</a></Button><Button asChild variant="outline" className="rounded-full"><a href="/demo/find-it-again">Search across creators</a></Button></div>
        </div>
      </section>

      <section id="moves" className="border-y border-border bg-card/35">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <SectionTitle eyebrow="Beyond the music" title="SAUCE MOVES" copy="A creator like Sauce Walka is not one category. VYBE can organize the larger creator world without forcing every supporter to care about every lane." />
          <div className="overflow-hidden rounded-3xl border border-border bg-background"><Art art="moves" className="aspect-[16/7] w-full" /><div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">{[["Only Hands","Video-game project and future updates"],["The Sauce Familia","Independent music ecosystem and collaborators"],["Houston","Local activity, appearances and community"],["Streaming + media","Interviews, long-form content and live moments"]].map(([t,c]) => <button key={t} onClick={() => demo(`${t}: opens Sauce's selected ${t === "The Sauce Familia" ? "label, collaborator and related-release updates" : "updates and related content"}.`)} className="rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/60"><h3 className="font-black">{t}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{c}</p></button>)}</div></div>
        </div>
      </section>
      <section id="business" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <SectionTitle eyebrow="Business" title="The business behind the Sauce" copy="VYBE can organize the destinations he already uses, while still keeping the creator at the center." />
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="overflow-hidden rounded-3xl border border-border bg-card"><Art art="business" className="aspect-[16/9] w-full" /><div className="p-5 sm:p-6"><h3 className="text-xl font-black">Business ecosystem</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">THC Club, Ice Kream, studio/property/retail ventures and other creator-approved destinations can live as organized links instead of scattered searches.</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2">{[["THC Club","Existing business destination","https://www.thc.club/"],["Ice Kream","Merchandise destination","https://icekream.com/"],["Independent empire","Studio, property, retail and other public ventures","#epk"],["Creator-controlled links","He decides what stays visible and what gets removed","#top"]].map(([t,c,h]) => <a key={t} href={h} target={h.startsWith("http")?"_blank":undefined} rel="noreferrer" className="rounded-3xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:border-primary/60"><BriefcaseBusiness className="h-6 w-6 text-fuchsia-300" /><h3 className="mt-4 font-black">{t}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{c}</p></a>)}</div>
        </div>
      </section>

      <section id="epk" className="border-y border-border bg-card/35">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <SectionTitle eyebrow="Media Kit / EPK / Press Pack" title="A professional profile that stays current" copy="Recent releases, signature catalog, press, business identity, booking paths and an industry playlist can stay current inside the creator account as a living media kit, EPK or press pack." />
          <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
            <div className="rounded-3xl border border-border bg-background p-5 sm:p-6"><FileText className="h-7 w-7 text-cyan-300" /><h3 className="mt-4 text-2xl font-black">Sauce Walka — Media Kit / EPK</h3><p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">Houston independent artist, entrepreneur and founder with a prolific catalog spanning the Sorry 4 the Sauce, Sauce Ghetto Gospel and Sauce Father eras.</p><div className="mt-5 flex flex-wrap gap-2">{["Hip-Hop","Southern Rap","Houston","Independent","Entrepreneur","Founder"].map(x => <Badge key={x} variant="outline">{x}</Badge>)}</div></div>
            <div className="rounded-3xl border border-border bg-background p-5 sm:p-6"><h3 className="font-black">Industry quick links</h3><div className="mt-4 grid gap-3">{["Recent releases","Signature catalog","Selected press","Booking / media contact","SAUCE BUSINESS — FOR THE ROOM playlist"].map(x => <button key={x} onClick={() => demo(`${x}: opens this part of the living EPK.`)} className="rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm hover:border-primary/60">{x}</button>)}</div></div>
          </div>
        </div>
      </section>
      <section id="shop" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <SectionTitle eyebrow="Shop the VYBE" title="Hear it here, buy it here, or route to the store he already uses" copy="This concept shows direct VYBE sales beside Apple/iTunes and merchandise links. The creator controls availability and price." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6"><ShoppingBag className="h-7 w-7 text-fuchsia-300" /><h3 className="mt-4 text-xl font-black">Sauce Ghetto Gospel</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Preview selected tracks on VYBE, then buy the album on Apple/iTunes.</p><Button asChild size="sm" className="mt-5 w-full sm:w-auto"><a href="https://music.apple.com/us/album/sauce-ghetto-gospel/1446635153" target="_blank" rel="noreferrer">Open Apple Music</a></Button></div>
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6"><Music2 className="h-7 w-7 text-cyan-300" /><h3 className="mt-4 text-xl font-black">Sauce Supporter Edition</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Concept bundle: selected digital tracks plus bonus creator commentary. Artist controls final pricing.</p><Badge className="mt-5">Concept pricing</Badge></div>
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6"><Globe2 className="h-7 w-7 text-amber-300" /><h3 className="mt-4 text-xl font-black">Merch + products</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Connect supporters to Ice Kream and other approved destinations without duplicating every storefront.</p></div>
        </div>
      </section>

      <section id="private" className="border-y border-border bg-card/35">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <SectionTitle eyebrow="Private VYBEs" title="Closer does not mean everybody gets in" copy="A creator can test ideas, ask for feedback or share unfinished work with exactly the people he chooses." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[["THE INNER SAUCE","Approved supporters","Request access","inner"],["THE SAUCE LAB","Password + expiring link","Private listening","lab"],["FIRST TASTE","48-hour early listen","Feedback enabled","starter"]].map(([title,access,action,art]) => <div key={title} className="overflow-hidden rounded-3xl border border-border bg-card"><Art art={art as ArtKey} className="aspect-[16/10] w-full" /><div className="p-5"><LockKeyhole className="h-6 w-6 text-fuchsia-300" /><h3 className="mt-3 text-xl font-black">{title}</h3><p className="mt-2 text-sm text-muted-foreground">{access}</p><Button onClick={() => demo(`${title}: ${action}. The creator controls entry and can revoke access.`)} variant="outline" size="sm" className="mt-4 w-full rounded-full">{action}</Button></div></div>)}</div>
        </div>
      </section>

      <section id="professional" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <SectionTitle eyebrow="Creator opportunities" title="What Sauce Is Open To" copy="Keep this simple and creator-first: the creator chooses which professional conversations are worth opening." />
        <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <Art art="opento" className="aspect-[16/10] w-full rounded-3xl border border-border" />
          <div className="grid gap-3 sm:grid-cols-2">{["Collaborations","Brand partnerships","Appearances + events","Licensing + media","Interviews","Business conversations"].map(x => <button key={x} onClick={() => demo(`${x}: opens a creator-controlled professional inquiry path.`)} className="rounded-2xl border border-border bg-card p-5 text-left font-semibold hover:border-primary/60">{x}</button>)}</div>
        </div>
        <div className="mt-8 rounded-3xl border border-primary/30 bg-primary/10 p-5 sm:p-6"><p className="font-bold">VYBE concept takeaway</p><p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">Instagram can hold thousands of posts. Apple Music can hold the catalog. YouTube can hold video. Stores can sell products. VYBE does not have to replace any of them. Supporters only need to remember the creator — then his VYBE helps them find the rest.</p></div>
      </section>
    </main>

    {note && <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-primary/40 bg-background/95 p-4 shadow-2xl backdrop-blur sm:left-auto sm:right-6 sm:w-[28rem]"><div className="flex items-start gap-3"><p className="flex-1 text-sm leading-6">{note}</p><button onClick={() => setNote(null)} aria-label="Close demo message" className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button></div></div>}
    <Footer />
  </div>;
}
