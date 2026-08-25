import type { ComponentProps } from "react";
import { ExperiencePreviewPage } from "@/components/experience/ExperiencePreviewPage";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";

export function PublicExperiencePage(props: ComponentProps<typeof ExperiencePreviewPage>) {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main className="px-5 py-8 sm:px-6 sm:py-12 md:py-16">
        <ExperiencePreviewPage {...props} />
      </main>
      <Footer />
    </div>
  );
}
