import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Button } from "@/components/ui/button";
import {
  getNonMusicPreview,
  NonMusicPreviewPlayer,
} from "@/features/play/games/NonMusicPlayPreviews";

export const Route = createFileRoute("/play/preview/$previewKey")({
  component: PreviewGamePage,
});

function PreviewGamePage() {
  const { previewKey } = Route.useParams();
  const preview = getNonMusicPreview(previewKey);

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main className="mx-auto max-w-4xl px-5 py-6 sm:px-6 sm:py-10">
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

        {preview ? (
          <>
            <NonMusicPreviewPlayer previewKey={previewKey} />
            <div className="mt-5">
              <Button asChild variant="outline" className="w-full rounded-full sm:w-auto">
                <Link to="/experience/play">Choose another game</Link>
              </Button>
            </div>
          </>
        ) : (
          <section className="rounded-2xl border border-dashed border-border bg-card p-6 text-center sm:p-10">
            <Gamepad2 className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-2xl font-semibold">This game is not available.</h1>
            <Button asChild className="mt-5 rounded-full">
              <Link to="/experience/play">Choose another game</Link>
            </Button>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
