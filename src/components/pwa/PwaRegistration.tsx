import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaRegistration() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const watchInstallingWorker = (worker: ServiceWorker | null) => {
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          setWaitingWorker(worker);
          setDismissed(false);
        }
      });
    };

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((value) => {
        registration = value;
        if (value.waiting) setWaitingWorker(value.waiting);
        watchInstallingWorker(value.installing);
        value.addEventListener("updatefound", () => watchInstallingWorker(value.installing));
      })
      .catch((error) => {
        console.error("VYBE Creator service worker registration failed", error);
      });

    const checkForUpdate = () => {
      if (document.visibilityState === "visible") void registration?.update();
    };
    const updateInterval = window.setInterval(checkForUpdate, 60 * 60 * 1000);
    window.addEventListener("online", checkForUpdate);
    document.addEventListener("visibilitychange", checkForUpdate);

    let refreshing = false;
    const activateUpdate = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", activateUpdate);

    return () => {
      window.clearInterval(updateInterval);
      window.removeEventListener("online", checkForUpdate);
      document.removeEventListener("visibilitychange", checkForUpdate);
      navigator.serviceWorker.removeEventListener("controllerchange", activateUpdate);
    };
  }, []);

  if (!waitingWorker || dismissed) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl rounded-2xl border border-primary/30 bg-background p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">A VYBE update is ready</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Update now to load the newest features. Drafts already saved on this device will remain.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => waitingWorker.postMessage({ type: "SKIP_WAITING" })}>
              Update VYBE
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDismissed(true)}>
              Later
            </Button>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Dismiss update"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
