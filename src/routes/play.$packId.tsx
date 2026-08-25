import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Gamepad2, Loader2 } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Button } from "@/components/ui/button";
import { ReleasedGamePackPlayer } from "@/features/play/games/PublishedGamePacks";
import {
  publicPlayGamePackService,
  type ReleasedPlayGamePack,
} from "@/services/play/publicPlayGamePackService";

export const Route = createFileRoute("/play/$packId")({
  component: DedicatedGamePage,
});

function DedicatedGamePage() {
  const { packId } = Route.useParams();
  const [pack, setPack] = useState<ReleasedPlayGamePack | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMissing(false);

    void publicPlayGamePackService
      .listReleased()
      .then((packs) => {
        if (!active) return;
        const found = packs.find((entry) => entry.id === packId && entry.items.length) ?? null;
        setPack(found);
        setMissing(!found);
      })
      .catch(() => {
        if (active) setMissing(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [packId]);

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main className="mx-auto max-w-5xl px-5 py-6 sm:px-6 sm:py-10">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Button asChild variant="ghost" className="px-0 hover:bg-transparent">
            <Link to="/experience/play">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to games
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Gamepad2 className="h-4 w-4 text-primary" />
            VYBE Play
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : null}

        {!loading && missing ? (
          <section className="rounded-2xl border border-dashed border-border bg-card p-6 text-center sm:p-10">
            <Gamepad2 className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-semibold">This game is not available right now.</h1>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              The game may have ended, been unpublished, or no longer have released questions.
            </p>
            <Button asChild className="mt-5 rounded-full">
              <Link to="/experience/play">Choose another game</Link>
            </Button>
          </section>
        ) : null}

        {!loading && pack ? (
          <section>
            <ReleasedGamePackPlayer key={pack.id} pack={pack} />
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline" className="w-full rounded-full sm:w-auto">
                <Link to="/experience/play">Choose another game</Link>
              </Button>
              {pack.discovery_url ? (
                <Button asChild variant="ghost" className="w-full rounded-full sm:w-auto">
                  <a href={pack.discovery_url}>Discover related creators</a>
                </Button>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}