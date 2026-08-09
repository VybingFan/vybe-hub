import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CompactListRowProps {
  leading?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  metadata?: ReactNode;
  status?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CompactListRow({
  leading,
  title,
  description,
  metadata,
  status,
  action,
  className,
}: CompactListRowProps) {
  return (
    <div
      className={cn(
        "flex min-h-14 items-center gap-3 border-b border-border/60 px-3 py-2.5 last:border-b-0 sm:px-4",
        className,
      )}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <div className="min-w-0 truncate text-sm font-medium">{title}</div>
          {status}
        </div>
        {description ? (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {description}
          </div>
        ) : null}
      </div>
      {metadata ? (
        <div className="hidden shrink-0 text-xs text-muted-foreground sm:block">
          {metadata}
        </div>
      ) : null}
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
