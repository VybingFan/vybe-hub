import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Check, Crown, ShieldCheck, Sparkles } from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Footer } from "@/components/layout/Footer";
import { MembershipCheckoutButton } from "@/components/membership/MembershipCheckoutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CREATOR_PLAN_CATALOG,
  FOUNDING_CREATOR_NOTE,
  PIONEER_NOTE,
} from "@/features/membership/catalog";

export const Route = createFileRoute("/creator-memberships")({
  component: CreatorMembershipsPage,
});

function CreatorMembershipsPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="border-b border-border/60 bg-gradient-hero">
          <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-20">
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
              Creator memberships
            </Badge>
            <h1 className="mx-auto mt-5 max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl md:text-6xl">
              Start free. Build the creator home your work deserves.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              Every VYBE creator begins with a working public page, music library, and shareable
              playlists. Paid memberships will add capacity, video, AI, analytics, and professional
              tools as each feature becomes ready.
            </p>
            <div className="mt-8 inline-flex max-w-full flex-wrap justify-center rounded-2xl border border-border bg-background p-1 sm:rounded-full">
              <Button
                type="button"
                size="sm"
                variant={billing === "monthly" ? "default" : "ghost"}
                className="rounded-full"
                onClick={() => setBilling("monthly")}
              >
                Monthly
              </Button>
              <Button
                type="button"
                size="sm"
                variant={billing === "annual" ? "default" : "ghost"}
                className="rounded-full"
                onClick={() => setBilling("annual")}
              >
                Annual · save 2 months
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {CREATOR_PLAN_CATALOG.map((plan) => {
              const price = billing === "annual" ? plan.annualPrice : plan.monthlyPrice;
              return (
                <Card
                  key={plan.code}
                  className={
                    plan.code === "creator_plus"
                      ? "relative overflow-hidden border-primary shadow-glow"
                      : "relative overflow-hidden"
                  }
                >
                  {plan.badge ? (
                    <div className="absolute right-4 top-4">
                      <Badge>{plan.badge}</Badge>
                    </div>
                  ) : null}
                  <CardContent className="flex h-full flex-col p-6">
                    <p className="text-sm font-semibold text-primary">{plan.name}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${price}</span>
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        / {billing === "annual" ? "year" : "month"}
                      </span>
                    </div>
                    {billing === "annual" && price > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Save ${(plan.monthlyPrice * 12) - price} compared with monthly billing
                      </p>
                    ) : (
                      <div className="h-5" />
                    )}
                    <p className="mt-5 min-h-20 text-sm leading-6 text-muted-foreground">
                      {plan.audience}
                    </p>

                    <div className="mt-5 space-y-2 border-y border-border/60 py-5 text-sm">
                      <Limit label="Songs in library" value={plan.limits.librarySongs} />
                      <Limit label="Published songs" value={plan.limits.publishedSongs} />
                      <Limit label="Playlists" value={plan.limits.playlists} />
                      <Limit
                        label="Stored video"
                        value={
                          plan.limits.videoMinutes
                            ? `${plan.limits.videoMinutes} min`
                            : "Preview planned"
                        }
                      />
                      <Limit label="AI assists" value={`${plan.limits.aiActions}/mo`} />
                    </div>

                    <ul className="mt-5 flex-1 space-y-3 text-sm">
                      {plan.highlights.map((highlight) => (
                        <li key={highlight} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>

                    <MembershipCheckoutButton
                      planCode={plan.code}
                      planName={plan.name}
                      interval={billing}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="border-y border-border/60 bg-surface/35">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 lg:grid-cols-3">
            <PolicyCard icon={BadgeCheck} title="VYBE Pioneer" body={PIONEER_NOTE} />
            <PolicyCard
              icon={Crown}
              title="Founding Creator"
              body={`${FOUNDING_CREATOR_NOTE} Those commitments continue under their approved invitation terms.`}
            />
            <PolicyCard
              icon={ShieldCheck}
              title="Safe downgrades"
              body="VYBE will not immediately delete creator work. Paid-to-Free downgrades receive a 30-day adjustment period to choose what remains published."
            />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-3xl border border-primary/25 bg-primary/5 p-8 md:p-10">
            <Sparkles className="h-8 w-8 text-primary" />
            <h2 className="mt-5 text-3xl font-semibold">Honest launch status</h2>
            <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
              Music profiles, libraries, editors, playlists, share links, and merchandise showcases
              work today. Membership billing is entering controlled Stripe verification. Creator AI,
              native video hosting, advanced analytics, commerce, custom domains, and team
              workspaces remain labeled Coming Soon until each is connected and verified.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Limit({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function PolicyCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Crown;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-3xl border border-border bg-card p-7">
      <Icon className="h-7 w-7 text-primary" />
      <h2 className="mt-5 text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
    </article>
  );
}
