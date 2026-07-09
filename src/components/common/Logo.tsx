import { APP_NAME } from "@/constants/app";
import { cn } from "@/lib/utils";

export function Logo({
  variant = "mark",
  className,
}: {
  variant?: "mark" | "horizontal" | "stacked";
  className?: string;
}) {
  const src =
    variant === "horizontal"
      ? "/branding/logo-horizontal.svg"
      : variant === "stacked"
        ? "/branding/logo-stacked.svg"
        : "/branding/logo.svg";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img src={src} alt={`${APP_NAME} logo`} className="h-7 w-auto" />
      {variant === "mark" && (
        <span className="font-display text-lg font-bold tracking-tight">{APP_NAME}</span>
      )}
    </span>
  );
}
