import { Download, Share2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/components/pwa/pwaInstallContext";

export function BackOfficeInstallCard() {
  const { canInstall, isIos, install } = usePwaInstall();

  return (
    <div className="mt-5 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-violet-500/15 p-2 text-violet-300">
          <Smartphone className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-100">Install VYBE Back Office</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Add the secure Operations workspace to your computer, phone, or tablet with its own Back Office icon.
          </p>

          {canInstall ? (
            <Button
              type="button"
              size="sm"
              className="mt-3"
              onClick={() => void install()}
            >
              <Download className="mr-2 h-4 w-4" /> Install Back Office
            </Button>
          ) : isIos ? (
            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-400">
              <Share2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
              In Safari, tap Share, then Add to Home Screen.
            </p>
          ) : (
            <p className="mt-3 text-xs leading-5 text-slate-500">
              In Chrome or Edge, use the browser&apos;s Install app option when it appears.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
