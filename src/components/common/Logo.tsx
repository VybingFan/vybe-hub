import { APP_NAME } from "@/constants/app";
import { cn } from "@/lib/utils";

export function Logo({
  variant = "mark",
  className,
}: {
  variant?: "mark" | "horizontal" | "stacked";
  className?: string;
}) {
  const isMark = variant === "mark";
  const src = isMark ? "/branding/vybe-mark.webp" : "/branding/vybe-lockup.webp";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src={src}
        alt={`${APP_NAME} logo`}
        className={cn(
          "shrink-0 object-contain",
          isMark && "h-9 w-11 rounded-lg",
          variant === "horizontal" && "h-16 w-auto",
          variant === "stacked" && "h-24 w-auto",
        )}
      />
      {isMark && (
        <span className="font-display text-lg font-bold tracking-tight">{APP_NAME}</span>
      )}
    </span>
  );
}
