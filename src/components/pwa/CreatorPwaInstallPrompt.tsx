import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

export function CreatorPwaInstallPrompt() {
  const { hasRole, isLoading } = useUser();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setShowIosInstructions(isIos);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallEvent(null);
      setShowIosInstructions(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isLoading || !hasRole("creator") || dismissed || (!installEvent && !showIosInstructions)) {
    return null;
  }

  return (
    <aside className="border-b border-primary/25 bg-primary/8 px-4 py-3 sm:px-5 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            {showIosInstructions ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-sm font-semibold">Install VYBE Creator</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {showIosInstructions
                ? "Tap Share, then choose Add to Home Screen to install your Creator Studio."
                : "Add your Creator Studio to this device for faster access from your home screen."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {installEvent ? (
            <Button
              size="sm"
              className="bg-gradient-brand text-primary-foreground"
              onClick={async () => {
                await installEvent.prompt();
                await installEvent.userChoice;
                setInstallEvent(null);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Install
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            aria-label="Dismiss install message"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
