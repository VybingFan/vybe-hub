import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className, size = 24 }: { className?: string; size?: number }) {
  return <Loader2 className={cn("animate-spin text-primary", className)} size={size} />;
}

export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <LoadingSpinner size={32} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
