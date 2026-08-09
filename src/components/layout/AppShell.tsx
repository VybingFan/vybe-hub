import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobilePrimaryNav } from "./MobilePrimaryNav";
import { TopNav } from "./TopNav";
import { CreatorPwaInstallPrompt } from "@/components/pwa/CreatorPwaInstallPrompt";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <TopNav />
          <CreatorPwaInstallPrompt />
          <main className="flex-1 px-4 pb-24 pt-5 sm:px-5 md:px-8 md:py-8 lg:px-10">
            {children}
          </main>
          <MobilePrimaryNav />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
