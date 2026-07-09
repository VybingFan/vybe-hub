import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Section({ title, description, action, className, children }: SectionProps) {
  return (
    <section className={cn("space-y-6", className)}>
      {(title || action) && (
        <header className="flex items-end justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
