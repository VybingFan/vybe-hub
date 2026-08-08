import { useEffect, useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getActiveIdentity } from "@/components/identity/IdentityModeBar";
import { supabase } from "@/integrations/supabase/client";

export function PlaylistSaveButton({ playlistId }: { playlistId: string }) {
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const load = async () => {
      const identity = getActiveIdentity();
      if (!identity || identity.identity_type !== "supporter") return setSaved(false);
      const { data } = await supabase
        .from("identity_reactions")
        .select("id")
        .eq("identity_id", identity.id)
        .eq("reaction_type", "save")
        .eq("entity_type", "playlist")
        .eq("entity_id", playlistId)
        .maybeSingle();
      setSaved(Boolean(data));
    };
    void load();
    window.addEventListener("vybe:identity-changed", load);
    return () => window.removeEventListener("vybe:identity-changed", load);
  }, [playlistId]);

  async function toggle() {
    const identity = getActiveIdentity();
    if (!identity) return toast.error("Sign in and use Supporter Mode to save playlists.");
    if (identity.identity_type !== "supporter")
      return toast.error("Switch to Supporter Mode to save playlists.");
    setPending(true);
    try {
      if (saved) {
        const { error } = await supabase
          .from("identity_reactions")
          .delete()
          .eq("identity_id", identity.id)
          .eq("reaction_type", "save")
          .eq("entity_type", "playlist")
          .eq("entity_id", playlistId);
        if (error) throw error;
        setSaved(false);
        toast.success("Playlist removed from saved items.");
      } else {
        const { error } = await supabase
          .from("identity_reactions")
          .upsert(
            {
              identity_id: identity.id,
              reaction_type: "save",
              entity_type: "playlist",
              entity_id: playlistId,
            },
            { onConflict: "identity_id,reaction_type,entity_type,entity_id" },
          );
        if (error) throw error;
        setSaved(true);
        toast.success("Playlist saved.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the saved playlist.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void toggle()}
      disabled={pending}
      className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
      aria-pressed={saved}
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Bookmark className={saved ? "mr-2 h-4 w-4 fill-current" : "mr-2 h-4 w-4"} />
      )}
      {saved ? "Saved" : "Save playlist"}
    </Button>
  );
}
