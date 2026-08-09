import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceSectionProps {
  title: string;
  description?: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function WorkspaceSection({
  title,
  description,
  count,
  action,
  children,
  collapsible = false,
  defaultOpen = true,
  className,
}: WorkspaceSectionProps) {
  const heading = (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">{title}</h2>
          {typeof count === "number" ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {count}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );

  if (collapsible) {
    return (
      <details
        open={defaultOpen}
        className={cn(
          "group overflow-hidden rounded-2xl border border-border bg-card",
          className,
        )}
      >
        <summary className="flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden">
          {heading}
          <ChevronDown className="mr-4 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-border/70">{children}</div>
      </details>
    );
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      {heading}
      <div className="border-t border-border/70">{children}</div>
    </section>
  );
}
