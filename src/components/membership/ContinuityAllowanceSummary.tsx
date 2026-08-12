import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Summary = {
  targetPlan: string;
  endsAt: string;
  limits: Record<string, number>;
  selected: Record<string, number>;
};

const labels: Record<string, string> = {
  track: "Music",
  playlist: "Playlists",
  merch: "Merchandise",
  story: "Stories",
};

export function ContinuityAllowanceSummary() {
  const { data } = useQuery({
    queryKey: ["content-continuity-allowances"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_my_content_continuity_allowances");
      if (error) throw error;
      return data as Summary | null;
    },
  });

  if (!data) return null;

  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">Public continuity allowance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose what remains public under {data.targetPlan.replaceAll("_", " ")}.
          </p>
        </div>
        <span className="rounded-full border px-3 py-1 text-xs font-medium">No content is deleted</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(data.limits).map(([type, limit]) => (
          <div key={type} className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">{labels[type] ?? type}</p>
            <p className="mt-1 text-lg font-semibold">{data.selected[type] ?? 0} / {limit}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Unchosen work stays unchanged during the adjustment period, then remains privately stored. Linked external videos are not counted as native video hosting.
      </p>
    </section>
  );
}
