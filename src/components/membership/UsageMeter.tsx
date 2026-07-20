import { Progress } from "@/components/ui/progress";

export function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{used} of {limit}</span>
      </div>
      <Progress value={percent} aria-label={`${label}: ${used} of ${limit}`} />
    </div>
  );
}
