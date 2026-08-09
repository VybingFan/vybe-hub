import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WorkspacePageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  status?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function WorkspacePageHeader({
  eyebrow,
  title,
  description,
  status,
  action,
  className,
}: WorkspacePageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {status}
        </div>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex shrink-0 items-center gap-2">{action}</div>
      ) : null}
    </header>
  );
}
