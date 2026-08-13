import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { supporterExperienceService } from "@/services/supporter/supporterExperienceService";

export const Route = createFileRoute("/_authenticated/supporter-interests")({
  component: () => <RoleGuard allow={["supporter", "creator", "business", "admin"]}><SupporterInterests /></RoleGuard>,
});

const genres = ["Hip-Hop", "R&B", "Rock", "Country", "Pop", "Electronic", "Gospel & Soul", "Jazz & Lo-fi"];
const contentTypes = ["Music", "Videos", "Stories", "Events", "Communities", "Games"];

function SupporterInterests() {
  const { user } = useUser();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supporterExperienceService.preferences(user.id)
      .then((value) => { setSelectedGenres(value.genres); setSelectedTypes(value.content_types); })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Preferences could not load."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const toggle = (value: string, current: string[], set: (next: string[]) => void) =>
    set(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await supporterExperienceService.savePreferences(user.id, {
        genres: selectedGenres,
        content_types: selectedTypes,
        discovery_radius: "anywhere",
      });
      toast.success("Your discovery interests were saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preferences could not be saved.");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex min-h-[45vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  return <div className="mx-auto max-w-5xl space-y-6">
    <WorkspacePageHeader eyebrow="Your discovery" title="Tune your interests" description="Choose what you enjoy. VYBE will use these choices to make discovery more useful without making them public." />
    <Card><CardContent className="p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Sounds you want to discover</h2>
      <p className="mt-1 text-sm text-muted-foreground">Pick as many as you like. You can change these choices anytime.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{genres.map((genre) => <button key={genre} type="button" onClick={() => toggle(genre, selectedGenres, setSelectedGenres)} className={cn("flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left text-sm font-medium transition", selectedGenres.includes(genre) && "border-primary bg-primary/10 text-primary")}><span>{genre}</span>{selectedGenres.includes(genre) ? <Check className="h-4 w-4" /> : null}</button>)}</div>
    </CardContent></Card>
    <Card><CardContent className="p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Experiences you want to see</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{contentTypes.map((type) => <button key={type} type="button" onClick={() => toggle(type, selectedTypes, setSelectedTypes)} className={cn("flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left text-sm font-medium transition", selectedTypes.includes(type) && "border-primary bg-primary/10 text-primary")}><span>{type}</span>{selectedTypes.includes(type) ? <Check className="h-4 w-4" /> : null}</button>)}</div>
    </CardContent></Card>
    <div className="flex flex-wrap gap-3"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Save my interests</Button><Button asChild variant="outline"><Link to="/discover">Explore VYBE <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
  </div>;
}
