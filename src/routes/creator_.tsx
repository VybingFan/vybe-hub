import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpenText,
  Download,
  Headphones,
  ListMusic,
  LogIn,
  Share,
  ShoppingBag,
  Smartphone,
  Video,
} from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { usePwaInstall } from "@/components/pwa/pwaInstallContext";

export const Route = createFileRoute("/creator_")({
  component: CreatorStartPage,
});

const creatorTools = [
  {
    title: "Music and playlists",
    description: "Upload your work, organize your library, and publish shareable listening links.",
    icon: ListMusic,
  },
  {
    title: "Stories and context",
    description: "Give fans the meaning, process, credits, and people behind your creative work.",
    icon: BookOpenText,
  },
  {
    title: "Video and watch",
    description: "Build a visual home for videos, performances, trailers, and creator updates.",
    icon: Video,
  },
  {
    title: "Merchandise showcase",
    description: "Present merchandise, collectibles, and future products alongside your work.",
    icon: ShoppingBag,
  },
] as const;

function CreatorStartPage() {
  const { user, primaryRole, defaultRoute, isLoading } = useUser();
  const { canInstall, isIos, install } = usePwaInstall();
  const isCreator = primaryRole === "creator" || primaryRole === "admin";

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="relative isolate overflow-hidden border-b border-border/60">
          <div className="bg-gradient-hero absolute inset-0 -z-20" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-background/20 to-background" />
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                VYBE for creators
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
                Your work. Your audience. <span className="text-gradient-brand">Your VYBE.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Create one home for your music, playlists, stories, videos, merchandise, and
                community—then share it directly with the people who support you.
              </p>

              {!isLoading && isCreator ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-brand text-primary-foreground shadow-glow"
                  >
                    <a href={defaultRoute}>
                      Open Creator Studio <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ) : !isLoading && !user ? (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-brand text-primary-foreground shadow-glow"
                  >
                    <Link to="/auth/sign-up" search={{ role: "creator" }}>
                      Create a free creator account <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full">
                    <Link to="/auth/sign-in">
                      <LogIn className="mr-2 h-4 w-4" /> Creator sign in
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="mt-8">
                  <Button asChild size="lg" variant="outline" className="rounded-full">
                    <a href={defaultRoute}>Return to your VYBE</a>
                  </Button>
                </div>
              )}

              <p className="mt-5 text-sm text-muted-foreground">
                Creator Free is available now. No credit card is required to begin.
              </p>
            </div>

            <div className="rounded-[2rem] border border-primary/25 bg-card/85 p-6 shadow-elevated backdrop-blur-xl sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                    VYBE Creator app
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">Keep your Studio one tap away.</h2>
                </div>
              </div>
              <p className="mt-5 leading-7 text-muted-foreground">
                Install VYBE Creator from this website. No app-store search or separate domain is
                required.
              </p>

              {isIos ? (
                <ol className="mt-6 grid gap-3 text-sm">
                  <InstallStep number="1" icon={Share} text="Tap your browser's Share button." />
                  <InstallStep number="2" text="Choose Add to Home Screen." />
                  <InstallStep number="3" text="Confirm VYBE Creator, then tap Add." />
                </ol>
              ) : canInstall ? (
                <Button
                  size="lg"
                  className="mt-6 w-full bg-gradient-brand text-primary-foreground"
                  onClick={install}
                >
                  <Download className="mr-2 h-4 w-4" /> Install VYBE Creator
                </Button>
              ) : (
                <div className="mt-6 rounded-2xl border border-border/70 bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
                  Sign in as a creator, then use your browser’s Install app or Add to Home Screen
                  option. If VYBE Creator is already installed, open it from your device.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Start creating
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything begins inside Creator Studio.
            </h2>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {creatorTools.map((tool) => (
              <article key={tool.title} className="rounded-3xl border border-border/70 bg-card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <tool.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{tool.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4 rounded-3xl border border-border/70 bg-muted/25 p-6">
            <Headphones className="h-6 w-6 text-primary" />
            <p className="min-w-0 flex-1 text-sm leading-6 text-muted-foreground">
              Fans do not need the creator app. They can open your public links and browse VYBE
              through the website.
            </p>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/for-artists">Learn how creator access works</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function InstallStep({
  number,
  text,
  icon: Icon,
}: {
  number: string;
  text: string;
  icon?: typeof Share;
}) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/35 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
        {Icon ? <Icon className="h-4 w-4" /> : number}
      </span>
      <span>{text}</span>
    </li>
  );
}
