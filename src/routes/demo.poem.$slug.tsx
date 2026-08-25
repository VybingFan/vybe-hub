import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Feather, Heart, MessageCircle, Music2, Sparkles } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo/poem/$slug")({ component: DemoPoemPage });

const poems = {
  "the-dream-didnt-die": {
    title: "The Dream Didn't Die",
    theme: "Reinvention · Second chances",
    image: "/images/demo/nova-vale/epk-v2/nova-4.png",
    introduction:
      "A poem about the years that looked like distance from the dream—but ultimately became the life experience that gave the dream meaning.",
    creatorNote:
      "This work anchors Nova's origin story. It can stand as a written poem, become a spoken-word recording, inspire a song, and lead supporters into a playlist about creative return.",
    stanzas: [
      "I used to think\na dream had to be chased\nto be real.",
      "So when I stopped running,\nI called it dead.",
      "I folded songs into notebooks,\nput poems underneath bills,\nburied melodies beneath\ngrocery lists and doctor's appointments,\nand tucked the woman I wanted to become\nsomewhere between\n‘Did you eat?’\nand ‘I'll handle it.’",
      "Life was loud.",
      "Children needed feeding.\nPeople needed saving.\nSomebody always needed\na piece of me.",
      "And I gave.\n\nGod knows,\nI gave.",
      "Until one day\nI found an old version of myself\nstill sitting quietly inside me—\n\nnot angry.\n\nNot bitter.\n\nJust waiting.",
      "She looked at me like,\n\nWell?",
      "And I didn't have an answer.",
      "Because how do you explain\nto the girl you used to be\nthat you spent years\nbecoming everything\neveryone else needed\nand somehow forgot\nyou were somebody too?",
      "I thought time had betrayed me.\n\nBut maybe time\nwas teaching me something.",
      "Maybe the years weren't stolen.\n\nMaybe they were pages.",
      "Maybe motherhood\nwas a verse.\n\nMaybe heartbreak\nwas a bridge.\n\nMaybe every goodbye\nwas a harmony\nI didn't understand yet.",
      "Maybe the woman\nI was trying so desperately\nto get back to\n\nnever actually left.\n\nMaybe she was becoming me.",
      "And now—\n\nI don't chase the dream anymore.\n\nI walk beside it.\n\nOlder.\n\nWiser.\n\nA little tired.\n\nA lot less afraid.",
      "And when I finally sing\nthe words I was once too busy living\nto write down,\n\nI won't apologize\nfor how long it took.",
      "Because some dreams\ndon't die.\n\nThey wait\n\nuntil the woman holding them\nhas finally lived enough life\nto know what they're worth.",
    ],
  },
  "the-woman-in-the-mirror-has-lived": {
    title: "The Woman in the Mirror Has Lived",
    theme: "Womanhood · Memory · Voice",
    image: "/images/demo/nova-vale/epk-v2/nova-7.png",
    introduction:
      "A declaration that mature beauty is not the absence of age or hardship; it is the visible presence of survival, choice, memory, and self-possession.",
    creatorNote:
      "This poem defines Nova's grown-woman perspective. Its strongest discovery context is not age alone, but confidence, survival, grief, desire, faith, and the right to be fully seen.",
    stanzas: [
      "Don't ask me\nto look twenty-five.\n\nI have earned this face.",
      "Every line has a witness.\n\nEvery scar\nknows a name.",
      "These eyes have watched\npeople leave\nwho swore they'd stay.\n\nThey've watched babies become adults.\n\nThey've watched empty chairs\nwhere familiar bodies used to be.",
      "They've cried in bathrooms\nand walked back out\nlike nothing happened.",
      "So no—\n\nI don't want to look untouched.\n\nI want to look lived.",
      "I want the kind of beauty\nthat doesn't need to introduce itself.\n\nThe kind that walks into a room\nand knows exactly\nwhat it survived to get there.",
      "I've learned that sexy\nisn't showing everything.\n\nSometimes sexy\nis knowing what belongs to you\nand refusing to explain it.",
      "Sometimes it's the way\na woman laughs\nafter life tried to make her bitter.",
      "Sometimes it's bare feet\non a hardwood floor\nat midnight\nsinging a song\nshe thought she'd never finish.",
      "Sometimes it's a scar\nyou stop hiding.\n\nSometimes it's saying,\n\nNo.\n\nSometimes it's saying,\n\nYes.",
      "And sometimes\nit's looking at the woman\nin the mirror\n\nand finally understanding—\n\nshe was never waiting\nfor somebody to choose her.\n\nShe was waiting\nfor herself.",
      "So here I am.\n\nNot younger.\n\nNot untouched.\n\nNot pretending\nthe road was easy.",
      "Just beautiful\nin a way I couldn't have been\nbefore I lived it.",
      "And if my voice shakes\nwhen I sing,\n\nlet it.\n\nThere are some truths\nthat should tremble\nbefore they leave the body.",
      "Because I am not singing\nfrom imagination anymore.\n\nI'm singing\nfrom memory.\n\nFrom motherhood.\n\nFrom mistakes.\n\nFrom faith.\n\nFrom desire.\n\nFrom grief.\n\nFrom laughter.",
      "From all the years\nI thought were taking me away\nfrom the woman I wanted to be.\n\nThey weren't.\n\nThey were writing her.\n\nAnd now—\n\nshe has a voice.",
    ],
  },
  "what-my-children-didnt-know": {
    title: "What My Children Didn't Know",
    theme: "Motherhood · Identity · Return",
    image: "/images/demo/nova-vale/epk-v2/nova-5.png",
    introduction:
      "A mother speaks honestly about love, sacrifice, invisibility, and the example created when her children finally see her reclaim a dream of her own.",
    creatorNote:
      "This work connects Nova's family story to her creative return without treating motherhood as a mistake. It gives supporters a meaningful path from poem to biography, spoken word, music, and community conversation.",
    stanzas: [
      "My children knew\nI was strong.",
      "They saw me make something\nout of almost nothing.\n\nThey saw me keep going\nwhen going\nwas the only option.",
      "They knew how to call my name\nwhen something broke.\n\nThey knew I'd come.",
      "What they didn't know\nwas how many times\nI had to gather myself\nbefore I could gather them.",
      "They didn't see\nthe woman behind the mother.\n\nThe girl who still had songs\ninside her.",
      "The woman who sometimes stood\nin the kitchen after everyone went to sleep\nand wondered,\n\nWhat happened to the life\nI thought I'd have?",
      "I never told them\nthat sometimes love\nlooks like disappearing\ninside the people you love.\n\nNot because you regret them.\n\nNever that.",
      "But because motherhood\ncan be a strange kind of magic—\n\nyou spend so many years\nteaching little people\nhow to become themselves\n\nthat you forget\nyou were supposed to keep becoming too.",
      "I gave them my time.\n\nMy patience.\n\nMy best years.\n\nMy tired years.\n\nMy almost-broken years.\n\nAnd I would do it again.",
      "But somewhere along the way\nI learned something\nI wish every mother knew:\n\nSacrifice\nis not supposed to be\nthe same thing as erasure.",
      "I am allowed\nto have a name\noutside of theirs.\n\nA song\nthat doesn't belong\nto anyone but me.\n\nA dream\nthat doesn't need\npermission.",
      "And perhaps the greatest gift\nI can give my children now\n\nis not another piece of myself.\n\nIt is letting them watch me\ntake a piece of myself back.",
      "Not from them.\n\nFrom the silence.\n\nFrom the years\nI thought were gone.\n\nFrom the woman\nwho kept saying,\n\nMaybe someday.",
      "Someday is here.",
      "And if they ever ask me\nwhen I became myself again,\n\nI'll tell them:\n\nI never stopped being her.\n\nI just finally remembered\nshe was still there.",
    ],
  },
} as const;

function DemoPoemPage() {
  const { slug } = Route.useParams();
  const poem = poems[slug as keyof typeof poems] ?? poems["the-dream-didnt-die"];

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <article>
          <header className="border-b border-border/60 bg-gradient-hero">
            <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1fr_.72fr] lg:items-center lg:py-16">
              <div>
                <Button asChild variant="ghost" className="-ml-4 mb-7 rounded-full">
                  <Link to="/demo/creator" hash="poetry">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Nova Vale poetry
                  </Link>
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-200">
                    <Feather className="mr-2 h-3.5 w-3.5" /> Original poetry
                  </Badge>
                  <Badge variant="outline">Human-written · Demo publication</Badge>
                </div>
                <p className="mt-7 text-sm font-semibold uppercase tracking-[.2em] text-fuchsia-300">
                  {poem.theme}
                </p>
                <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">{poem.title}</h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                  {poem.introduction}
                </p>
              </div>
              <img
                src={poem.image}
                alt={`Nova Vale visual for ${poem.title}`}
                className="aspect-[4/5] w-full rounded-[2rem] border border-border object-cover shadow-elevated"
              />
            </div>
          </header>

          <div className="mx-auto grid max-w-5xl gap-10 px-6 py-14 lg:grid-cols-[1fr_18rem] lg:items-start">
            <div className="rounded-[2rem] border border-border bg-card px-7 py-10 sm:px-12">
              <div className="space-y-8 text-lg leading-8 text-foreground/90">
                {poem.stanzas.map((stanza, index) => (
                  <p key={index} className="whitespace-pre-line">{stanza}</p>
                ))}
              </div>
              <p className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
                Written by Nova Vale's human creator. The Nova Vale visual identity is AI-generated
                and human-directed; the writing is presented as original human-authored work.
              </p>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24">
              <div className="rounded-3xl border border-primary/25 bg-primary/5 p-6">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="mt-4 text-xl font-semibold">Why this belongs on VYBE</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{poem.creatorNote}</p>
              </div>
              <Button asChild className="w-full rounded-full bg-gradient-brand">
                <Link to="/demo/creator" hash="music">
                  <Music2 className="mr-2 h-4 w-4" /> Hear Nova's music
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link to="/auth/sign-up">
                  <Heart className="mr-2 h-4 w-4" /> Follow Nova
                </Link>
              </Button>
              <div className="rounded-3xl border border-border bg-card p-5">
                <MessageCircle className="h-5 w-5 text-fuchsia-300" />
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Public visitors can read. A free VYBE account would unlock saving, reactions,
                  comments, following, and future reading discussions.
                </p>
              </div>
            </aside>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
