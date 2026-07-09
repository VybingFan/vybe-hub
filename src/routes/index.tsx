import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Music2, Upload, Users, Heart, Sparkles, Play } from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/constants/app";

export const Route = createFileRoute("/")({
  component: Landing,
});

const features = [
  { icon: Upload, title: "Upload music & video", body: "Drop a track or a video and publish in seconds." },
  { icon: Users, title: "Grow your audience", body: "Native discovery tools built for independents." },
  { icon: Heart, title: "Direct support", body: "Turn listeners into supporters with zero middlemen." },
  { icon: Sparkles, title: "Creator-first tooling", body: "Analytics, playlists and profile that feel yours." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-gradient-hero absolute inset-0 -z-10" />
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-6 rounded-full border-primary/30 bg-primary/10 text-primary">
              Alpha · Now inviting creators
            </Badge>
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              A platform built for
              <span className="text-gradient-brand"> independent music.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              {APP_NAME} gives artists a home to release music, share video, and connect with the
              people who actually show up.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-brand text-primary-foreground shadow-glow">
                <Link to="/auth/sign-up">
                  Start creating <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/dashboard">
                  <Play className="mr-2 h-4 w-4" /> Explore the app
                </Link>
              </Button>
            </div>
          </div>

          {/* Hero preview card */}
          <div className="mx-auto mt-16 max-w-5xl">
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-elevated">
              <CardContent className="flex aspect-video items-center justify-center p-0">
                <img
                  src="/banners/default-creator-banner.png"
                  alt="Creator studio preview"
                  className="h-full w-full rounded-[calc(var(--radius)+4px)] object-cover"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="creators" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-14 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Built for the way independent artists actually work.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Skip the label. Ship your art. Own the relationship with your listeners.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="border-border/50 bg-card/60 transition-colors hover:bg-card">
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="supporters" className="mx-auto max-w-7xl px-6 pb-24">
        <Card className="overflow-hidden border-primary/20 bg-gradient-brand">
          <CardContent className="flex flex-col items-center gap-6 p-12 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="text-3xl font-bold text-primary-foreground">
                Your sound. Your audience. Your rules.
              </h2>
              <p className="mt-2 max-w-lg text-primary-foreground/80">
                Join {APP_NAME} Alpha and help shape the future of independent music.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary" className="rounded-full">
              <Link to="/auth/sign-up">
                <Music2 className="mr-2 h-4 w-4" /> Claim your profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
}
