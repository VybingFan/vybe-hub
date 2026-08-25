import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { usePwaInstall } from "@/components/pwa/pwaInstallContext";

const DISMISSAL_KEY_PREFIX = "vybe:pwa-install-dismissed-until:v1";
const DISMISSAL_DAYS = 30;
const DASHBOARD_DWELL_MS = 20_000;

function dismissalKey(userId: string) {
  return `${DISMISSAL_KEY_PREFIX}:${userId}`;
}

function isDismissed(userId: string) {
  const raw = window.localStorage.getItem(dismissalKey(userId));
  const until = raw ? Number(raw) : 0;
  if (!Number.isFinite(until) || until <= Date.now()) {
    if (raw) window.localStorage.removeItem(dismissalKey(userId));
    return false;
  }
  return true;
}

function suppressInstallPrompt(userId: string) {
  const until = Date.now() + DISMISSAL_DAYS * 24 * 60 * 60 * 1000;
  window.localStorage.setItem(dismissalKey(userId), String(until));
}

export function CreatorPwaInstallPrompt() {
  const { hasRole, isLoading, user } = useUser();
  const { canInstall, isIos, install } = usePwaInstall();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(true);
  const [dashboardReady, setDashboardReady] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setDismissed(true);
      return;
    }
    setDismissed(isDismissed(user.id));
  }, [user?.id]);

  useEffect(() => {
    setDashboardReady(false);
    if (location.pathname !== "/dashboard") return;
    const timer = window.setTimeout(() => setDashboardReady(true), DASHBOARD_DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  const dismissForThirtyDays = () => {
    if (user?.id) suppressInstallPrompt(user.id);
    setDismissed(true);
  };

  const beginInstall = async () => {
    await install();
    dismissForThirtyDays();
  };

  if (
    isLoading ||
    !hasRole("creator") ||
    !user?.id ||
    location.pathname !== "/dashboard" ||
    !dashboardReady ||
    dismissed ||
    (!canInstall && !isIos)
  ) {
    return null;
  }

  return (
    <aside className="border-b border-primary/25 bg-primary/8 px-4 py-3 sm:px-5 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            {isIos ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-sm font-semibold">
              {isIos ? "Install from the Share menu" : "Install VYBE Creator"}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {isIos
                ? "This message is a guide: tap Share above, choose Add to Home Screen, then tap Add."
                : "Add your Creator Studio to this device for faster access from your home screen."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {canInstall ? (
            <Button
              size="sm"
              className="bg-gradient-brand text-primary-foreground"
              onClick={beginInstall}
            >
              <Download className="mr-2 h-4 w-4" />
              Install
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            aria-label="Dismiss install message for 30 days"
            onClick={dismissForThirtyDays}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
