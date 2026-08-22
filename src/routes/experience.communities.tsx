import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Reply, Sparkles, Users } from "lucide-react";
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
    body: "A lyric can do it, but sometimes it is the texture of the voice—even before I know the words.",
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
          <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-20">
            <Badge className="border-pink-700/30 bg-pink-100 text-pink-900 dark:border-pink-300/30 dark:bg-pink-300/10 dark:text-pink-200">
              <MessageCircle className="mr-2 h-3.5 w-3.5" />
              Functional community demonstration
            </Badge>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
              Join the conversation.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Everyone can read this sample discussion. A free VYBE account would be required to
              react, reply, or begin a new conversation.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[1fr_18rem]">
          <article className="rounded-[2rem] border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/images/demo/nova-vale/avatar.webp"
                  alt="Nova Vale"
                  className="h-12 w-12 rounded-2xl object-cover"
                />
                <div>
                  <p className="font-semibold">Nova Vale</p>
                  <p className="text-sm text-muted-foreground">@novavale · Featured discussion</p>
                </div>
              </div>
              <Badge variant="outline">Demo conversation</Badge>
            </div>

            <h2 className="mt-7 text-3xl font-semibold">What makes a song feel personal?</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              While finishing “After the Signal,” I kept one imperfect vocal breath because it
              carried more truth than the cleaner take. What detail makes a song feel as if it is
              speaking directly to you?
            </p>
            <div className="mt-6 flex flex-wrap gap-3 border-y border-border py-4">
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/auth/sign-in">
                  <Heart className="mr-2 h-4 w-4" />
                  React · 31
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/auth/sign-in">
                  <Reply className="mr-2 h-4 w-4" />
                  Reply
                </Link>
              </Button>
            </div>

            <div className="mt-7 space-y-4">
              <h3 className="font-semibold">Community replies</h3>
              {replies.map((reply) => (
                <div
                  key={reply.name}
                  className="rounded-2xl border border-border bg-background/50 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{reply.name}</p>
                    <p className="text-xs text-muted-foreground">{reply.time}</p>
                  </div>
                  <p className="mt-3 leading-7 text-muted-foreground">{reply.body}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{reply.likes} reactions</p>
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-2xl border border-primary/25 bg-primary/5 p-5">
              <p className="font-semibold">Add your voice</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a free account to reply, react, save discussions, and follow creators.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild className="rounded-full bg-gradient-brand">
                  <Link to="/auth/sign-up">Create free account</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/auth/sign-in">Sign in</Link>
                </Button>
              </div>
            </div>
          </article>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-border bg-card p-6">
              <Users className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-xl font-semibold">Nova’s Studio Notes</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A fictional creator-led space for release stories, listening questions, and process
                updates.
              </p>
              <Badge variant="outline" className="mt-4">
                Public preview
              </Badge>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6">
              <Sparkles className="h-6 w-6 text-pink-500" />
              <h2 className="mt-4 text-xl font-semibold">Creator controls</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Future creators can decide who may view, reply, post, moderate, or enter a
                subscriber space.
              </p>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
}
