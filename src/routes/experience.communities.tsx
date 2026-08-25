import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Reply, Users } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/experience/communities")({ component: CommunitiesDemo });

const replies = [
  {
    name: "Maya R.",
    time: "18 minutes ago",
    body: "For me, it is the small detail that sounds like it came from a real memory. That makes me lean in.",
    likes: 14,
  },
  {
    name: "Jordan K.",
    time: "11 minutes ago",
    body: "A lyric can do it, but sometimes it is the texture of the voiceâ€”even before I know the words.",
    likes: 9,
  },
  {
    name: "Ari B.",
    time: "4 minutes ago",
    body: "Context helps. Hearing why Nova made After the Signal changed what I noticed in the track.",
    likes: 6,
  },
];

function CommunitiesDemo() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-hero">
          <img src="/images/supporter-cards/community.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/55" />
          <div className="relative mx-auto max-w-6xl px-5 py-9 sm:px-6 sm:py-16 md:py-20">
            <Badge className="border-pink-700/30 bg-pink-100 text-pink-900 dark:border-pink-300/30 dark:bg-pink-300/10 dark:text-pink-200">
              <MessageCircle className="mr-2 h-3.5 w-3.5" />
              Community on VYBE
            </Badge>
            <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight sm:mt-5 sm:text-4xl md:text-6xl">
              Join the conversation.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:mt-5 sm:text-lg sm:leading-8">
              Explore creator-led conversations, read what supporters are saying, and sign in when
              you are ready to react or reply.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-5 py-8 sm:gap-8 sm:px-6 sm:py-14 lg:grid-cols-[1fr_18rem]">
          <article className="rounded-2xl border border-border bg-card p-4 sm:rounded-[2rem] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/images/demo/nova-vale/avatar.webp"
                  alt="Nova Vale"
                  className="h-10 w-10 rounded-xl object-cover sm:h-12 sm:w-12 sm:rounded-2xl"
                />
                <div>
                  <p className="font-semibold">Nova Vale</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">@novavale Â· Featured discussion</p>
                </div>
              </div>
              <Badge variant="outline">Example community</Badge>
            </div>

            <h2 className="mt-5 text-2xl font-semibold sm:mt-7 sm:text-3xl">What makes a song feel personal?</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-base sm:leading-7">
              While finishing â€œAfter the Signal,â€ I kept one imperfect vocal breath because it
              carried more truth than the cleaner take. What detail makes a song feel as if it is
              speaking directly to you?
            </p>
            <div className="mt-4 flex flex-wrap gap-2 border-y border-border py-3 sm:mt-6 sm:gap-3 sm:py-4">
              <Button asChild variant="outline" size="sm" className="rounded-full sm:h-10 sm:px-4">
                <Link to="/auth/sign-in">
                  <Heart className="mr-2 h-4 w-4" />
                  React Â· 31
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-full sm:h-10 sm:px-4">
                <Link to="/auth/sign-in">
                  <Reply className="mr-2 h-4 w-4" />
                  Reply
                </Link>
              </Button>
            </div>

            <div className="mt-5 space-y-2.5 sm:mt-7 sm:space-y-4">
              <h3 className="font-semibold">Community replies</h3>
              {replies.map((reply) => (
                <div
                  key={reply.name}
                  className="rounded-xl border border-border bg-background/50 p-3.5 sm:rounded-2xl sm:p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium sm:text-base">{reply.name}</p>
                    <p className="text-[11px] text-muted-foreground sm:text-xs">{reply.time}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground sm:mt-3 sm:text-base sm:leading-7">
                    {reply.body}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground sm:mt-3 sm:text-sm">{reply.likes} reactions</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-primary/25 bg-primary/5 p-4 sm:mt-7 sm:rounded-2xl sm:p-5">
              <p className="font-semibold">Add your voice</p>
              <p className="mt-1.5 text-sm text-muted-foreground sm:mt-2">
                Create a free account to reply, react, save discussions, and follow creators.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:flex-wrap">
                <Button asChild size="sm" className="w-full rounded-full bg-gradient-brand sm:w-auto sm:h-10 sm:px-4">
                  <Link to="/auth/sign-up">Create free account</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full rounded-full sm:w-auto sm:h-10 sm:px-4">
                  <Link to="/auth/sign-in">Sign in</Link>
                </Button>
              </div>
            </div>
          </article>

          <aside>
            <div className="rounded-2xl border border-border bg-card p-4 sm:rounded-3xl sm:p-6">
              <Users className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
              <h2 className="mt-3 text-lg font-semibold sm:mt-4 sm:text-xl">Novaâ€™s Studio Notes</h2>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground sm:mt-2">
                Music, release stories, creative process, and conversations with Nova.
              </p>
              <Badge variant="outline" className="mt-3 sm:mt-4">
                Example community
              </Badge>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
}
